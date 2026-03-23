/* products.js - Shoe product catalog */
import { svgDataUri } from '../utils/helpers.js';
import { Shoe } from '../models/Shoe.js';
import { Catalog } from '../models/Catalog.js';

// Load products from JSON file
let sampleShoesRaw = null;

const loadProducts = async () => {
  try {
    const response = await fetch('/data/products.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    sampleShoesRaw = await response.json();
  } catch (error) {
    console.error('Failed to load products:', error);
    // Fallback to empty array
    sampleShoesRaw = [];
  }
};

// Build images mapping using svgDataUri
const buildSampleShoes = (rawProducts) => {
  return rawProducts.map((s) => {
    const images = {};
    s.colors.forEach((clr) => {
      images[clr] = [
        svgDataUri({ title: s.name + ' — ' + s.brand, color: clr, accentText: '#ffffff' }),
        svgDataUri({ title: s.name + ' — Detail', color: clr, accentText: '#ffffff' }),
      ];
    });
    return { ...s, images };
  });
};

// Initialize catalog asynchronously

const initializeCatalog = async () => {
  if (!sampleShoesRaw) {
    await loadProducts();
  }
  const sampleShoes = buildSampleShoes(sampleShoesRaw);
  return new Catalog(sampleShoes.map((raw) => new Shoe(raw)));
};

// Export the catalog as a promise
export const catalog = (async () => {
  return await initializeCatalog();
})();
