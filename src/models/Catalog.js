/* Catalog.js - Collection management */
import { Shoe } from './Shoe.js';

export class Catalog {
  constructor(items = []) {
    this.items = items.map((i) => (i instanceof Shoe ? i : new Shoe(i)));
  }

  all() {
    return this.items;
  }

  findById(id) {
    return this.items.find((it) => it.id === id);
  }

  findBySlug(slug) {
    return this.items.find((it) => it.slug === slug);
  }

  getUniqueTypes() {
    return [...new Set(this.items.map((item) => item.type))];
  }

  getUniqueColors() {
    const colors = new Set();
    this.items.forEach((item) => {
      item.availableColors.forEach((color) => colors.add(color));
    });
    return Array.from(colors);
  }

  getUniqueBrands() {
    const brands = new Set();
    this.items.forEach((item) => {
      if (item.brand) brands.add(item.brand);
    });
    return Array.from(brands).sort();
  }

  getUniqueSizes() {
    const sizes = new Set();
    this.items.forEach((item) => {
      if (item.availableSizes) {
        item.availableSizes.forEach((size) => sizes.add(size));
      }
    });
    // Sort sizes numerically
    return Array.from(sizes).sort((a, b) => parseFloat(a) - parseFloat(b));
  }

  getPriceRange() {
    if (this.items.length === 0) return { min: 0, max: 50000 };

    const prices = this.items.map((item) => item.priceMKD).filter((p) => p > 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  filter({ type = null, colors = [], minPrice = null, maxPrice = null, tags = [] } = {}) {
    return this.items.filter((item) => {
      // Type filtering
      if (type && item.type !== type) return false;

      // Color filtering (any matching color)
      if (colors.length > 0 && !colors.some((c) => item.availableColors.includes(c))) return false;

      // Tag filtering (any matching tag)
      if (tags.length > 0 && !tags.some((t) => item.tags.includes(t))) return false;

      // Price filtering
      if (minPrice !== null || maxPrice !== null) {
        const priceNum = this.extractPrice(item.price);
        if (minPrice !== null && priceNum < minPrice) return false;
        if (maxPrice !== null && priceNum > maxPrice) return false;
      }

      return true;
    });
  }

  // Sorting methods
  sortBy(field = 'name', order = 'asc') {
    const sorted = [...this.items];
    sorted.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      if (field === 'price') {
        aVal = this.extractPrice(a.price);
        bVal = this.extractPrice(b.price);
      }

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  extractPrice(priceString) {
    const match = priceString.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
  }

  paginate(page = 1, perPage = 6, items = null) {
    const itemsToPage = items || this.items;
    const total = itemsToPage.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, page), pages);
    const start = (p - 1) * perPage;
    const data = itemsToPage.slice(start, start + perPage);
    return { page: p, perPage, total, pages, data };
  }
}
