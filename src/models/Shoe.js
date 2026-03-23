/* Shoe.js - Shoe product model with validation and immutability */
export class Shoe {
  constructor({
    id,
    slug,
    name,
    brand = '',
    price,
    oldPrice = null,
    colors = [],
    sizes = [],
    unavailableSizes = [],
    images = {},
    description = '',
    tags = [],
    type = 'sneakers',
    gender = 'unisex',
    material = '',
    style = '',
  }) {
    // Validation
    this.#validate(name, price);

    // Clean price inputs - ensure MKD format
    const cleanPrice = this.#ensureMKDFormat(price);
    const cleanOldPrice = oldPrice ? this.#ensureMKDFormat(oldPrice) : null;

    // Core properties - MKD is primary
    this.id = id;
    this.slug = slug || this.generateSlug(name);
    this.name = name;
    this.brand = brand;
    this.priceMKD = cleanPrice;
    this.priceEUR = this.#convertToEUR(cleanPrice);
    this.oldPriceMKD = cleanOldPrice;
    this.oldPriceEUR = cleanOldPrice ? this.#convertToEUR(cleanOldPrice) : null;

    // Shoe-specific properties
    this.availableColors = Array.isArray(colors) ? [...colors] : [];
    this.availableSizes = Array.isArray(sizes)
      ? [...sizes].sort((a, b) => parseFloat(a) - parseFloat(b))
      : [];
    this.unavailableSizes = Array.isArray(unavailableSizes) ? [...unavailableSizes] : [];
    this.images = { ...images };
    this.description = description || '';
    this.tags = Array.isArray(tags) ? [...tags] : [];
    this.type = type || 'sneakers'; // sneakers, boots, sandals, dress, athletic, casual
    this.gender = gender || 'unisex'; // men, women, unisex, kids
    this.material = material || ''; // leather, canvas, mesh, suede, synthetic
    this.style = style || ''; // casual, athletic, formal, outdoor

    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  #validate(name, price) {
    if (!name || name.trim().length < 3) {
      throw new Error('Product name must be at least 3 characters');
    }
    if (!price) {
      throw new Error('Product price is required');
    }
  }

  #ensureMKDFormat(priceInput) {
    if (!priceInput) return null;

    const str = String(priceInput);

    // If already in MKD format (contains "ден"), return as-is
    if (str.includes('ден')) {
      return str;
    }

    // If EUR format (starts with €), convert to MKD
    if (str.startsWith('€')) {
      const eurAmount = parseInt(str.replace(/[^0-9]/g, ''));
      const mkdAmount = Math.round(eurAmount * 61.5);
      return mkdAmount.toLocaleString('en-US') + ' ден';
    }

    // If just a number, treat as MKD
    const numericValue = parseInt(str.replace(/[^0-9]/g, ''));
    if (!isNaN(numericValue)) {
      return numericValue.toLocaleString('en-US') + ' ден';
    }

    return priceInput;
  }

  #convertToEUR(mkdPrice) {
    if (!mkdPrice) return null;

    const str = String(mkdPrice);
    const mkdAmount = parseInt(str.replace(/[^0-9]/g, ''));

    if (isNaN(mkdAmount)) return null;

    const eurAmount = Math.round(mkdAmount / 61.5);
    return '€' + eurAmount.toLocaleString('en-US');
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  hasColor(color) {
    return this.availableColors.includes(color);
  }

  hasSize(size) {
    return this.availableSizes.includes(String(size));
  }

  getImagesForColor(color) {
    return this.images[color] || [];
  }

  thumbnail() {
    // Always use first color from availableColors array to maintain consistency
    const color = this.availableColors[0];
    if (color) {
      const img = this.getImagesForColor(color)[0];
      if (img) return img;
    }
    // Fallback if no color is available
    return this.fallbackImage();
  }

  fallbackImage() {
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
        <rect width='100%' height='100%' fill='#f5f5f5' rx='12'/>
        <text x='50%' y='45%' font-size='48' fill='#333' font-family='Inter, sans-serif' text-anchor='middle'>${this.name}</text>
        <text x='50%' y='55%' font-size='24' fill='#666' font-family='Inter, sans-serif' text-anchor='middle'>${this.brand}</text>
      </svg>
    `)}`;
  }

  // Calculate discount percentage if oldPrice exists
  // Only show discount when prices are decreased (oldPrice > currentPrice)
  getDiscountPercentage() {
    if (!this.oldPriceMKD || !this.priceMKD) return null;

    const oldAmount = parseFloat(this.oldPriceMKD.replace(/[^0-9.]/g, ''));
    const newAmount = parseFloat(this.priceMKD.replace(/[^0-9.]/g, ''));

    // No discount if prices are equal or increased
    if (isNaN(oldAmount) || isNaN(newAmount) || oldAmount <= newAmount) return null;

    const discount = Math.round(((oldAmount - newAmount) / oldAmount) * 100);
    return discount > 0 ? discount : null;
  }

  // Check if product is on sale
  isOnSale() {
    return this.getDiscountPercentage() !== null;
  }

  // Get size range for display
  getSizeRange() {
    if (this.availableSizes.length === 0) return '';
    const sizes = this.availableSizes.map((s) => parseFloat(s)).sort((a, b) => a - b);
    return `${sizes[0]} - ${sizes[sizes.length - 1]}`;
  }

  // Check if a specific size is in stock
  isSizeAvailable(size) {
    return (
      this.availableSizes.includes(String(size)) && !this.unavailableSizes.includes(String(size))
    );
  }

  // Get only in-stock sizes
  getInStockSizes() {
    return this.availableSizes.filter((size) => !this.unavailableSizes.includes(size));
  }

  // Serialization for storage/API
  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      brand: this.brand,
      price: this.priceMKD,
      oldPrice: this.oldPriceMKD,
      colors: [...this.availableColors],
      sizes: [...this.availableSizes],
      unavailableSizes: [...this.unavailableSizes],
      images: { ...this.images },
      description: this.description,
      tags: [...this.tags],
      type: this.type,
      gender: this.gender,
      material: this.material,
      style: this.style,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Deep clone for immutability
  clone() {
    return new Shoe({
      id: this.id,
      slug: this.slug,
      name: this.name,
      brand: this.brand,
      price: this.priceMKD,
      oldPrice: this.oldPriceMKD,
      colors: [...this.availableColors],
      sizes: [...this.availableSizes],
      images: JSON.parse(JSON.stringify(this.images)),
      description: this.description,
      tags: [...this.tags],
      type: this.type,
      gender: this.gender,
      material: this.material,
      style: this.style,
    });
  }
}
