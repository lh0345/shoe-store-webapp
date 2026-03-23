/* ProductService.js - Enhanced product management with CRUD operations */
import { Shoe } from '../models/Shoe.js';
import { supabase } from '../config/supabase.js';

// Use global Supabase client singleton

/**
 * SUPABASE INTEGRATION (Recommended for Production)
 *
 * 1. Create Supabase table 'products':
 *    CREATE TABLE products (
 *      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *      name TEXT NOT NULL,
 *      brand TEXT,
 *      slug TEXT UNIQUE NOT NULL,
 *      price DECIMAL(10, 2),
 *      price_mkd TEXT,
 *      description TEXT,
 *      type TEXT,
 *      gender TEXT,
 *      material TEXT,
 *      style TEXT,
 *      colors TEXT[],
 *      sizes TEXT[],
 *      images JSONB,
 *      tags TEXT[],
 *      created_at TIMESTAMP DEFAULT NOW(),
 *      updated_at TIMESTAMP DEFAULT NOW()
 *    );
 *
 * 2. Replace CRUD methods with Supabase:
 *    - create() -> supabase.from('products').insert(productData)
 *    - getAll() -> supabase.from('products').select('*')
 *    - getById() -> supabase.from('products').select('*').eq('id', id).single()
 *    - update() -> supabase.from('products').update(updates).eq('id', id)
 *    - delete() -> supabase.from('products').delete().eq('id', id)
 *
 * 3. Enable realtime subscriptions for live updates:
 *    supabase.channel('products').on('postgres_changes',
 *      { event: '*', schema: 'public', table: 'products' },
 *      (payload) => this.handleRealtimeUpdate(payload)
 *    ).subscribe()
 */

export class ProductService {
  constructor(catalog) {
    this.catalog = catalog;
    this.storageKey = 'shoe_products';
    // Performance optimizations
    this.cache = new Map(); // ID-based cache
    this.slugCache = new Map(); // Slug-based cache
    this.searchIndex = new Map(); // Search optimization

    // Supabase client is intentionally null in `src/config/supabase.js` (no browser DB keys).
    this.supabase = supabase;
    this.supabaseAvailable = false;

    this.loadFromStorage();
    this.buildIndexes();
  }

  // Index building for performance
  buildIndexes() {
    this.cache.clear();
    this.slugCache.clear();
    this.searchIndex.clear();

    this.catalog.items.forEach((product) => {
      this.cache.set(product.id, product);
      this.slugCache.set(product.slug, product);
      this.indexProductForSearch(product);
    });
  }

  indexProductForSearch(product) {
    const terms = [
      ...product.name.toLowerCase().split(/\s+/),
      ...product.description.toLowerCase().split(/\s+/),
      ...product.tags.map((t) => t.toLowerCase()),
      product.type.toLowerCase(),
      product.brand ? product.brand.toLowerCase() : '',
      product.gender ? product.gender.toLowerCase() : '',
      product.material ? product.material.toLowerCase() : '',
      product.style ? product.style.toLowerCase() : '',
    ].filter(Boolean);

    terms.forEach((term) => {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term).add(product.id);
    });
  }

  invalidateCache(productId) {
    const product = this.cache.get(productId);
    if (product) {
      this.cache.delete(productId);
      this.slugCache.delete(product.slug);
    }
  }

  // Supabase initialization
  async initSupabase() {
    try {
      const supabaseUrl = this.getEnvVar('SUPABASE_URL');
      const supabaseKey = this.getEnvVar('SUPABASE_ANON_KEY');

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not found, using localStorage fallback');
        return;
      }

      // Use global Supabase client
      this.supabase = supabase;
      if (!this.supabase) {
        console.warn('Failed to initialize global Supabase client');
        return;
      }

      // Test connection
      const { error } = await this.supabase
        .from('products')
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      this.supabaseAvailable = true;
      console.log('✅ ProductService Supabase connected');
    } catch (error) {
      console.warn('❌ ProductService Supabase connection failed:', error.message);
      this.supabaseAvailable = false;
    }
  }

  getEnvVar(key) {
    // Check global config loaded from server
    if (typeof window !== 'undefined' && window.ENV_CONFIG?.[key]) {
      return window.ENV_CONFIG[key];
    }
    // Fallback for browser environment
    try {
      return import.meta.env?.[key];
    } catch {
      return undefined;
    }
  }

  // CREATE
  async create(productData) {
    try {
      // Try Supabase first if available
      if (this.supabase && this.supabaseAvailable) {
        try {
          // Prepare data for Supabase (convert to match schema)
          const supabaseData = {
            id: this.generateId(), // Generate numeric ID
            name: productData.name,
            brand: productData.brand || null,
            slug: this.generateSlug(productData.name),
            price: productData.priceMKD || productData.price || 0,
            description: productData.description || null,
            type: productData.type || 'sneakers',
            gender: productData.gender || 'unisex',
            material: productData.material || null,
            style: productData.style || null,
            colors: productData.availableColors || productData.colors || [],
            sizes: productData.availableSizes || productData.sizes || [],
            unavailable_sizes: productData.unavailableSizes || [],
            images: productData.images || {},
            tags: productData.tags || [],
          };

          const { data, error } = await this.supabase
            .from('products')
            .insert(supabaseData)
            .select()
            .single();

          if (error) throw error;

          // Create local product from Supabase response
          const product = new Shoe({
            id: data.id, // Now numeric
            slug: data.slug,
            name: data.name,
            brand: data.brand,
            price: data.price, // This becomes priceMKD in Shoe constructor
            colors: data.colors || [],
            sizes: data.sizes || [],
            unavailableSizes: data.unavailable_sizes || [],
            images: data.images || {},
            description: data.description,
            tags: data.tags || [],
            type: data.type,
            gender: data.gender,
            material: data.material,
            style: data.style,
          });

          this.catalog.items.push(product);
          this.cache.set(product.id, product);
          this.slugCache.set(product.slug, product);
          this.indexProductForSearch(product);
          this.saveToStorage();
          await this.syncToFile('create', product);
          return { success: true, product };
        } catch (supabaseError) {
          console.warn('Supabase create failed, falling back to local:', supabaseError.message);
          // Fall through to local storage implementation
        }
      }

      // Local storage fallback
      // Validation
      if (!productData.name || !productData.price) {
        return { success: false, error: 'Name and price are required' };
      }

      // Generate numeric ID and slug
      const id = this.generateId();
      const slug = this.generateSlug(productData.name);

      // Check if slug already exists
      if (await this.getBySlug(slug)) {
        return { success: false, error: 'A product with this name already exists' };
      }

      const product = new Shoe({ ...productData, id, slug });
      this.catalog.items.push(product);
      this.cache.set(product.id, product);
      this.slugCache.set(product.slug, product);
      this.indexProductForSearch(product);
      this.saveToStorage();
      await this.syncToFile('create', product);
      return { success: true, product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // READ (optimized with caching)
  async getAll() {
    // Try Supabase first if available
    if (this.supabase && this.supabaseAvailable) {
      try {
        const { data, error } = await this.supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        // Convert Supabase data to Shoe objects
        const products = data.map(
          (p) =>
            new Shoe({
              id: p.id,
              slug: p.slug,
              name: p.name,
              brand: p.brand,
              price: p.price, // This becomes priceMKD in Shoe constructor
              colors: p.colors || [],
              sizes: p.sizes || [],
              unavailableSizes: p.unavailable_sizes || [],
              images: p.images || {},
              description: p.description,
              tags: p.tags || [],
              type: p.type,
              gender: p.gender,
              material: p.material,
              style: p.style,
            })
        );

        // Update local catalog and caches
        this.catalog.items = products;
        this.buildIndexes();
        this.saveToStorage();

        return products;
      } catch (supabaseError) {
        console.warn('Supabase getAll failed, falling back to local:', supabaseError.message);
        // Fall through to local storage
      }
    }

    // Local storage fallback
    return this.catalog.all();
  }

  async getById(id) {
    // Use cache for O(1) lookup
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    return this.catalog.findById(id);
  }

  async getBySlug(slug) {
    // Use slug cache for O(1) lookup
    if (this.slugCache.has(slug)) {
      return this.slugCache.get(slug);
    }
    return this.catalog.findBySlug(slug);
  }

  // UPDATE
  async update(id, updates) {
    try {
      // Try Supabase first if available
      if (this.supabase && this.supabaseAvailable) {
        try {
          // Prepare data for Supabase update
          const supabaseUpdates = {};

          // Map field names to match Supabase schema
          if (updates.name !== undefined) supabaseUpdates.name = updates.name;
          if (updates.brand !== undefined) supabaseUpdates.brand = updates.brand;
          if (updates.price !== undefined) supabaseUpdates.price = updates.price;
          if (updates.description !== undefined) supabaseUpdates.description = updates.description;
          if (updates.type !== undefined) supabaseUpdates.type = updates.type;
          if (updates.gender !== undefined) supabaseUpdates.gender = updates.gender;
          if (updates.material !== undefined) supabaseUpdates.material = updates.material;
          if (updates.style !== undefined) supabaseUpdates.style = updates.style;
          if (updates.colors !== undefined) supabaseUpdates.colors = updates.colors;
          if (updates.sizes !== undefined) supabaseUpdates.sizes = updates.sizes;
          if (updates.unavailableSizes !== undefined)
            supabaseUpdates.unavailable_sizes = updates.unavailableSizes;
          if (updates.images !== undefined) supabaseUpdates.images = updates.images;
          if (updates.tags !== undefined) supabaseUpdates.tags = updates.tags;

          // Regenerate slug if name changed
          if (updates.name) {
            supabaseUpdates.slug = this.generateSlug(updates.name);
          }

          const { data, error } = await this.supabase
            .from('products')
            .update(supabaseUpdates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          // Update local product from Supabase response
          const product = await this.getById(id);
          if (product) {
            // Update the product with new data
            Object.assign(product, {
              name: data.name,
              brand: data.brand,
              slug: data.slug,
              price: data.price,
              priceMKD: data.price_mkd,
              priceEUR: data.price_mkd ? (data.price_mkd / 61.5).toFixed(2) : null,
              availableColors: data.colors || [],
              availableSizes: data.sizes || [],
              unavailableSizes: data.unavailable_sizes || [],
              images: data.images || [],
              description: data.description,
              tags: data.tags || [],
              type: data.type,
              gender: data.gender,
              material: data.material,
              style: data.style,
            });

            // Update caches
            this.cache.set(product.id, product);
            this.slugCache.set(product.slug, product);
            this.indexProductForSearch(product);
            this.saveToStorage();
            await this.syncToFile('update', product);
            return { success: true, product };
          }
        } catch (supabaseError) {
          console.warn('Supabase update failed, falling back to local:', supabaseError.message);
          // Fall through to local storage implementation
        }
      }

      // Local storage fallback (existing implementation)
      const product = await this.getById(id);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // Validation
      if (updates.name && updates.name.trim().length < 3) {
        return { success: false, error: 'Product name must be at least 3 characters' };
      }

      // Invalidate old cache entries
      this.invalidateCache(id);

      // Handle colors field mapping (admin sends 'colors', model uses 'availableColors')
      if (updates.colors !== undefined) {
        product.availableColors = Array.isArray(updates.colors) ? [...updates.colors] : [];
      }

      // Handle sizes field mapping
      if (updates.sizes !== undefined) {
        product.availableSizes = Array.isArray(updates.sizes)
          ? [...updates.sizes].sort((a, b) => parseFloat(a) - parseFloat(b))
          : [];
      }

      // Handle images update
      if (updates.images !== undefined) {
        product.images = { ...updates.images };
      }

      // Update fields
      Object.keys(updates).forEach((key) => {
        if (key !== 'id' && key !== 'colors' && key !== 'sizes' && updates[key] !== undefined) {
          product[key] = updates[key];
        }
      });

      // Regenerate slug if name changed
      if (updates.name && updates.name !== product.name) {
        const newSlug = this.generateSlug(updates.name);
        // Check if new slug conflicts with another product
        const existingProduct = this.getBySlug(newSlug);
        if (existingProduct && existingProduct.id !== product.id) {
          return { success: false, error: 'Another product with this name already exists' };
        }
        product.slug = newSlug;
      }

      // Regenerate EUR prices when MKD prices change
      if (updates.price) {
        // Create a new Shoe instance to recalculate EUR prices
        const updatedData = { ...product, price: updates.price };
        const newShoe = new Shoe(updatedData);
        product.priceMKD = newShoe.priceMKD;
        product.priceEUR = newShoe.priceEUR;
      }
      if (updates.oldPrice !== undefined) {
        if (updates.oldPrice === null || updates.oldPrice === '') {
          product.oldPriceMKD = null;
          product.oldPriceEUR = null;
        } else {
          const updatedData = { ...product, oldPrice: updates.oldPrice };
          const newShoe = new Shoe(updatedData);
          product.oldPriceMKD = newShoe.oldPriceMKD;
          product.oldPriceEUR = newShoe.oldPriceEUR;
        }
      }

      // Update caches
      this.cache.set(product.id, product);
      this.slugCache.set(product.slug, product);
      this.indexProductForSearch(product);

      this.saveToStorage();
      await this.syncToFile('update', product);
      return { success: true, product };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // DELETE
  async delete(id) {
    try {
      // Try Supabase first if available
      if (this.supabase && this.supabaseAvailable) {
        try {
          const { error } = await this.supabase.from('products').delete().eq('id', id);

          if (error) throw error;
        } catch (supabaseError) {
          console.warn('Supabase delete failed, falling back to local:', supabaseError.message);
          // Fall through to local storage implementation
        }
      }

      // Local storage implementation (always run to maintain local state)
      const index = this.catalog.items.findIndex((item) => item.id === id);
      if (index === -1) {
        return { success: false, error: 'Product not found' };
      }

      const deleted = this.catalog.items.splice(index, 1)[0];

      // Invalidate caches
      this.cache.delete(deleted.id);
      this.slugCache.delete(deleted.slug);

      this.saveToStorage();
      await this.syncToFile('delete', { id });
      return { success: true, product: deleted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // BULK OPERATIONS
  async bulkDelete(ids) {
    const results = await Promise.all(ids.map((id) => this.delete(id)));
    return {
      success: results.every((r) => r.success),
      deleted: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  async bulkUpdate(updates) {
    const results = await Promise.all(updates.map(({ id, data }) => this.update(id, data)));
    return {
      success: results.every((r) => r.success),
      updated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  // SEARCH & FILTER (optimized with inverted index)
  async search(query) {
    // Supabase implementation with full-text search:
    // const { data } = await supabase.from('products')
    //   .select('*')
    //   .textSearch('name', query, { type: 'websearch' });
    // return data.map(p => new Shoe(p));

    if (!query || query.trim().length === 0) {
      return await this.getAll();
    }

    const terms = query.toLowerCase().split(/\s+/);
    const matchedIds = new Set();

    // Use search index for faster lookup
    terms.forEach((term) => {
      this.searchIndex.forEach((ids, indexedTerm) => {
        if (indexedTerm.includes(term)) {
          ids.forEach((id) => matchedIds.add(id));
        }
      });
    });

    // Fallback to full scan if no index matches
    if (matchedIds.size === 0) {
      const termLower = query.toLowerCase();
      return this.catalog.items.filter(
        (item) =>
          item.name.toLowerCase().includes(termLower) ||
          item.description.toLowerCase().includes(termLower) ||
          item.tags.some((tag) => tag.toLowerCase().includes(termLower)) ||
          item.type.toLowerCase().includes(termLower) ||
          (item.brand && item.brand.toLowerCase().includes(termLower)) ||
          (item.gender && item.gender.toLowerCase().includes(termLower)) ||
          (item.material && item.material.toLowerCase().includes(termLower)) ||
          (item.style && item.style.toLowerCase().includes(termLower))
      );
    }

    return Array.from(matchedIds)
      .map((id) => this.cache.get(id))
      .filter(Boolean);
  }

  // STORAGE PERSISTENCE
  saveToStorage() {
    const data = this.catalog.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      price: item.priceMKD,
      oldPrice: item.oldPriceMKD,
      colors: item.availableColors,
      sizes: item.availableSizes,
      images: item.images,
      description: item.description,
      tags: item.tags,
      type: item.type,
      gender: item.gender,
      material: item.material,
      style: item.style,
    }));
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  loadFromStorage() {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      const products = JSON.parse(data);
      this.catalog.items = products.map((p) => new Shoe(p));
    }
  }

  // UTILITY
  generateId() {
    // Find the smallest available numeric ID (reuses freed IDs)
    const products = this.getAll();
    if (products.length === 0) return 1;

    // Get all existing numeric IDs and sort them
    const existingIds = products
      .map((p) => parseInt(p.id))
      .filter((id) => !isNaN(id))
      .sort((a, b) => a - b);

    // Find the first gap in the sequence
    for (let i = 1; i <= existingIds.length + 1; i++) {
      if (!existingIds.includes(i)) {
        return i;
      }
    }

    // Fallback: return next sequential ID
    return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  }

  generateSlug(name) {
    // Generate slug from name for human-readable URLs
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    if (!this.getBySlug(baseSlug)) {
      return baseSlug;
    }

    // If exists, add number suffix
    let counter = 2;
    while (this.getBySlug(`${baseSlug}-${counter}`)) {
      counter++;
    }
    return `${baseSlug}-${counter}`;
  }

  getStatistics() {
    return {
      total: this.catalog.items.length,
      types: this.catalog.getUniqueTypes().length,
      colors: this.catalog.getUniqueColors().length,
      byType: this.catalog.getUniqueTypes().reduce((acc, type) => {
        acc[type] = this.catalog.items.filter((i) => i.type === type).length;
        return acc;
      }, {}),
    };
  }

  exportData() {
    return JSON.stringify(this.catalog.items, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const products = data.map((p) => new Shoe(p));
      this.catalog.items = products;
      this.saveToStorage();
      return { success: true, count: products.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sync to server file for persistence
  async syncToFile(action, product) {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, product: this.serializeProduct(product) }),
      });
      if (!response.ok) {
        console.warn('Failed to sync to file:', response.status);
      }
    } catch (error) {
      console.warn('Error syncing to file:', error);
    }
  }

  serializeProduct(product) {
    if (!product) return null;
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.priceMKD,
      oldPrice: product.oldPriceMKD,
      colors: product.availableColors,
      sizes: product.availableSizes,
      unavailableSizes: product.unavailableSizes,
      images: product.images,
      description: product.description,
      tags: product.tags,
      type: product.type,
      gender: product.gender,
      material: product.material,
      style: product.style,
    };
  }
}
