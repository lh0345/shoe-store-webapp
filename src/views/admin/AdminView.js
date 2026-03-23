/* AdminView.js - Admin dashboard view */
import { RateLimiter } from '../../utils/RateLimiter.js';
import { buildAdminDashboardHtml } from './templates/dashboardHtml.js';
import { handleExport } from './adminPdfExport.js';
import { renderHolidayBanners } from './adminHolidayBanners.js';
import {
  handlePasswordChange,
  updatePasswordStrength,
  updateSecurityStats,
  updateSecurityIncidents,
  handleClearSecurityData,
  handleClearIncidents,
} from './adminSecurity.js';
import { setupColorSync, handleSaveSettings } from './adminSettings.js';
import {
  renderProductsTable,
  openModal,
  closeModal,
  handleSaveProduct,
  handleSearch,
} from './adminProducts.js';
import { addColorField } from './adminProductForm.js';

export class AdminView {
  constructor(services) {
    this.services = services;
    this.productService = services.productService;
    this.authService = services.authService;

    // Initialize rate limiter for security monitoring
    this.rateLimiter = new RateLimiter('store');

    // Pagination state
    this.currentPage = 1;
    this.itemsPerPage = 5;

    // Sorting state
    this.sortField = 'id';
    this.sortDirection = 'asc';

    // Cached products for pagination/sorting
    this.allProducts = [];
    this.filteredProducts = [];
  }

  async render() {
    // Update navbar for admin state
    if (window.updateNavbar) {
      window.updateNavbar();
    } else {
      // Fallback if function not available
      document.querySelectorAll('.customer-only').forEach((el) => (el.style.display = 'none'));
      document.querySelectorAll('.admin-only').forEach((el) => (el.style.display = 'block'));
    }

    const navLogout = document.getElementById('nav-logout');
    if (navLogout) {
      navLogout.onclick = () => this.handleLogout();
    }

    // Hide footer on admin page
    const footer = document.querySelector('.site-footer');
    if (footer) footer.style.display = 'none';

    const container = document.createElement('div');
    container.className = 'admin-dashboard';

    const stats = this.productService.getStatistics();

    // Load current config from localStorage or defaults
    const savedConfig = localStorage.getItem('storeConfig');
    const config = savedConfig
      ? JSON.parse(savedConfig)
      : {
          brand: {
            name: 'KopackaMk',
            tagline: 'Step Into Style',
            description: 'Premium footwear that combines comfort and style',
          },
          contact: {
            phone: '+38970000000',
            email: 'info@urbanstep.com',
            address: 'Skopje, North Macedonia',
          },
          colors: { accent: '#2563EB', accentLight: '#DBEAFE', accentDark: '#1E40AF' },
          business: { defaultCurrency: 'MKD', exchangeRate: 61.5 },
          policies: {
            shipping: 'Free shipping on orders over 3000 MKD',
            returns: '30-day return policy',
            warranty: '1-year warranty on all products',
          },
        };
    container.innerHTML = buildAdminDashboardHtml({
      stats,
      config,
      username: this.authService.getCurrentUser().username,
    });

    await this.attachEventListeners(container);

    return container;
  }

  async attachEventListeners(container) {
    // Tab switching
    const tabButtons = container.querySelectorAll('.admin-tab');
    const tabContents = container.querySelectorAll('.admin-tab-content');

    tabButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const tabName = button.dataset.tab;

        // Update active tab button
        tabButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');

        // Show corresponding content
        tabContents.forEach((content) => {
          if (content.dataset.content === tabName) {
            content.style.display = 'block';
          } else {
            content.style.display = 'none';
          }
        });

        // Render products table when switching to products tab
        if (tabName === 'products') {
          await renderProductsTable(this, container);
        }

        // Ensure CSRF tokens are added to security tab forms
        if (tabName === 'security' && window.csrfProtection) {
          const passwordForm = container.querySelector('#password-form');
          if (passwordForm) {
            window.csrfProtection.addTokenToForm(passwordForm);
          }
        }
      });
    });

    // Render products table on initial load (Products tab is active by default)
    await renderProductsTable(this, container);

    // Check for edit parameter from sessionStorage (set by ProductView edit button)
    const editProductId = sessionStorage.getItem('editProductId');
    if (editProductId) {
      // Clear the sessionStorage item
      sessionStorage.removeItem('editProductId');

      // Find the product and open edit modal
      const product = await this.productService.getById(parseInt(editProductId));
      if (product) {
        setTimeout(() => {
          openModal(this, container, product);
        }, 300);
      }
    }

    // Products tab event listeners
    const addBtn = container.querySelector('#add-product-btn');
    const exportBtn = container.querySelector('#export-btn');
    const searchInput = container.querySelector('#admin-search');
    const modalClose = container.querySelector('#modal-close');
    const cancelBtn = container.querySelector('#cancel-btn');
    const form = container.querySelector('#product-form');
    const addColorBtn = container.querySelector('#add-color-btn');

    if (addBtn) addBtn.addEventListener('click', () => openModal(this, container, null));
    if (exportBtn) exportBtn.addEventListener('click', () => handleExport(this));
    if (searchInput)
      searchInput.addEventListener('input', (e) => handleSearch(this, container, e.target.value));

    // Sorting event listeners
    const sortableHeaders = container.querySelectorAll('.sortable');
    sortableHeaders.forEach((header) => {
      header.addEventListener('click', async () => {
        const field = header.dataset.sort;
        if (this.sortField === field) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortField = field;
          this.sortDirection = 'asc';
        }
        this.currentPage = 1; // Reset to first page when sorting
        await renderProductsTable(this, container);
      });
    });

    // Pagination event listeners
    const prevBtn = container.querySelector('#prev-page');
    const nextBtn = container.querySelector('#next-page');

    if (prevBtn)
      prevBtn.addEventListener('click', async () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          await renderProductsTable(this, container);
        }
      });

    if (nextBtn)
      nextBtn.addEventListener('click', async () => {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          await renderProductsTable(this, container);
        }
      });

    if (modalClose) modalClose.addEventListener('click', () => closeModal(container));
    if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(container));

    const colorsContainer = container.querySelector('#colors-container');
    if (addColorBtn) addColorBtn.addEventListener('click', () => addColorField(colorsContainer));

    // Price formatting
    const priceInput = container.querySelector('#product-price');
    const oldPriceInput = container.querySelector('#product-old-price');
    const discountDisplay = container.querySelector('#discount-display');

    if (priceInput && oldPriceInput && discountDisplay) {
      const updateDiscount = () => {
        const price = parseFloat(priceInput.value.replace(/,/g, ''));
        const oldPrice = parseFloat(oldPriceInput.value.replace(/,/g, ''));

        if (!isNaN(price) && !isNaN(oldPrice) && oldPrice > price) {
          const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
          discountDisplay.textContent = `🏷️ ${discount}% off`;
          discountDisplay.style.display = 'block';
        } else {
          discountDisplay.style.display = 'none';
        }
      };

      priceInput.addEventListener('input', (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (value && !isNaN(value)) {
          e.target.value = new Intl.NumberFormat('en-US').format(value);
        }
        updateDiscount();
      });

      oldPriceInput.addEventListener('input', (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (value && !isNaN(value)) {
          e.target.value = new Intl.NumberFormat('en-US').format(value);
        }
        updateDiscount();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSaveProduct(this, container);
      });
    }

    // Settings tab event listeners
    const settingsForm = container.querySelector('#settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSaveSettings(container);
      });

      // Settings form validation removed - admin has full control

      // Collapsible settings sections
      const settingsHeaders = container.querySelectorAll('.settings-header');
      settingsHeaders.forEach((header) => {
        header.addEventListener('click', () => {
          const section = header.closest('.settings-section');
          section.classList.toggle('collapsed');
        });
      });

      // Sync color pickers with text inputs
      setupColorSync(container, 'color-accent');
      setupColorSync(container, 'color-accent-light');
      setupColorSync(container, 'color-accent-dark');

      // Render holiday banners section
      renderHolidayBanners(container);

      // Clear dismissed banners button
      const clearDismissedBtn = container.querySelector('#clear-dismissed-btn');
      if (clearDismissedBtn) {
        clearDismissedBtn.addEventListener('click', () => {
          if (window.holidayBannerService) {
            window.holidayBannerService.clearDismissed();
            window.holidayBannerService.showBanner();
            if (window.toastService) {
              window.toastService.show(
                'Dismissed banners cleared! Active banner should now appear.',
                'success'
              );
            } else {
              alert('✅ Dismissed banners cleared!');
            }
          }
        });
      }

      // Test current banner button
      const testCurrentBtn = container.querySelector('#test-current-banner-btn');
      if (testCurrentBtn) {
        testCurrentBtn.addEventListener('click', () => {
          if (window.holidayBannerService) {
            window.holidayBannerService.clearDismissed();
            window.holidayBannerService.showBanner();
            if (window.toastService) {
              window.toastService.show('Checking for active banner...', 'info');
            }
          }
        });
      }
    }

    // Password change form event listener
    const passwordForm = container.querySelector('#password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => handlePasswordChange(this, e));

      // Password validation removed - admin has full control
    }

    // Security monitoring event listeners
    const refreshStatsBtn = container.querySelector('#refresh-security-stats');
    const clearDataBtn = container.querySelector('#clear-security-data');

    if (refreshStatsBtn) {
      refreshStatsBtn.addEventListener('click', () => updateSecurityStats(this, container));
    }

    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', (e) => handleClearSecurityData(this, e, container));
    }

    // Security incidents monitoring
    const refreshIncidentsBtn = container.querySelector('#refresh-incidents');
    const clearIncidentsBtn = container.querySelector('#clear-incidents');

    if (refreshIncidentsBtn) {
      refreshIncidentsBtn.addEventListener('click', () => updateSecurityIncidents(this, container));
    }

    if (clearIncidentsBtn) {
      clearIncidentsBtn.addEventListener('click', (e) => handleClearIncidents(this, e, container));
    }

    // Initialize security stats and incidents on load
    updateSecurityStats(this, container);
    updateSecurityIncidents(this, container);

    // Password strength indicator
    const newPasswordInput = container.querySelector('#new-password');
    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', (e) => updatePasswordStrength(e.target.value));
    }
  }

  handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      // Show customer nav items
      document.querySelectorAll('.customer-only').forEach((el) => (el.style.display = ''));
      const navLogout = document.getElementById('nav-logout');
      if (navLogout) navLogout.style.display = 'none';
      // Show footer
      const footer = document.querySelector('.site-footer');
      if (footer) footer.style.display = '';
      window.location.href = '/admin-login';
    }
  }
}
