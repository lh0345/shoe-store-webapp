/* WishlistView.js - Wishlist page display */
import { escapeHtml } from '../../utils/helpers.js';

export class WishlistView {
  constructor(catalog, services) {
    this.catalog = catalog;
    this.services = services;
    this.wishlistService = services.wishlistService;
  }

  render() {
    const wishlistIds = this.wishlistService.getAll();
    const products = wishlistIds
      .map((id) => this.catalog.findById(id))
      .filter((p) => p !== null && p !== undefined);

    const container = document.createElement('div');
    container.className = 'wishlist-page';

    container.innerHTML = `
      <div class="section-header">
        <div class="kicker">Saved Items</div>
        <h2 class="section-title">Your Wishlist</h2>
        <p class="section-subtitle">${products.length} item${products.length !== 1 ? 's' : ''} saved</p>
      </div>
      
      ${
        products.length === 0
          ? `
        <div class="empty-wishlist">
          <div class="empty-wishlist-content">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h3>Your wishlist is empty</h3>
            <p>Start adding products you love by clicking the heart icon</p>
            <a href="/collection" class="btn btn-primary">Browse Collection</a>
          </div>
        </div>
      `
          : `
        <div id="wishlist-grid" class="grid grid-cols-3"></div>
      `
      }
    `;

    if (products.length > 0) {
      const grid = container.querySelector('#wishlist-grid');
      products.forEach((product) => {
        const card = this.createCard(product);
        grid.appendChild(card);
      });
    }

    return container;
  }

  createCard(item) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.slug = item.slug;
    card.style.cursor = 'pointer';

    const currencyService = this.services.currencyService;
    const displayPrice = currencyService
      ? currencyService.formatPrice(item.priceMKD, item.priceEUR)
      : item.priceMKD;

    const discount = item.getDiscountPercentage();
    const saleBadge = discount ? `<div class="sale-badge">-${discount}%</div>` : '';

    card.innerHTML = `
      <div class="card-img">
        ${saleBadge}
        <img src="${escapeHtml(item.thumbnail())}" alt="${escapeHtml(item.name)}" loading="lazy" />
        <button class="wishlist-btn active" data-id="${escapeHtml(String(item.id))}" title="Remove from wishlist" aria-label="Remove from wishlist">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(item.name)}</h3>
        <div class="card-price" data-mkd="${escapeHtml(item.priceMKD || '')}" data-eur="${escapeHtml(item.priceEUR || '')}">${displayPrice}</div>
      </div>
    `;

    // Add image load handler for smooth fade-in
    const img = card.querySelector('img');
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => {
        img.classList.add('loaded');
      });
      img.addEventListener('error', () => {
        img.classList.add('loaded'); // Show even if error to avoid blank space
      });
    }

    return card;
  }
}
