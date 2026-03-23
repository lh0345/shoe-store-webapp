/* HomeView.js - Home page rendering */
import { escapeHtml } from '../../utils/helpers.js';

export class HomeView {
  constructor(catalog, services) {
    this.catalog = catalog;
    this.services = services;
    this.animationTimeouts = new Set(); // Track animation timeouts for cleanup
  }

  destroy() {
    // Clear all pending animation timeouts
    this.animationTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.animationTimeouts.clear();
  }

  render(page = 1) {
    // Clear any existing timeouts from previous renders
    this.destroy();

    const perPage = 6;
    const { data, pages } = this.catalog.paginate(page, perPage);

    const container = document.createElement('div');
    container.innerHTML = `
      ${this.generateWebsiteSchema()}
      <div class="section-header">
        <div class="kicker">Featured Collection</div>
        <h2 class="section-title">Step Into Style</h2>
      </div>
      <div id="grid" class="grid grid-cols-3"></div>
      <div id="pagination" class="pagination"></div>
    `;

    const grid = container.querySelector('#grid');

    // Show skeleton loaders initially
    for (let i = 0; i < perPage; i++) {
      grid.appendChild(this.createSkeletonCard());
    }

    // Replace with actual cards after brief delay
    const loadTimeout = setTimeout(() => {
      this.animationTimeouts.add(loadTimeout);
      grid.innerHTML = '';

      data.forEach((item, idx) => {
        const card = this.createCard(item);
        card.classList.add('card-enter'); // Add CSS animation class
        card.style.animationDelay = `${idx * 50}ms`; // Stagger animations
        grid.appendChild(card);

        // Remove animation class after animation completes
        const animationTimeout = setTimeout(
          () => {
            card.classList.remove('card-enter');
            card.classList.add('card-entered');
          },
          400 + idx * 50
        );
        this.animationTimeouts.add(animationTimeout);
      });

      // Attach wishlist event listeners after cards are created
      this.attachWishlistListeners(grid);
    }, 200);
    this.animationTimeouts.add(loadTimeout);

    const pagination = container.querySelector('#pagination');
    this.renderPagination(pagination, page, pages);

    return container;
  }

  createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'card skeleton-card';
    card.innerHTML = `
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line skeleton-brand"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-title-second"></div>
        <div class="skeleton-line skeleton-size"></div>
        <div class="skeleton-line skeleton-price"></div>
      </div>
    `;
    return card;
  }

  createCard(item) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.slug = item.slug;
    card.style.cursor = 'pointer';

    const currencyService = window.currencyService;
    const displayPrice = currencyService
      ? currencyService.formatPrice(item.priceMKD, item.priceEUR)
      : item.priceMKD;

    const discount = item.getDiscountPercentage();
    const saleBadge = discount ? `<div class="sale-badge">-${discount}%</div>` : '';

    const brandTag = item.brand ? `<span class="card-brand">${escapeHtml(item.brand)}</span>` : '';

    card.innerHTML = `
      <div class="card-img">
        ${saleBadge}
        <img src="${escapeHtml(item.thumbnail())}" alt="${escapeHtml(item.name)} thumbnail" loading="lazy" />
        <button class="wishlist-btn" data-id="${escapeHtml(String(item.id))}" title="Add to wishlist" aria-label="Add to wishlist">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="card-body">
        ${brandTag}
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
        img.classList.add('loaded');
      });
    }

    return card;
  }

  renderPagination(container, currentPage, totalPages) {
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      btn.dataset.page = i;
      container.appendChild(btn);
    }
  }

  attachWishlistListeners(container) {
    const wishlistService = this.services.wishlistService;
    if (!wishlistService) return;

    container.querySelectorAll('.wishlist-btn').forEach((btn) => {
      const productId = parseInt(btn.dataset.id);

      // Set initial state
      if (wishlistService.isInWishlist(productId)) {
        btn.classList.add('active');
      }

      // Attach click handler
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        wishlistService.toggle(productId);
        btn.classList.toggle('active');

        // Update wishlist badge if function exists
        if (window.app && window.app.updateWishlistBadge) {
          window.app.updateWishlistBadge();
        }
      });
    });
  }

  generateWebsiteSchema() {
    const storeConfig = this.services.storeConfig;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: storeConfig?.brand.name || 'Store',
      description: 'Premium footwear collection featuring sneakers, boots, and casual shoes',
      url: window.location.origin,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${window.location.origin}/collection?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      publisher: {
        '@type': 'Organization',
        name: 'BRAND_NAME',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/logo.png`,
        },
      },
    };

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }
}
