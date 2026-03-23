/* CollectionView.js - Collection page with filters */
import { escapeHtml } from '../../utils/helpers.js';

// Constants for better maintainability
const ITEMS_PER_PAGE = 9;
const CARD_ANIMATION_DELAY_MS = 50;

export class CollectionView {
  constructor(catalog, services) {
    this.catalog = catalog;
    this.services = services;
    this.filters = {
      type: null,
      colors: [],
      search: '',
      brands: [],
      sizes: [],
      priceMin: 0,
      priceMax: 100000,
    };
    // Restore page from sessionStorage if exists
    const savedPage = sessionStorage.getItem('collectionPage');
    this.currentPage = savedPage ? parseInt(savedPage) : 1;
    this.itemsPerPage = ITEMS_PER_PAGE;

    // Restore sort from localStorage
    const savedSort = localStorage.getItem('collectionSort');
    this.currentSort = savedSort || 'featured';
  }

  render() {
    try {
      const container = document.createElement('div');
      container.className = 'collection-page';

      container.innerHTML = `
        ${this.generateCollectionSchema()}
        <div class="collection-header">
          <div class="section-header">
            <div class="kicker">Browse</div>
            <h2 class="section-title">Full Collection</h2>
          </div>
        </div>

        <div class="collection-content">
        <button class="filters-toggle" id="filters-toggle">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="6" x2="16" y2="6"/>
            <line x1="4" y1="10" x2="16" y2="10"/>
            <line x1="4" y1="14" x2="16" y2="14"/>
            <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="14" cy="10" r="1.5" fill="currentColor"/>
            <circle cx="10" cy="14" r="1.5" fill="currentColor"/>
          </svg>
          Filters
        </button>
        
        <div class="filters-overlay" id="filters-overlay"></div>
        
        <aside class="filters-sidebar" id="filters-sidebar">
          <button class="filters-close" id="filters-close">✕</button>
          <div class="filter-section">
            <h3 class="filter-title">Search</h3>
            <input type="text" id="search-input" class="search-input" placeholder="Search products..." />
          </div>

          <div class="filter-section">
            <h3 class="filter-title">Type</h3>
            <div class="filter-options filter-scroll" id="type-filters"></div>
            <button class="filter-show-more" id="type-show-more" style="display:none;">
              <span class="show-more-text">Show More</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div class="filter-section">
            <h3 class="filter-title">Colors</h3>
            <div class="color-filters color-filters-grid filter-scroll" id="color-filters"></div>
            <button class="filter-show-more" id="color-show-more" style="display:none;">
              <span class="show-more-text">Show More</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div class="filter-section">
            <h3 class="filter-title">Brand</h3>
            <div class="filter-options filter-scroll" id="brand-filters"></div>
            <button class="filter-show-more" id="brand-show-more" style="display:none;">
              <span class="show-more-text">Show More</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div class="filter-section">
            <h3 class="filter-title">Size</h3>
            <div class="filter-options filter-options-grid filter-scroll" id="size-filters"></div>
            <button class="filter-show-more" id="size-show-more" style="display:none;">
              <span class="show-more-text">Show More</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div class="filter-section">
            <h3 class="filter-title">Price Range</h3>
            <div class="price-range-slider">
              <div class="price-range-values">
                <span id="price-min-value">0</span> MKD — <span id="price-max-value">100000</span> MKD
              </div>
              <div class="price-slider-container">
                <input type="range" id="price-min-slider" min="0" max="100000" step="1000" value="0" class="price-slider price-slider-min" />
                <input type="range" id="price-max-slider" min="0" max="100000" step="1000" value="100000" class="price-slider price-slider-max" />
                <div class="price-slider-track"></div>
              </div>
            </div>
          </div>

          <button class="filter-reset" id="reset-filters">Reset Filters</button>
        </aside>

        <div class="collection-main">
          <div class="collection-results">
            <p class="results-count" id="results-count"></p>
            <div class="sort-dropdown">
              <label for="sort-select" class="sort-label">Sort by:</label>
              <select id="sort-select" class="sort-select">
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
          <div id="collection-grid" class="grid grid-cols-3"></div>
          <div id="collection-pagination" class="pagination"></div>
        </div>
      </div>
    `;

      this.attachFilterListeners(container);
      this.renderFilters(container);
      this.applyFilters(container, false); // Don't reset page on initial render - use saved state

      return container;
    } catch (error) {
      console.error('Error rendering collection:', error);
      if (window.showErrorNotification) {
        window.showErrorNotification('Failed to load collection. Please refresh the page.');
      }

      const errorContainer = document.createElement('div');
      errorContainer.className = 'collection-page';
      errorContainer.innerHTML = `
        <div class="not-found-content" style="text-align: center; padding: 4rem 1rem;">
          <h2>Failed to Load Collection</h2>
          <p>We encountered an error loading the products. Please try again.</p>
          <button class="btn btn-primary reload-btn">Reload Page</button>
        </div>
      `;

      // Attach reload handler
      const reloadBtn = errorContainer.querySelector('.reload-btn');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
          window.location.reload();
        });
      }

      return errorContainer;
    }
  }

  renderFilters(container) {
    // Type filters
    const types = this.catalog.getUniqueTypes();
    const typeFilters = container.querySelector('#type-filters');

    types.forEach((type) => {
      const label = document.createElement('label');
      label.className = 'filter-checkbox';
      label.innerHTML = `
        <input type="radio" name="type" value="${type}" />
        <span>${escapeHtml(type.charAt(0).toUpperCase() + type.slice(1))}</span>
      `;
      typeFilters.appendChild(label);
    });

    // All types option
    const allLabel = document.createElement('label');
    allLabel.className = 'filter-checkbox';
    allLabel.innerHTML = `
      <input type="radio" name="type" value="" checked />
      <span>All Types</span>
    `;
    typeFilters.insertBefore(allLabel, typeFilters.firstChild);

    // Color filters
    const colors = this.catalog.getUniqueColors();
    const colorFilters = container.querySelector('#color-filters');

    colors.forEach((color) => {
      const swatch = document.createElement('button');
      swatch.className = 'filter-color-swatch';
      swatch.style.background = color;
      swatch.dataset.color = color;

      // Format color name for display
      const colorName = color.charAt(0).toUpperCase() + color.slice(1);
      swatch.title = colorName;
      swatch.setAttribute('aria-label', `Filter by ${colorName}`);

      colorFilters.appendChild(swatch);
    });

    // Brand filters
    const brands = this.catalog.getUniqueBrands();
    const brandFilters = container.querySelector('#brand-filters');

    brands.forEach((brand) => {
      const label = document.createElement('label');
      label.className = 'filter-checkbox';
      label.innerHTML = `
        <input type="checkbox" name="brand" value="${escapeHtml(brand)}" />
        <span>${escapeHtml(brand)}</span>
      `;
      brandFilters.appendChild(label);
    });

    // Size filters
    const sizes = this.catalog.getUniqueSizes();
    const sizeFilters = container.querySelector('#size-filters');

    sizes.forEach((size) => {
      const label = document.createElement('label');
      label.className = 'filter-checkbox';
      label.innerHTML = `
        <input type="checkbox" name="size" value="${escapeHtml(size)}" />
        <span>${size}</span>
      `;
      sizeFilters.appendChild(label);
    });

    // Set initial price range to full range
    const priceMinSlider = container.querySelector('#price-min-slider');
    const priceMaxSlider = container.querySelector('#price-max-slider');
    const priceMinValue = container.querySelector('#price-min-value');
    const priceMaxValue = container.querySelector('#price-max-value');

    if (priceMinSlider && priceMaxSlider) {
      priceMinSlider.value = 0;
      priceMaxSlider.value = 100000;

      priceMinValue.textContent = 0;
      priceMaxValue.textContent = 100000;

      this.filters.priceMin = 0;
      this.filters.priceMax = 100000;

      this.updateSliderTrack(priceMinSlider, priceMaxSlider);
    }

    // Setup show more buttons
    this.setupShowMoreButtons(container);
  }

  setupShowMoreButtons(container) {
    const typeFilters = container.querySelector('#type-filters');
    const colorFilters = container.querySelector('#color-filters');
    const brandFilters = container.querySelector('#brand-filters');
    const sizeFilters = container.querySelector('#size-filters');

    const typeShowMore = container.querySelector('#type-show-more');
    const colorShowMore = container.querySelector('#color-show-more');
    const brandShowMore = container.querySelector('#brand-show-more');
    const sizeShowMore = container.querySelector('#size-show-more');

    // Check if type filters need show more button (more than 6 items)
    if (typeFilters && typeShowMore) {
      const itemCount = typeFilters.querySelectorAll('.filter-checkbox').length;
      if (itemCount > 6) {
        typeShowMore.style.display = 'flex';
        typeFilters.classList.add('collapsed');
      }

      typeShowMore.addEventListener('click', () => {
        typeFilters.classList.toggle('collapsed');
        const isCollapsed = typeFilters.classList.contains('collapsed');
        typeShowMore.querySelector('.show-more-text').textContent = isCollapsed
          ? 'Show More'
          : 'Show Less';
        typeShowMore.querySelector('svg').style.transform = isCollapsed
          ? 'rotate(0deg)'
          : 'rotate(180deg)';
      });
    }

    // Check if color filters need show more button (more than 12 items)
    if (colorFilters && colorShowMore) {
      const itemCount = colorFilters.querySelectorAll('.filter-color-swatch').length;
      if (itemCount > 12) {
        colorShowMore.style.display = 'flex';
        colorFilters.classList.add('collapsed');
      }

      colorShowMore.addEventListener('click', () => {
        colorFilters.classList.toggle('collapsed');
        const isCollapsed = colorFilters.classList.contains('collapsed');
        colorShowMore.querySelector('.show-more-text').textContent = isCollapsed
          ? 'Show More'
          : 'Show Less';
        colorShowMore.querySelector('svg').style.transform = isCollapsed
          ? 'rotate(0deg)'
          : 'rotate(180deg)';
      });
    }

    // Check if brand filters need show more button (more than 6 items)
    if (brandFilters && brandShowMore) {
      const itemCount = brandFilters.querySelectorAll('.filter-checkbox').length;
      if (itemCount > 6) {
        brandShowMore.style.display = 'flex';
        brandFilters.classList.add('collapsed');
      }

      brandShowMore.addEventListener('click', () => {
        brandFilters.classList.toggle('collapsed');
        const isCollapsed = brandFilters.classList.contains('collapsed');
        brandShowMore.querySelector('.show-more-text').textContent = isCollapsed
          ? 'Show More'
          : 'Show Less';
        brandShowMore.querySelector('svg').style.transform = isCollapsed
          ? 'rotate(0deg)'
          : 'rotate(180deg)';
      });
    }

    // Check if size filters need show more button (more than 6 items)
    if (sizeFilters && sizeShowMore) {
      const itemCount = sizeFilters.querySelectorAll('.filter-checkbox').length;
      if (itemCount > 6) {
        sizeShowMore.style.display = 'flex';
        sizeFilters.classList.add('collapsed');
      }

      sizeShowMore.addEventListener('click', () => {
        sizeFilters.classList.toggle('collapsed');
        const isCollapsed = sizeFilters.classList.contains('collapsed');
        sizeShowMore.querySelector('.show-more-text').textContent = isCollapsed
          ? 'Show More'
          : 'Show Less';
        sizeShowMore.querySelector('svg').style.transform = isCollapsed
          ? 'rotate(0deg)'
          : 'rotate(180deg)';
      });
    }
  }

  attachFilterListeners(container) {
    // Sort dropdown
    const sortSelect = container.querySelector('#sort-select');
    if (sortSelect) {
      // Set saved sort value
      sortSelect.value = this.currentSort;

      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        localStorage.setItem('collectionSort', this.currentSort);
        this.applyFilters(container);
      });
    }

    // Mobile filters toggle
    const filtersToggle = container.querySelector('#filters-toggle');
    const filtersSidebar = container.querySelector('#filters-sidebar');
    const filtersOverlay = container.querySelector('#filters-overlay');
    const filtersClose = container.querySelector('#filters-close');

    const openFilters = () => {
      filtersSidebar.classList.add('active');
      filtersOverlay.classList.add('active');
    };

    const closeFilters = () => {
      filtersSidebar.classList.remove('active');
      filtersOverlay.classList.remove('active');
    };

    if (filtersToggle) {
      filtersToggle.addEventListener('click', openFilters);
    }

    if (filtersClose) {
      filtersClose.addEventListener('click', closeFilters);
    }

    if (filtersOverlay) {
      filtersOverlay.addEventListener('click', closeFilters);
    }

    // Type filter
    container.querySelector('#type-filters').addEventListener('change', (e) => {
      if (e.target.name === 'type') {
        this.filters.type = e.target.value || null;
        this.applyFilters(container);
      }
    });

    // Color filter
    container.querySelector('#color-filters').addEventListener('click', (e) => {
      const swatch = e.target.closest('.filter-color-swatch');
      if (!swatch) return;

      const color = swatch.dataset.color;
      const idx = this.filters.colors.indexOf(color);

      if (idx > -1) {
        this.filters.colors.splice(idx, 1);
        swatch.classList.remove('active');
      } else {
        this.filters.colors.push(color);
        swatch.classList.add('active');
      }

      this.applyFilters(container);
    });

    // Search
    const searchInput = container.querySelector('#search-input');
    searchInput.addEventListener('input', (e) => {
      this.filters.search = e.target.value.toLowerCase();
      this.applyFilters(container);
    });

    // Brand filter
    container.querySelector('#brand-filters').addEventListener('change', (e) => {
      if (e.target.name === 'brand') {
        const brand = e.target.value;
        if (e.target.checked) {
          this.filters.brands.push(brand);
        } else {
          const idx = this.filters.brands.indexOf(brand);
          if (idx > -1) this.filters.brands.splice(idx, 1);
        }
        this.applyFilters(container);
      }
    });

    // Size filter
    container.querySelector('#size-filters').addEventListener('change', (e) => {
      if (e.target.name === 'size') {
        const size = e.target.value;
        if (e.target.checked) {
          this.filters.sizes.push(size);
        } else {
          const idx = this.filters.sizes.indexOf(size);
          if (idx > -1) this.filters.sizes.splice(idx, 1);
        }
        this.applyFilters(container);
      }
    });

    // Price range slider filter
    const priceMinSlider = container.querySelector('#price-min-slider');
    const priceMaxSlider = container.querySelector('#price-max-slider');
    const priceMinValue = container.querySelector('#price-min-value');
    const priceMaxValue = container.querySelector('#price-max-value');

    if (priceMinSlider && priceMaxSlider) {
      priceMinSlider.addEventListener('input', () => {
        let minVal = parseInt(priceMinSlider.value);
        const maxVal = parseInt(priceMaxSlider.value);

        if (minVal > maxVal) {
          minVal = maxVal;
          priceMinSlider.value = minVal;
        }

        this.filters.priceMin = minVal;
        priceMinValue.textContent = minVal;
        this.updateSliderTrack(priceMinSlider, priceMaxSlider);
        this.applyFilters(container);
      });

      priceMaxSlider.addEventListener('input', () => {
        const minVal = parseInt(priceMinSlider.value);
        let maxVal = parseInt(priceMaxSlider.value);

        if (maxVal < minVal) {
          maxVal = minVal;
          priceMaxSlider.value = maxVal;
        }

        this.filters.priceMax = maxVal;
        priceMaxValue.textContent = maxVal;
        this.updateSliderTrack(priceMinSlider, priceMaxSlider);
        this.applyFilters(container);
      });
    }

    // Reset
    container.querySelector('#reset-filters').addEventListener('click', () => {
      this.filters = {
        type: null,
        colors: [],
        search: '',
        brands: [],
        sizes: [],
        priceMin: 0,
        priceMax: 100000,
      };
      searchInput.value = '';

      const priceMinSlider = container.querySelector('#price-min-slider');
      const priceMaxSlider = container.querySelector('#price-max-slider');
      const priceMinValue = container.querySelector('#price-min-value');
      const priceMaxValue = container.querySelector('#price-max-value');

      if (priceMinSlider && priceMaxSlider) {
        priceMinSlider.value = 0;
        priceMaxSlider.value = 100000;
        priceMinValue.textContent = 0;
        priceMaxValue.textContent = 100000;
        this.updateSliderTrack(priceMinSlider, priceMaxSlider);
      }

      container
        .querySelectorAll('.filter-color-swatch')
        .forEach((s) => s.classList.remove('active'));
      container.querySelector('input[name="type"][value=""]').checked = true;
      container.querySelectorAll('input[name="brand"]').forEach((c) => (c.checked = false));
      container.querySelectorAll('input[name="size"]').forEach((c) => (c.checked = false));
      this.applyFilters(container);
    });
  }

  sortProducts(items) {
    const sorted = [...items];

    switch (this.currentSort) {
      case 'price-asc':
        sorted.sort((a, b) => {
          const priceA = parseInt((a.priceMKD || '0').replace(/[^0-9]/g, '')) || 0;
          const priceB = parseInt((b.priceMKD || '0').replace(/[^0-9]/g, '')) || 0;
          return priceA - priceB;
        });
        break;

      case 'price-desc':
        sorted.sort((a, b) => {
          const priceA = parseInt((a.priceMKD || '0').replace(/[^0-9]/g, '')) || 0;
          const priceB = parseInt((b.priceMKD || '0').replace(/[^0-9]/g, '')) || 0;
          return priceB - priceA;
        });
        break;

      case 'newest':
        sorted.sort((a, b) => {
          // Assuming products have id that increments (newer products have higher ids)
          return b.id - a.id;
        });
        break;

      case 'featured':
      default:
        // Keep original order (featured products)
        break;
    }

    return sorted;
  }

  applyFilters(container, resetPage = true) {
    if (resetPage) {
      this.currentPage = 1;
      sessionStorage.setItem('collectionPage', '1');
    }

    let items = this.catalog.filter({
      type: this.filters.type,
      colors: this.filters.colors,
    });

    // Apply search filter
    if (this.filters.search) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(this.filters.search) ||
          item.description.toLowerCase().includes(this.filters.search) ||
          item.tags.some((tag) => tag.toLowerCase().includes(this.filters.search))
      );
    }

    // Apply brand filter
    if (this.filters.brands.length > 0) {
      items = items.filter((item) => item.brand && this.filters.brands.includes(item.brand));
    }

    // Apply size filter
    if (this.filters.sizes.length > 0) {
      items = items.filter(
        (item) =>
          item.availableSizes &&
          item.availableSizes.some((size) => this.filters.sizes.includes(size))
      );
    }

    // Price range filter - always apply
    items = items.filter((item) => {
      // Parse price string "8,600 ден" to number 8600
      const priceStr = item.priceMKD || '0';
      const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
      return price >= this.filters.priceMin && price <= this.filters.priceMax;
    });

    // Apply sorting
    items = this.sortProducts(items);

    // Calculate pagination
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    // Update results count
    const resultsCount = container.querySelector('#results-count');
    resultsCount.textContent = `${totalItems} product${totalItems !== 1 ? 's' : ''} found`;

    // Render products
    const grid = container.querySelector('#collection-grid');
    grid.innerHTML = '';

    // Show skeleton loaders for empty state or during initial render
    if (paginatedItems.length === 0) {
      // No products found - show empty state instead of skeletons
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.style.gridColumn = '1 / -1';
      emptyState.style.textAlign = 'center';
      emptyState.style.padding = 'var(--spacing-3xl)';
      emptyState.innerHTML = `
        <p style="color: var(--text-muted); font-size: var(--text-lg);">No products match your filters</p>
      `;
      grid.appendChild(emptyState);
    } else {
      // Show skeleton loaders briefly to indicate loading
      const skeletonCount = Math.min(paginatedItems.length, this.itemsPerPage);
      for (let i = 0; i < skeletonCount; i++) {
        grid.appendChild(this.createSkeletonCard());
      }

      // Replace skeletons with actual cards after a brief delay
      setTimeout(() => {
        grid.innerHTML = '';

        paginatedItems.forEach((item, idx) => {
          const card = this.createCard(item);
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          grid.appendChild(card);

          setTimeout(() => {
            card.style.transition =
              'opacity 0.3s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, idx * CARD_ANIMATION_DELAY_MS);
        });

        // Attach wishlist handlers after cards are rendered
        this.attachWishlistHandlers(container);
      }, 200);
    }
    // Render pagination
    this.renderPagination(container, totalPages);

    // Scroll to top on page change (only if not initial page load)
    if (!resetPage && this.currentPage > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  attachWishlistHandlers(container) {
    const wishlistService = this.services.wishlistService;
    if (!wishlistService) return;

    const updateWishlistBadge = window.updateWishlistBadge;

    container.querySelectorAll('.wishlist-btn').forEach((btn) => {
      const productId = parseInt(btn.dataset.id);

      if (wishlistService.isInWishlist(productId)) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        wishlistService.toggle(productId);
        btn.classList.toggle('active');
        if (updateWishlistBadge) updateWishlistBadge();
      });
    });
  }

  renderPagination(container, totalPages) {
    const pagination = container.querySelector('#collection-pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const paginationHTML = [];

    // Previous button
    if (this.currentPage > 1) {
      paginationHTML.push(`
        <button class="pagination-btn pagination-prev" data-page="${this.currentPage - 1}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Previous
        </button>
      `);
    }

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page
    if (startPage > 1) {
      paginationHTML.push(`<button class="pagination-btn" data-page="1">1</button>`);
      if (startPage > 2) {
        paginationHTML.push(`<span class="pagination-ellipsis">...</span>`);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML.push(`
        <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `);
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML.push(`<span class="pagination-ellipsis">...</span>`);
      }
      paginationHTML.push(
        `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`
      );
    }

    // Next button
    if (this.currentPage < totalPages) {
      paginationHTML.push(`
        <button class="pagination-btn pagination-next" data-page="${this.currentPage + 1}">
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      `);
    }

    pagination.innerHTML = paginationHTML.join('');

    // Attach click handlers
    pagination.querySelectorAll('.pagination-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page);
        sessionStorage.setItem('collectionPage', this.currentPage.toString());
        this.applyFilters(container, false);
      });
    });
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

    const currencyService = this.services.currencyService;
    const displayPrice = currencyService
      ? currencyService.formatPrice(item.priceMKD, item.priceEUR)
      : item.priceMKD;

    const discount = item.getDiscountPercentage();
    const saleBadge = discount ? `<div class="sale-badge">-${discount}%</div>` : '';
    const brandTag = item.brand ? `<span class="card-brand">${escapeHtml(item.brand)}</span>` : '';
    const sizeRange =
      item.availableSizes && item.availableSizes.length > 0
        ? `<span class="card-sizes">Sizes: ${item.getSizeRange()}</span>`
        : '';

    card.innerHTML = `
      <div class="card-img">
        ${saleBadge}
        <img src="${escapeHtml(item.thumbnail())}" alt="${escapeHtml(item.name)}" loading="lazy" />
        <button class="wishlist-btn" data-id="${escapeHtml(String(item.id))}" title="Add to wishlist" aria-label="Add to wishlist">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="card-body">
        ${brandTag}
        <h3 class="card-title">${escapeHtml(item.name)}</h3>
        ${sizeRange}
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

  updateSliderTrack(minSlider, maxSlider) {
    const container = minSlider.closest('.price-slider-container');
    const track = container.querySelector('.price-slider-track');

    const min = parseInt(minSlider.min);
    const max = parseInt(minSlider.max);
    const minVal = parseInt(minSlider.value);
    const maxVal = parseInt(maxSlider.value);

    const percentMin = ((minVal - min) / (max - min)) * 100;
    const percentMax = ((maxVal - min) / (max - min)) * 100;

    track.style.left = percentMin + '%';
    track.style.width = percentMax - percentMin + '%';
  }

  generateCollectionSchema() {
    const allProducts = this.catalog.all();

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Shoe Collection',
      description: 'Browse our complete collection of premium footwear',
      url: window.location.href,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: allProducts.length,
        itemListElement: allProducts.slice(0, 20).map((product, index) => {
          const priceStr = product.priceMKD || '0';
          const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;

          return {
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Product',
              name: product.name,
              image: product.thumbnail(),
              description: product.description,
              brand: {
                '@type': 'Brand',
                name: product.brand || 'BRAND_NAME',
              },
              offers: {
                '@type': 'Offer',
                priceCurrency: 'MKD',
                price: price,
                availability: 'https://schema.org/InStock',
                url: `${window.location.origin}/product/${product.slug}`,
              },
            },
          };
        }),
      },
    };

    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
  }
}
