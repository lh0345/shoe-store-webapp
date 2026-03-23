/* DataService.js - Secure data persistence with server-side API proxy
 *
 * Security Features:
 * - No direct client-side database access
 * - Server-side API proxy for sensitive operations
 * - Input validation and sanitization
 * - localStorage fallback for offline functionality
 *
 * Architecture:
 * - Secure API calls for wishlist/config data
 * - Caching for performance
 * - Graceful degradation on network failures
 *
 * API Endpoints:
 * - POST /api/wishlist - Save/load wishlist data
 * - POST /api/products - Admin product management
 */
import { sanitizeInput } from '../utils/helpers.js';

// Remove direct Supabase client usage for security

export class DataService {
  constructor(basePath = './data') {
    this.basePath = basePath;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    // Use secure server API instead of direct Supabase access
    this.apiBase = '/api';
    this.supabaseAvailable = false; // No longer using client-side Supabase
  }

  getEnvVar(key) {
    // Check global config loaded from server
    if (typeof window !== 'undefined' && window.ENV_CONFIG?.[key]) {
      return window.ENV_CONFIG[key];
    }
    /* eslint-disable no-undef */
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key];
    }
    /* eslint-enable no-undef */
    // Environment variables are handled by the server config endpoint
    return undefined;
  }

  getApiKey() {
    return this.getEnvVar('API_KEY') || 'demo-key-123';
  }

  // Generic file operations with secure API
  async readJSON(filename) {
    try {
      // Try secure API first for supported endpoints
      if (this.shouldUseSecureAPI(filename) && typeof process === 'undefined') {
        const data = await this.readFromSecureAPI(filename);
        if (data !== null) {
          // Cache the result
          this.cache.set(filename, { data, timestamp: Date.now() });
          return data;
        }
      }

      // Catalog JSON is the source of truth on static hosts (no GET /api/products there)
      if (filename === 'products') {
        try {
          const response = await fetch('/data/products.json');
          if (response.ok) {
            const data = await response.json();
            this.cache.set(filename, { data, timestamp: Date.now() });
            return data;
          }
        } catch (e) {
          console.warn('Could not load /data/products.json:', e);
        }
      }

      // Fallback to localStorage
      const key = `data_${filename}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        // Cache the result
        this.cache.set(filename, { data, timestamp: Date.now() });
        return data;
      }

      return null;
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return null;
    }
  }

  async writeJSON(filename, data) {
    try {
      // Validate data before saving
      if (!this.validateDataStructure(filename, data)) {
        throw new Error(`Invalid data structure for ${filename}`);
      }

      // Try secure API first if available
      if (this.shouldUseSecureAPI(filename)) {
        try {
          await this.writeToSecureAPI(filename, data);
          console.log(`✅ Saved ${filename} via secure API`);
        } catch (apiError) {
          console.warn(
            `Failed to save ${filename} via secure API, using localStorage:`,
            apiError.message
          );
          // Continue to localStorage fallback
        }
      }

      // Always save to localStorage as backup
      const key = `data_${filename}`;
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      return false;
    }
  }

  shouldUseSecureAPI(filename) {
    // Use secure API for data that needs server-side access
    return (
      filename === 'products' || filename.includes('wishlist_') || filename.includes('config_')
    );
  }

  async readFromSecureAPI(filename) {
    try {
      if (filename === 'products') {
        const response = await fetch(`${this.apiBase}/products`);
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        return await response.json();
      }

      if (filename.includes('wishlist_')) {
        const userId = filename.replace('wishlist_', '');
        const response = await fetch(`${this.apiBase}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.getApiKey()}`,
          },
          body: JSON.stringify({
            action: 'load',
            userId: userId,
          }),
        });
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        const data = await response.json();
        return data.wishlist || [];
      }

      if (filename.includes('config_')) {
        // const userId = filename.replace('config_', '');
        // Config reading not implemented in secure API yet
        return null;
      }

      return null;
    } catch (error) {
      console.error(`Secure API read error for ${filename}:`, error);
      return null;
    }
  }

  async readFromSupabase(filename) {
    const maxRetries = 2;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        if (filename.includes('wishlist_')) {
          const userId = filename.replace('wishlist_', '');
          const { data, error } = await this.supabase
            .from('wishlist')
            .select('product_ids')
            .eq('user_id', userId)
            .single();

          if (error && error.code !== 'PGRST116') {
            // Not found error is OK
            throw error;
          }

          return data?.product_ids || [];
        }

        if (filename.includes('config_')) {
          const userId = filename.replace('config_', '');
          const { data, error } = await this.supabase
            .from('user_config')
            .select('config')
            .eq('user_id', userId)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          return data?.config || {};
        }

        if (filename === 'products') {
          const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        }

        return null;
      } catch (error) {
        console.error(`Supabase read error for ${filename}:`, error);

        // Check if this is a retryable network error
        if (retryCount < maxRetries && this.isNetworkError(error)) {
          console.log(`Retrying Supabase read for ${filename} (attempt ${retryCount + 1})`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          retryCount++;
          continue;
        }

        // Mark Supabase as unavailable on persistent errors
        if (retryCount >= maxRetries) {
          console.warn('Supabase appears to be unavailable, switching to localStorage fallback');
          this.supabaseAvailable = false;
        }

        throw error;
      }
    }
  }

  async writeToSecureAPI(filename, data) {
    try {
      if (filename.includes('wishlist_')) {
        const userId = filename.replace('wishlist_', '');
        const response = await fetch(`${this.apiBase}/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.getApiKey()}`,
          },
          body: JSON.stringify({
            action: 'save',
            userId: userId,
            wishlist: data,
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
      }

      if (filename.includes('config_')) {
        // Config writing not implemented in secure API yet
        return null;
      }

      // Products are handled by admin operations, not client-side writes
      if (filename === 'products') {
        console.warn('Client-side product updates not allowed for security');
        return null;
      }

      return null;
    } catch (error) {
      console.error(`Secure API write error for ${filename}:`, error);
      throw error;
    }
  }

  validateDataStructure(filename, data) {
    switch (filename) {
      case 'wishlist':
        return Array.isArray(data) && data.every((item) => typeof item === 'string');

      case 'user_config':
        return typeof data === 'object' && data !== null;

      case 'products':
        return (
          Array.isArray(data) &&
          data.every(
            (item) =>
              typeof item === 'object' &&
              item !== null &&
              typeof item.id === 'number' &&
              typeof item.name === 'string'
          )
        );

      default:
        return true; // Allow unknown structures for flexibility
    }
  }

  // Wishlist operations
  async getWishlist(userId) {
    const data = await this.readJSON(`wishlist_${userId}`);
    return data || [];
  }

  async saveWishlist(userId, wishlist) {
    // Validate wishlist items
    const validWishlist = wishlist.filter(
      (item) => typeof item === 'string' && item.length > 0 && item.length < 100
    );

    return await this.writeJSON(`wishlist_${userId}`, validWishlist);
  }

  // User config operations
  async getUserConfig(userId) {
    const data = await this.readJSON(`config_${userId}`);
    return data || {};
  }

  async saveUserConfig(userId, config) {
    // Sanitize config values
    const sanitizedConfig = {};

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        sanitizedConfig[key] = sanitizeInput(value, 500);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitizedConfig[key] = this.sanitizeObject(value);
      } else {
        sanitizedConfig[key] = value;
      }
    }

    return await this.writeJSON(`config_${userId}`, sanitizedConfig);
  }

  sanitizeObject(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value, 500);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // Product operations
  async getProducts() {
    const data = await this.readJSON('products');
    return data || [];
  }

  async saveProduct(product) {
    try {
      const products = await this.getProducts();
      const index = products.findIndex((p) => p.id === product.id);

      // Validate product data
      const validatedProduct = this.validateProduct(product);

      if (index > -1) {
        products[index] = validatedProduct;
      } else {
        validatedProduct.id = Date.now(); // Simple ID generation
        products.push(validatedProduct);
      }

      return await this.writeJSON('products', products);
    } catch (error) {
      console.error('Error saving product:', error);
      return false;
    }
  }

  validateProduct(product) {
    return {
      id: product.id || Date.now(),
      name: sanitizeInput(product.name, 100),
      brand: sanitizeInput(product.brand, 50),
      price: product.price,
      description: sanitizeInput(product.description, 1000),
      // Add other validations as needed
      ...product,
    };
  }

  // Check if Supabase is available
  isSupabaseAvailable() {
    return this.supabaseAvailable && this.supabase !== null;
  }

  // Force refresh Supabase connection
  async refreshSupabaseConnection() {
    this.supabaseAvailable = false;
    await this.initSupabase();
  }

  // Get connection status for debugging
  getConnectionStatus() {
    return {
      supabaseAvailable: this.supabaseAvailable,
      hasSupabaseClient: this.supabase !== null,
      cacheSize: this.cache.size,
    };
  }

  isNetworkError(error) {
    // Check for common network-related errors
    return (
      error.message?.includes('fetch') ||
      error.message?.includes('network') ||
      error.message?.includes('timeout') ||
      error.code === 'PGRST301' || // Connection error
      !navigator.onLine
    ); // Browser offline
  }
}
