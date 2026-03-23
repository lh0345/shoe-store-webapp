#!/usr/bin/env python3
"""
Simple HTTP server for Single Page Application (SPA)
Serves index.html for all routes to enable client-side routing
"""

import http.server
import socketserver
import os
import json
import time
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse, parse_qs

_REPO_ROOT = Path(__file__).resolve().parent.parent
os.chdir(_REPO_ROOT)

API_KEY = os.environ.get('API_KEY', 'demo-key-123')  # Default for demo

# Simple rate limiting
rate_limits = defaultdict(list)
RATE_LIMIT_REQUESTS = 100  # requests per window
RATE_LIMIT_WINDOW = 60  # seconds

def is_rate_limited(client_ip):
    now = time.time()
    # Clean old entries
    rate_limits[client_ip] = [t for t in rate_limits[client_ip] if now - t < RATE_LIMIT_WINDOW]
    if len(rate_limits[client_ip]) >= RATE_LIMIT_REQUESTS:
        return True
    rate_limits[client_ip].append(now)
    return False

class SPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler that serves index.html for SPA routes"""
    
    def __init__(self, *args, **kwargs):
        self.requested_path = None
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        # Store the requested path for use in end_headers
        self.requested_path = self.path
        parsed = urlparse(self.path)
        req_path = parsed.path

        # Handle config requests
        if req_path == '/config.js':
            self.handle_config_request()
            return

        # Public catalog JSON via API (matches DataService GET /api/products)
        if req_path == '/api/products':
            self.handle_get_products()
            return

        # Wishlist read (matches DataService GET /api/wishlist?userId=)
        if req_path == '/api/wishlist':
            self.handle_get_wishlist(parsed)
            return
        
        # Get the requested path (strip query string for filesystem lookup)
        path = self.translate_path(req_path)
        
        # If path doesn't exist and it's not a file with extension, serve index.html
        if not os.path.exists(path) and '.' not in os.path.basename(req_path):
            self.path = '/index.html'
        
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def do_POST(self):
        client_ip = self.client_address[0]
        if is_rate_limited(client_ip):
            self.send_error(429, 'Too Many Requests')
            return
        
        req_path = urlparse(self.path).path

        # Check API key for API endpoints
        if req_path.startswith('/api/'):
            auth_header = self.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer ') or auth_header[7:] != API_KEY:
                self.send_error(401, 'Unauthorized')
                return
        
        if req_path == '/api/products':
            self.handle_products_api()
        elif req_path == '/api/wishlist':
            self.handle_wishlist_api()
        else:
            self.send_error(404)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def handle_products_api(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            action = data.get('action')
            product = data.get('product')
            
            if not action or not product:
                self.send_error(400, "Missing action or product")
                return
            
            # Read products.json
            products_file = Path('data/products.json')
            if not products_file.exists():
                self.send_error(500, "Products file not found")
                return
            
            with open(products_file, 'r') as f:
                products = json.load(f)
            
            # Update products
            if action == 'create':
                # Generate new ID
                max_id = max((p.get('id', 0) for p in products), default=0)
                product['id'] = max_id + 1
                products.append(product)
            elif action == 'update':
                # Find and update
                for i, p in enumerate(products):
                    if p.get('id') == product.get('id'):
                        products[i] = product
                        break
                else:
                    self.send_error(404, "Product not found")
                    return
            elif action == 'delete':
                products = [p for p in products if p.get('id') != product.get('id')]
            else:
                self.send_error(400, "Invalid action")
                return
            
            # Write back
            with open(products_file, 'w') as f:
                json.dump(products, f, indent=2)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode())
            
        except Exception as e:
            self.send_error(500, str(e))
    
    def handle_wishlist_api(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            action = data.get('action')
            user_id = data.get('userId')
            wishlist = data.get('wishlist', [])
            
            if not action or not user_id:
                self.send_error(400, "Missing action or userId")
                return
            
            # Create data directory if it doesn't exist
            data_dir = Path('data')
            data_dir.mkdir(exist_ok=True)
            
            wishlist_file = data_dir / f'wishlist_{user_id}.json'
            
            if action == 'save':
                # Save wishlist
                with open(wishlist_file, 'w') as f:
                    json.dump(wishlist, f, indent=2)
            elif action == 'load':
                # Load wishlist
                if wishlist_file.exists():
                    with open(wishlist_file, 'r') as f:
                        wishlist = json.load(f)
                else:
                    wishlist = []
            else:
                self.send_error(400, "Invalid action")
                return
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'wishlist': wishlist}).encode())
            
        except Exception as e:
            self.send_error(500, str(e))

    def handle_get_wishlist(self, parsed):
        """GET /api/wishlist?userId= — same payload as POST load (DataService read path)."""
        try:
            auth_header = self.headers.get('Authorization', '')
            if not auth_header.startswith('Bearer ') or auth_header[7:] != API_KEY:
                self.send_error(401, 'Unauthorized')
                return
            qs = parse_qs(parsed.query)
            user_ids = qs.get('userId', [])
            if not user_ids:
                self.send_error(400, 'Missing userId')
                return
            user_id = user_ids[0]
            data_dir = Path('data')
            data_dir.mkdir(exist_ok=True)
            wishlist_file = data_dir / f'wishlist_{user_id}.json'
            if wishlist_file.exists():
                with open(wishlist_file, 'r', encoding='utf-8') as f:
                    wishlist = json.load(f)
            else:
                wishlist = []
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True, 'wishlist': wishlist}).encode('utf-8'))
        except Exception as e:
            self.send_error(500, str(e))
    
    def handle_get_products(self):
        """Return data/products.json for client DataService / admin tooling."""
        try:
            products_file = Path('data/products.json')
            if not products_file.exists():
                self.send_error(404, 'Products file not found')
                return
            with open(products_file, 'r', encoding='utf-8') as f:
                products = json.load(f)
            body = json.dumps(products).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'public, max-age=60')
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            self.send_error(500, str(e))

    def handle_config_request(self):
        """Serve environment config for browser"""
        try:
            config = {}
            
            # Read .env.local if it exists
            env_file = Path('.env.local')
            if env_file.exists():
                with open(env_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            key, _, value = line.partition('=')
                            if key and value:
                                config[key] = value
            
            # Send as JavaScript
            self.send_response(200)
            self.send_header('Content-type', 'application/javascript')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            # Create JavaScript that sets global config
            js_config = f"window.ENV_CONFIG = {json.dumps(config)};"
            self.wfile.write(js_config.encode())
            
        except Exception as e:
            self.send_error(500, str(e))
    
    def end_headers(self):
        # Add aggressive no-cache headers
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, no-transform')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Last-Modified', self.date_time_string())
        self.send_header('ETag', '')
        self.send_header('Vary', '*')
        super().end_headers()

PORT = 8000

def main():
    with socketserver.TCPServer(("", PORT), SPAHTTPRequestHandler) as httpd:
        print(f"🛋️  COUCH Server running at http://localhost:{PORT}/")
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
