/* Application.js - Main application class for better OOP structure */
import { SocialLinkFactory } from './SocialLinkFactory.js';
import { escapeHtml } from './helpers.js';

export class Application {
  constructor(serviceContainer, config) {
    this.serviceContainer = serviceContainer;
    this.config = config;
    this.main = document.getElementById('main');
    this.loadingScreen = document.getElementById('loading-screen');
    this.navbar = document.querySelector('.navbar');
  }

  initBrandElements() {
    const brandName = this.config.brand.name;
    const phone = this.config.contact.phone;
    const whatsappPhone = phone.replace(/\D/g, '');

    document.getElementById('brand-name').textContent = brandName;
    document.getElementById('footer-brand').textContent = brandName;
    document.getElementById('copyright-brand').textContent = brandName;

    const footerPhone = document.getElementById('footer-phone');
    footerPhone.href = `tel:${phone}`;

    const whatsappLink = document.getElementById('whatsapp-link');
    if (whatsappLink) whatsappLink.href = `https://wa.me/${whatsappPhone}`;

    document.querySelectorAll('.brand-name').forEach((el) => (el.textContent = brandName));

    document.title = `${brandName} — ${this.config.brand.tagline}`;
  }

  initFooterSocialLinks() {
    const socialContainer = document.getElementById('footer-social');
    if (!socialContainer) return;

    const social = { ...(this.config.social || {}) };
    // Footer WhatsApp: use social.whatsapp if set; else digits from contact.phone (same as header WA intent).
    if (!social.whatsapp && this.config.contact?.phone) {
      social.whatsapp = this.config.contact.phone.replace(/\D/g, '');
    }
    socialContainer.innerHTML = '';

    // Use factory to create social links
    const socialLinks = SocialLinkFactory.createSocialLinks(social);
    socialLinks.forEach((link) => socialContainer.appendChild(link));
  }

  updateWishlistBadge() {
    const badge = document.getElementById('wishlist-badge');
    const wishlistService = this.serviceContainer.get('wishlistService');
    const count = wishlistService.getCount();

    if (badge) {
      badge.textContent = count;
      badge.dataset.count = String(count);
    }
  }

  setupEventListeners() {
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        this.navbar.classList.add('scrolled');
      } else {
        this.navbar.classList.remove('scrolled');
      }

      // Show/hide scroll to top button
      const scrollToTop = document.getElementById('scroll-to-top');
      if (scrollToTop) {
        if (window.scrollY > 400) {
          scrollToTop.classList.add('visible');
        } else {
          scrollToTop.classList.remove('visible');
        }
      }
    });

    // Hero scroll button
    const heroExplore = document.getElementById('hero-explore');
    if (heroExplore) {
      heroExplore.addEventListener('click', () => {
        const mainSection = document.getElementById('main');
        mainSection.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Scroll to top button
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Listen for wishlist updates
    window.addEventListener('wishlist-updated', () => {
      this.updateWishlistBadge();
    });

    // Update badge on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateWishlistBadge();
      }
    });

    // Handle back/forward cache (bfcache) - force reload on navigation
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        // Page was restored from bfcache, reload to ensure proper state
        console.log('Page restored from bfcache, reloading...');
        window.location.reload();
      }
    });

    // Global error handlers
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showErrorNotification('Something went wrong. Please refresh the page.');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showErrorNotification('An unexpected error occurred.');
    });
  }

  showErrorNotification(message, duration = 5000) {
    const existing = document.getElementById('error-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'error-notification';
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="error-notification-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${escapeHtml(message)}</span>
        <button class="error-notification-close" aria-label="Close">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    const closeBtn = notification.querySelector('.error-notification-close');
    closeBtn.addEventListener('click', () => notification.remove());

    setTimeout(() => notification.classList.add('visible'), 10);

    if (duration > 0) {
      setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
  }

  init() {
    console.log('Application init starting');
    // Initialize brand elements
    this.initBrandElements();
    this.initFooterSocialLinks();

    // Update wishlist badge initially
    this.updateWishlistBadge();

    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Setup event listeners
    this.setupEventListeners();

    // Hide loading screen
    console.log('Hiding loading screen');
    setTimeout(() => {
      this.loadingScreen.classList.add('hidden');
      console.log('Loading screen hidden');
    }, 400);
  }
}
