/* app.js - Main application entry point
   
   ARCHITECTURE: Modular OOP with clean separation of concerns
   
   GLOBAL SERVICES (dynamically linked via window object):
   - window.catalog: Product catalog (data structure)
   - window.authService: Authentication management
   - window.productService: Product CRUD operations
   - window.wishlistService: Wishlist management with localStorage
   - window.currencyService: Currency toggle (EUR/MKD) with localStorage persistence
   - window.socialService: Social sharing and engagement tracking
   - window.toggleCurrency: Currency toggle function for inline onclick
   
   DATA FLOW:
   1. Services initialize and expose themselves globally
   2. Views access services via window object for dynamic linking
   3. Events (wishlist-updated, currency-changed) trigger UI updates
   4. LocalStorage persists user preferences (wishlist, currency, views)
   
   CURRENCY SYSTEM:
   - All prices stored with data-eur and data-mkd attributes
   - CurrencyService manages current selection and formatting
   - updateAllPrices() scans DOM and updates all [data-eur][data-mkd] elements
   - Currency preference persists in localStorage
   
   WISHLIST SYSTEM:
   - WishlistService manages array of product IDs in localStorage
   - Custom events ('wishlist-updated') trigger badge updates
   - Heart buttons in all views (home, collection, wishlist, product)
   - Badge auto-hides when count = 0
   
   SOCIAL FEATURES:
   - Track product views (social proof)
   - Share on WhatsApp, Facebook, Twitter, Pinterest
   - Email product to friend
   - Copy link to clipboard
*/

import storeConfig from './config/store.config.js';
import { catalog as catalogPromise } from './data/products.js';
import { HomeView } from './views/home/HomeView.js';
import { ProductView } from './views/product/ProductView.js';
import { CollectionView } from './views/collection/CollectionView.js';
import { AdminView } from './views/admin/AdminView.js';
import { LoginView } from './views/login/LoginView.js';
import { WishlistView } from './views/wishlist/WishlistView.js';
import { Router } from './router/Router.js';
import { AuthService } from './services/AuthService.js';
import { ProductService } from './services/ProductService.js';
import { WishlistService } from './services/WishlistService.js';
import { CurrencyService } from './services/CurrencyService.js';
import { SocialService } from './services/SocialService.js';
import { HolidayBannerService } from './services/HolidayBannerService.js';
import { CSRFProtection } from './utils/CSRFProtection.js';
import { SecurityUtils } from './utils/security.js';
import { InputValidation } from './utils/inputValidation.js';
import { ErrorBoundary } from './utils/ErrorBoundary.js';
import { ServiceContainer } from './utils/ServiceContainer.js';
import { Application } from './utils/Application.js';
import { switchToView } from './utils/viewSwitcher.js';
import { updateNavbar, updateMobileNav } from './utils/navbar.js';

// Load config from localStorage if exists (admin changes), otherwise use default
let activeConfig = storeConfig;
const savedConfig = localStorage.getItem('storeConfig');
if (savedConfig) {
  try {
    const parsedConfig = JSON.parse(savedConfig);
    // Validate that the config has expected structure
    if (
      typeof parsedConfig === 'object' &&
      parsedConfig !== null &&
      parsedConfig.brand &&
      parsedConfig.business
    ) {
      activeConfig = { ...storeConfig, ...parsedConfig };
    } else {
      console.warn('Invalid config structure, using default');
      localStorage.removeItem('storeConfig'); // Clear invalid config
    }
  } catch (e) {
    console.error('Failed to parse saved config:', e);
    localStorage.removeItem('storeConfig'); // Clear corrupted config
  }
}

const PHONE = activeConfig.contact.phone;
const main = document.getElementById('main');

// Wait for catalog to load
const catalog = await catalogPromise;

// Expose config globally
window.storeConfig = activeConfig;
window.catalog = catalog;

// Apply saved color settings immediately
if (activeConfig.colors) {
  document.documentElement.style.setProperty('--accent', activeConfig.colors.accent);
  document.documentElement.style.setProperty('--accent-light', activeConfig.colors.accentLight);
  document.documentElement.style.setProperty('--accent-dark', activeConfig.colors.accentDark);
}

// Create brand slug for service keys
const brandSlug = activeConfig.brand.name.toLowerCase().replace(/\s+/g, '_');

// Initialize services with config
const authService = new AuthService(brandSlug);
const productService = new ProductService(catalog);
const wishlistService = new WishlistService(brandSlug);
const currencyService = new CurrencyService(
  activeConfig.business.defaultCurrency,
  activeConfig.business.exchangeRate
);
const socialService = new SocialService(brandSlug);
const holidayBannerService = new HolidayBannerService(brandSlug);
const csrfProtection = new CSRFProtection();
const securityUtils = new SecurityUtils();
const inputValidation = new InputValidation();
const errorBoundary = new ErrorBoundary();

// Create service container for proper dependency injection
const serviceContainer = new ServiceContainer();

// Register all services
serviceContainer
  .register('authService', authService)
  .register('productService', productService)
  .register('wishlistService', wishlistService)
  .register('currencyService', currencyService)
  .register('socialService', socialService)
  .register('holidayBannerService', holidayBannerService)
  .register('csrfProtection', csrfProtection)
  .register('securityUtils', securityUtils)
  .register('inputValidation', inputValidation)
  .register('errorBoundary', errorBoundary)
  .register('catalog', catalog)
  .register('storeConfig', activeConfig);

// Expose service container globally for backward compatibility
window.serviceContainer = serviceContainer;

// Get services object for views
const services = serviceContainer.getAll();

// Keep individual services exposed for existing code (will be phased out)
window.authService = authService;
window.productService = productService;
window.wishlistService = wishlistService;
window.currencyService = currencyService;
window.socialService = socialService;
window.holidayBannerService = holidayBannerService;
window.csrfProtection = csrfProtection;
window.securityUtils = securityUtils;
window.inputValidation = inputValidation;
window.errorBoundary = errorBoundary;
window.catalog = catalog;

// Create application instance
// Initialize application when DOM is ready
const initializeApp = async () => {
  try {
    const app = new Application(serviceContainer, activeConfig);
    await app.init();

    // Keep backward compatibility for existing code
    window.showErrorNotification = app.showErrorNotification.bind(app);

    // Expose app globally for router access
    window.app = app;

    // Router is initialized at the end of the file
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Fallback: show basic error message
    document.body.innerHTML =
      '<div style="text-align:center;padding:50px;"><h1>App failed to load</h1><p>Please refresh the page.</p></div>';
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Currency toggle - use centralized service
function toggleCurrency() {
  currencyService.toggle();
  // Update both desktop and mobile currency buttons
  currencyService.updateButton(document.getElementById('currency-toggle'));
  const mobileToggle = document.getElementById('mobile-currency-toggle');
  if (mobileToggle) {
    currencyService.updateButton(mobileToggle);
  }
  currencyService.updateAllPrices();
}

// Listen for currency changes
window.addEventListener('currency-changed', () => {
  currencyService.updateButton(document.getElementById('currency-toggle'));
  const mobileToggle = document.getElementById('mobile-currency-toggle');
  if (mobileToggle) {
    currencyService.updateButton(mobileToggle);
  }
  currencyService.updateAllPrices();
});

// Initialize currency buttons on load
currencyService.updateButton(document.getElementById('currency-toggle'));
const mobileCurrencyToggle = document.getElementById('mobile-currency-toggle');
if (mobileCurrencyToggle) {
  mobileCurrencyToggle.addEventListener('click', toggleCurrency);
  currencyService.updateButton(mobileCurrencyToggle);
}

// Expose toggle function globally for inline onclick
window.toggleCurrency = toggleCurrency;

// Expose updateNavbar globally so AdminView can use it
window.updateNavbar = updateNavbar;
window.updateMobileNav = updateMobileNav;

// Initialize views
const homeView = new HomeView(catalog, services);
const productView = new ProductView(catalog, PHONE, services);
const collectionView = new CollectionView(catalog, services);
const wishlistView = new WishlistView(catalog, services);

// Setup routing (will be called after app is ready)
const routes = {
  home: (page = 1) => {
    switchToView(homeView, () => {
      // Show hero on home page
      const hero = document.getElementById('hero');
      if (hero) hero.style.display = 'flex';

      // Show footer
      const footer = document.querySelector('.site-footer');
      if (footer) footer.style.display = '';

      // Update navbar based on auth state
      updateNavbar();
      updateMobileNav();

      const content = homeView.render(page);
      main.innerHTML = '';
      main.appendChild(content);

      // Attach event listeners for navigation
      content.querySelector('#grid').addEventListener('click', (e) => {
        const card = e.target.closest('.card[data-slug]');
        if (card) {
          router.navigate(`/product/${card.dataset.slug}`);
        }
      });

      content.querySelector('#pagination').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-page]');
        if (btn) {
          const page = Number(btn.dataset.page);
          router.routes.home(page);
        }
      });
    });
  },

  collection: () => {
    // Hide hero on collection page
    const hero = document.getElementById('hero');
    if (hero) hero.style.display = 'none';

    // Update navbar based on auth state
    updateNavbar();
    updateMobileNav();

    const content = collectionView.render();
    main.innerHTML = '';
    main.appendChild(content);

    // Attach event listeners
    content.querySelector('#collection-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.card[data-slug]');
      if (card) {
        router.navigate(`/product/${card.dataset.slug}`);
      }
    });

    // Wishlist button handlers
    content.querySelectorAll('.wishlist-btn').forEach((btn) => {
      const productId = parseInt(btn.dataset.id);

      if (wishlistService.isInWishlist(productId)) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
          const result = await wishlistService.toggle(productId);
          if (result.success) {
            btn.classList.toggle('active');
            if (window.app && window.app.updateWishlistBadge) {
              window.app.updateWishlistBadge();
            }
          } else {
            console.error('Wishlist toggle failed:', result.error);
            if (window.showErrorNotification) {
              window.showErrorNotification('Failed to update wishlist');
            }
          }
        } catch (error) {
          console.error('Wishlist error:', error);
          if (window.showErrorNotification) {
            window.showErrorNotification('Failed to update wishlist');
          }
        }
      });
    });

    // Update prices based on current currency
    currencyService.updateAllPrices();
  },

  wishlist: () => {
    const hero = document.getElementById('hero');
    if (hero) hero.style.display = 'none';

    // Show footer
    const footer = document.querySelector('.site-footer');
    if (footer) footer.style.display = '';

    // Update navbar based on auth state
    updateNavbar();
    updateMobileNav();

    const content = wishlistView.render();
    main.innerHTML = '';
    main.appendChild(content);

    // Update badge to show current count
    if (window.app && window.app.updateWishlistBadge) {
      window.app.updateWishlistBadge();
    }

    // Animate cards
    setTimeout(() => {
      const cards = document.querySelectorAll('.card');
      cards.forEach((card, idx) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
          card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, idx * 100);
      });
    }, 50);

    // Attach event listeners
    const grid = content.querySelector('#wishlist-grid');
    if (grid) {
      // Wishlist button handlers - attach BEFORE grid click to ensure they fire first
      content.querySelectorAll('.wishlist-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const productId = parseInt(btn.dataset.id);
          (async () => {
            try {
              const result = await wishlistService.toggle(productId);
              if (result.success) {
                if (window.app && window.app.updateWishlistBadge) {
                  window.app.updateWishlistBadge();
                }
                // Re-render wishlist page after removal
                setTimeout(() => {
                  router.routes.wishlist();
                }, 50);
              } else {
                console.error('Wishlist toggle failed:', result.error);
                if (window.showErrorNotification) {
                  window.showErrorNotification('Failed to update wishlist');
                }
              }
            } catch (error) {
              console.error('Wishlist error:', error);
              if (window.showErrorNotification) {
                window.showErrorNotification('Failed to update wishlist');
              }
            }
          })();
        });
      });

      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.card[data-slug]');
        const isWishlistBtn = e.target.closest('.wishlist-btn');
        if (card && !isWishlistBtn) {
          router.navigate(`/product/${card.dataset.slug}`);
        }
      });
    }

    // Update prices based on current currency
    currencyService.updateAllPrices();
  },

  product: (slug) => {
    // Hide hero on product pages
    const hero = document.getElementById('hero');
    if (hero) hero.style.display = 'none';

    // Update navbar based on auth state
    updateNavbar();
    updateMobileNav();

    const product = catalog.findBySlug(slug);
    if (!product) {
      router.routes.notFound();
      return;
    }

    // Clear main content and reset any cached styles
    main.innerHTML = '';
    main.style.opacity = '';
    main.style.transform = '';

    const content = productView.render(product.id);
    main.appendChild(content);

    // Update wishlist count in product view
    if (window.app && window.app.updateWishlistBadge) {
      window.app.updateWishlistBadge();
    }

    // Update prices based on current currency immediately
    currencyService.updateAllPrices();

    // Reset any gallery/details styles from previous animations
    const gallery = document.querySelector('.gallery');
    const details = document.querySelector('.details');
    if (gallery) {
      gallery.style.opacity = '';
      gallery.style.transform = '';
      gallery.style.transition = '';
    }
    if (details) {
      details.style.opacity = '';
      details.style.transform = '';
      details.style.transition = '';
    }

    // Animate product page entrance only after DOM is fully ready
    setTimeout(() => {
      const gallery = document.querySelector('.gallery');
      const details = document.querySelector('.details');

      if (gallery) {
        gallery.style.opacity = '0';
        gallery.style.transform = 'translateX(-30px)';
        gallery.style.transition = 'none'; // Prevent flash

        requestAnimationFrame(() => {
          gallery.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          gallery.style.opacity = '1';
          gallery.style.transform = 'translateX(0)';
        });
      }

      if (details) {
        details.style.opacity = '0';
        details.style.transform = 'translateX(30px)';
        details.style.transition = 'none'; // Prevent flash

        setTimeout(() => {
          requestAnimationFrame(() => {
            details.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            details.style.opacity = '1';
            details.style.transform = 'translateX(0)';
          });
        }, 100);
      }
    }, 50);

    // Handle similar items navigation and wishlist after DOM is ready
    setTimeout(() => {
      const similarGrid = content.querySelector('#similar-items-grid');
      if (similarGrid) {
        // Wishlist button handlers for similar items
        content.querySelectorAll('#similar-items-grid .wishlist-btn').forEach((btn) => {
          const productId = parseInt(btn.dataset.id);

          if (wishlistService.isInWishlist(productId)) {
            btn.classList.add('active');
          }

          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            try {
              const result = await wishlistService.toggle(productId);
              if (result.success) {
                btn.classList.toggle('active');
                if (window.app && window.app.updateWishlistBadge) {
                  window.app.updateWishlistBadge();
                }
              } else {
                console.error('Wishlist toggle failed:', result.error);
                if (window.showErrorNotification) {
                  window.showErrorNotification('Failed to update wishlist');
                }
              }
            } catch (error) {
              console.error('Wishlist error:', error);
              if (window.showErrorNotification) {
                window.showErrorNotification('Failed to update wishlist');
              }
            }
          });
        });

        // Card navigation handler
        similarGrid.addEventListener('click', (e) => {
          const card = e.target.closest('.similar-card[data-slug]');
          const isWishlistBtn = e.target.closest('.wishlist-btn');
          if (card && !isWishlistBtn) {
            router.navigate(`/product/${card.dataset.slug}`);
          }
        });
      }
    }, 100);
  },

  admin: async () => {
    // Check authentication
    if (!authService.isAuthenticated()) {
      // Use setTimeout to avoid accessing router before initialization
      setTimeout(() => router.navigate('/admin-login'), 0);
      return;
    }

    const hero = document.getElementById('hero');
    if (hero) hero.style.display = 'none';

    // Update navbar based on auth state
    updateNavbar();
    updateMobileNav();

    const adminView = new AdminView(services);
    const content = await adminView.render();
    main.innerHTML = '';
    main.appendChild(content);
  },

  adminLogin: () => {
    // If already authenticated and not forcing login, redirect to admin
    const urlParams = new URLSearchParams(window.location.search);
    const forceLogin = urlParams.get('force') === 'true';

    if (authService.isAuthenticated() && !forceLogin) {
      // Use setTimeout to avoid accessing router before initialization
      setTimeout(() => router.navigate('/admin'), 0);
      return;
    }

    const hero = document.getElementById('hero');
    if (hero) hero.style.display = 'none';

    // Update navbar based on auth state
    updateNavbar();
    updateMobileNav();

    const loginView = new LoginView(services);
    const content = loginView.render();
    main.innerHTML = '';
    main.appendChild(content);
  },

  notFound: () => {
    const hero = document.getElementById('hero');
    if (hero) hero.style.display = 'none';

    // Update navbar based on auth state
    updateNavbar();
    updateMobileNav();

    main.innerHTML = `
      <div class="not-found">
        <div class="not-found-content">
          <h2>Page Not Found</h2>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/" class="btn btn-primary">Back Home</a>
        </div>
      </div>
    `;
  },
};

const router = new Router(routes);

// Initialize holiday banner after router
window.holidayBannerService.showBanner();

// Initialize CSRF protection for all forms
window.csrfProtection.protectForms();

// Initialize UI event listeners
initUI();

// Expose helper function to clear dismissed banners (for testing)
window.clearDismissedBanners = () => {
  window.holidayBannerService.clearDismissed();
  window.holidayBannerService.showBanner();
};

// UI initialization function
function initUI() {
  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
      }
    });
  }

  // Currency toggle
  const currencyToggle = document.getElementById('currency-toggle');
  if (currencyToggle && window.currencyService) {
    currencyToggle.addEventListener('click', () => {
      window.currencyService.toggle();
      updateCurrencyButton();
    });
    updateCurrencyButton(); // Initial state
  }

  // Scroll to top button
  const scrollToTopBtn = document.getElementById('scroll-to-top');
  if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    });

    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Hero scroll button
  const heroScrollBtn = document.getElementById('hero-explore');
  if (heroScrollBtn) {
    heroScrollBtn.addEventListener('click', () => {
      const hero = document.getElementById('hero');
      if (hero) {
        const heroHeight = hero.offsetHeight;
        window.scrollTo({ top: heroHeight, behavior: 'smooth' });
      }
    });
  }
}

// Update currency button text
function updateCurrencyButton() {
  const currencyToggle = document.getElementById('currency-toggle');
  if (currencyToggle && window.currencyService) {
    const currentCurrency = window.currencyService.getCurrent();
    currencyToggle.textContent = `💵 ${currentCurrency}`;
  }
}
