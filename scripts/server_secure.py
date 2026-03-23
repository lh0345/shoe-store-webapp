#!/usr/bin/env python3
"""
Secure HTTP server for Single Page Application (SPA)
Serves index.html for all routes to enable client-side routing
Includes secure Supabase proxy to prevent API key exposure
"""

import http.server
import socketserver
import os
import json
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import hashlib
import hmac
import secrets
from functools import wraps

# Third-party imports (install with: pip install supabase-py python-dotenv)
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*_a, **_k):
        pass

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️  Supabase dependencies not installed. Install with: pip install supabase-py python-dotenv")

_REPO_ROOT = Path(__file__).resolve().parent.parent
os.chdir(_REPO_ROOT)

# Load environment variables from repository root
load_dotenv('.env.local')

PORT = int(os.environ.get('PORT', 8002))

# Rate limiting storage
rate_limit_store = {}

class SecureSPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with security features and Supabase proxy"""

    def __init__(self, *args, **kwargs):
        self.requested_path = None
        self.supabase_client = None
        super().__init__(*args, **kwargs)

    def setup_supabase(self):
        """Initialize Supabase client with service role key"""
        if not SUPABASE_AVAILABLE:
            return False

        try:
            supabase_url = os.environ.get('SUPABASE_URL')
            supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

            if not supabase_url or not supabase_key:
                print("⚠️  Supabase credentials not configured")
                return False

            self.supabase_client = create_client(supabase_url, supabase_key)
            return True
        except Exception as e:
            print(f"❌ Failed to initialize Supabase: {e}")
            return False

    def check_rate_limit(self, identifier, max_requests=100, window_seconds=3600):
        """Check if request exceeds rate limit"""
        current_time = time.time()
        window_start = current_time - window_seconds

        if identifier not in rate_limit_store:
            rate_limit_store[identifier] = []

        # Remove old requests outside the window
        rate_limit_store[identifier] = [
            req_time for req_time in rate_limit_store[identifier]
            if req_time > window_start
        ]

        # Check if under limit
        if len(rate_limit_store[identifier]) >= max_requests:
            return False, len(rate_limit_store[identifier])

        # Add current request
        rate_limit_store[identifier].append(current_time)
        return True, len(rate_limit_store[identifier])

    def authenticate_request(self):
        """Basic authentication check for admin operations"""
        auth_header = self.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return False

        token = auth_header[7:]  # Remove 'Bearer '

        # In production, validate JWT token properly
        # For now, check against environment variable
        expected_token = os.environ.get('ADMIN_API_TOKEN')
        if not expected_token:
            return False

        return hmac.compare_digest(token, expected_token)

    def sanitize_error_response(self, error):
        """Sanitize error messages to prevent information leakage"""
        error_str = str(error)
        # Remove sensitive information
        if 'password' in error_str.lower():
            return 'Authentication error'
        if 'key' in error_str.lower():
            return 'Configuration error'
        return 'Internal server error'

    def do_GET(self):
        # Store the requested path for use in end_headers
        self.requested_path = self.path

        # Handle API requests
        if self.path.startswith('/api/'):
            self.handle_api_request()
            return

        # Handle config requests (but don't expose sensitive data)
        if self.path == '/config.js':
            self.handle_secure_config_request()
            return

        # Get the requested path
        path = self.translate_path(self.path)

        # If path doesn't exist and it's not a file with extension, serve index.html
        if not os.path.exists(path) and '.' not in os.path.basename(self.path):
            self.path = '/index.html'

        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_cors_headers()
        self.end_headers()

    def send_cors_headers(self):
        """Send CORS headers for API requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')

    def handle_api_request(self):
        """Handle API requests with security checks"""
        try:
            # Rate limiting
            client_ip = self.client_address[0]
            allowed, request_count = self.check_rate_limit(client_ip, max_requests=1000, window_seconds=3600)
            if not allowed:
                self.send_error(429, 'Too many requests')
                return

            # Parse path
            path_parts = self.path.strip('/').split('/')
            if len(path_parts) < 2 or path_parts[0] != 'api':
                self.send_error(404)
                return

            endpoint = path_parts[1]

            # Initialize Supabase if needed
            if not self.supabase_client and not self.setup_supabase():
                self.send_error(500, 'Database unavailable')
                return

            # Route to appropriate handler
            if endpoint == 'products':
                self.handle_products_api()
            elif endpoint == 'wishlist':
                self.handle_wishlist_api()
            elif endpoint == 'auth':
                self.handle_auth_api()
            elif endpoint == 'orders':
                self.handle_orders_api()
            else:
                self.send_error(404)

        except Exception as e:
            print(f"API Error: {e}")
            self.send_error(500, self.sanitize_error_response(e))

    def handle_products_api(self):
        """Secure products API with proper validation"""
        try:
            # Rate limiting for product operations
            client_ip = self.client_address[0]
            allowed, _ = self.check_rate_limit(f"products_{client_ip}", max_requests=500, window_seconds=3600)
            if not allowed:
                self.send_error(429, 'Too many product requests')
                return

            if self.command == 'GET':
                # Get products (public read access)
                result = self.supabase_client.table('products').select('*').eq('active', True).execute()
                products = result.data

                self.send_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(products).encode())

            elif self.command in ['POST', 'PUT', 'DELETE']:
                # Admin operations require authentication
                if not self.authenticate_request():
                    self.send_error(401, 'Unauthorized')
                    return

                if self.command == 'POST':
                    # Create product
                    content_length = int(self.headers['Content-Length'])
                    post_data = self.rfile.read(content_length)
                    product_data = json.loads(post_data.decode('utf-8'))

                    # Validate required fields
                    required_fields = ['name', 'price']
                    if not all(field in product_data for field in required_fields):
                        self.send_error(400, 'Missing required fields')
                        return

                    # Sanitize input
                    product_data = self.sanitize_product_data(product_data)

                    result = self.supabase_client.table('products').insert(product_data).execute()

                    self.send_cors_headers()
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(result.data[0]).encode())

                elif self.command == 'PUT':
                    # Update product
                    content_length = int(self.headers['Content-Length'])
                    post_data = self.rfile.read(content_length)
                    update_data = json.loads(post_data.decode('utf-8'))

                    product_id = update_data.get('id')
                    if not product_id:
                        self.send_error(400, 'Product ID required')
                        return

                    # Remove id from update data
                    update_data.pop('id', None)
                    update_data = self.sanitize_product_data(update_data)

                    result = self.supabase_client.table('products').update(update_data).eq('id', product_id).execute()

                    self.send_cors_headers()
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(result.data[0] if result.data else {}).encode())

                elif self.command == 'DELETE':
                    # Delete product
                    parsed_path = urlparse(self.path)
                    query_params = parse_qs(parsed_path.query)
                    product_id = query_params.get('id', [None])[0]

                    if not product_id:
                        self.send_error(400, 'Product ID required')
                        return

                    self.supabase_client.table('products').delete().eq('id', product_id).execute()

                    self.send_cors_headers()
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode())

        except Exception as e:
            print(f"Products API Error: {e}")
            self.send_error(500, self.sanitize_error_response(e))

    def sanitize_product_data(self, data):
        """Sanitize product data to prevent injection"""
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                # Basic sanitization - remove potentially dangerous characters
                sanitized[key] = value.replace('<', '&lt;').replace('>', '&gt;').strip()
            elif isinstance(value, (int, float, bool)):
                sanitized[key] = value
            elif isinstance(value, list):
                sanitized[key] = [str(item).replace('<', '&lt;').replace('>', '&gt;').strip() for item in value]
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_product_data(value)
            # Skip other types for security
        return sanitized

    def handle_wishlist_api(self):
        """Secure wishlist API"""
        try:
            # Rate limiting
            client_ip = self.client_address[0]
            allowed, _ = self.check_rate_limit(f"wishlist_{client_ip}", max_requests=200, window_seconds=3600)
            if not allowed:
                self.send_error(429, 'Too many wishlist requests')
                return

            if self.command == 'GET':
                # Get wishlist for user
                parsed_path = urlparse(self.path)
                query_params = parse_qs(parsed_path.query)
                user_id = query_params.get('user_id', ['guest'])[0]

                result = self.supabase_client.table('wishlist').select('*').eq('user_id', user_id).execute()
                wishlist = result.data[0] if result.data else {'user_id': user_id, 'product_ids': []}

                self.send_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(wishlist).encode())

            elif self.command == 'POST':
                # Update wishlist
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                wishlist_data = json.loads(post_data.decode('utf-8'))

                user_id = wishlist_data.get('user_id', 'guest')
                product_ids = wishlist_data.get('product_ids', [])

                # Validate product_ids is a list
                if not isinstance(product_ids, list):
                    self.send_error(400, 'Invalid product_ids format')
                    return

                result = self.supabase_client.table('wishlist').upsert({
                    'user_id': user_id,
                    'product_ids': product_ids
                }).execute()

                self.send_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result.data[0]).encode())

        except Exception as e:
            print(f"Wishlist API Error: {e}")
            self.send_error(500, self.sanitize_error_response(e))

    def handle_auth_api(self):
        """Handle authentication requests"""
        try:
            # Stricter rate limiting for auth
            client_ip = self.client_address[0]
            allowed, _ = self.check_rate_limit(f"auth_{client_ip}", max_requests=10, window_seconds=3600)
            if not allowed:
                self.send_error(429, 'Too many authentication attempts')
                return

            if self.command == 'POST':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                auth_data = json.loads(post_data.decode('utf-8'))

                action = auth_data.get('action')

                if action == 'login':
                    # This would integrate with Supabase Auth
                    # For now, return not implemented
                    self.send_error(501, 'Authentication not implemented')
                else:
                    self.send_error(400, 'Invalid action')

        except Exception as e:
            print(f"Auth API Error: {e}")
            self.send_error(500, self.sanitize_error_response(e))

    def handle_orders_api(self):
        """Handle order requests"""
        try:
            # Rate limiting
            client_ip = self.client_address[0]
            allowed, _ = self.check_rate_limit(f"orders_{client_ip}", max_requests=50, window_seconds=3600)
            if not allowed:
                self.send_error(429, 'Too many order requests')
                return

            if self.command == 'POST':
                # Create order
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                order_data = json.loads(post_data.decode('utf-8'))

                # Validate order data
                required_fields = ['customer_name', 'customer_phone', 'items', 'total']
                if not all(field in order_data for field in required_fields):
                    self.send_error(400, 'Missing required fields')
                    return

                # Sanitize order data
                order_data = self.sanitize_order_data(order_data)

                # Generate order number
                order_data['order_number'] = f"ORD-{int(time.time())}-{secrets.token_hex(4).upper()}"

                result = self.supabase_client.table('orders').insert(order_data).execute()

                self.send_cors_headers()
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result.data[0]).encode())

        except Exception as e:
            print(f"Orders API Error: {e}")
            self.send_error(500, self.sanitize_error_response(e))

    def sanitize_order_data(self, data):
        """Sanitize order data"""
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                sanitized[key] = value.replace('<', '&lt;').replace('>', '&gt;').strip()
            elif isinstance(value, (int, float)):
                sanitized[key] = value
            elif isinstance(value, list):
                sanitized[key] = [self.sanitize_order_data(item) if isinstance(item, dict) else str(item).replace('<', '&lt;').replace('>', '&gt;').strip() for item in value]
            elif isinstance(value, dict):
                sanitized[key] = self.sanitize_order_data(value)
            elif isinstance(value, bool):
                sanitized[key] = value
        return sanitized

    def handle_secure_config_request(self):
        """Serve only non-sensitive config"""
        try:
            config = {}

            # Only expose non-sensitive config
            safe_keys = ['STORE_NAME', 'PRIMARY_COLOR', 'CONTACT_PHONE', 'CONTACT_EMAIL']
            for key in safe_keys:
                value = os.environ.get(key)
                if value:
                    config[key] = value

            # Send as JavaScript
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()

            js_config = f"window.ENV_CONFIG = {json.dumps(config)};"
            self.wfile.write(js_config.encode())

        except Exception as e:
            self.send_error(500, str(e))

    def end_headers(self):
        # Add security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')

        # Add aggressive no-cache headers
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, no-transform')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Last-Modified', self.date_time_string())
        self.send_header('ETag', '')
        self.send_header('Vary', '*')
        super().end_headers()

def main():
    with socketserver.TCPServer(("", PORT), SecureSPAHTTPRequestHandler) as httpd:
        print(f"🛡️  SECURE COUCH Server running at http://localhost:{PORT}/")
        print(f"📱 Customer Site: http://localhost:{PORT}/")
        print(f"🔐 Admin Panel: http://localhost:{PORT}/admin")
        print(f"🔑 Admin Login: http://localhost:{PORT}/admin-login")
        print("\nPress Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ Server stopped")

if __name__ == "__main__":
    main()