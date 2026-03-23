/* navbar.js - Navbar utilities */
export function updateNavbar() {
  const isAdmin = window.authService.isAuthenticated();
  const customerElements = document.querySelectorAll('.customer-only');
  const adminElements = document.querySelectorAll('.admin-only');

  if (isAdmin) {
    // Show admin nav items, hide customer items
    customerElements.forEach((el) => (el.style.display = 'none'));
    adminElements.forEach((el) => {
      el.style.display = 'block';
      el.classList.remove('admin-hidden'); // Remove the hiding class
    });

    // Attach logout handler to both desktop and mobile buttons
    const navLogout = document.getElementById('nav-logout');
    const mobileNavLogout = document.getElementById('mobile-nav-logout');

    if (navLogout) {
      navLogout.addEventListener('click', handleLogout);
    }
    if (mobileNavLogout) {
      mobileNavLogout.addEventListener('click', handleLogout);
    }
  } else {
    // Show customer nav items, hide admin items
    customerElements.forEach((el) => (el.style.display = 'block'));
    adminElements.forEach((el) => (el.style.display = 'none'));
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    window.authService.logout();
    // Reset navbar to customer view
    document.querySelectorAll('.customer-only').forEach((el) => (el.style.display = 'block'));
    document.querySelectorAll('.admin-only').forEach((el) => (el.style.display = 'none'));
    // Show footer
    const footer = document.querySelector('.site-footer');
    if (footer) footer.style.display = '';
    // Redirect to login page
    window.location.href = '/admin-login';
  }
}

/* ============================================
   PERFECT HAMBURGER MENU IMPLEMENTATION
   ============================================ */

class MobileMenu {
  constructor() {
    this.menuBtn = null;
    this.overlay = null;
    this.panel = null;
    this.navLinks = null;
    this.isOpen = false;
    this.focusableElements = [];
    this.lastFocusedElement = null;

    // Defer initialization until DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.createElements();
    this.bindEvents();
  }

  createElements() {
    // Use existing overlay and panel from HTML
    this.overlay = document.getElementById('mobile-nav-overlay');
    this.panel = document.getElementById('mobile-nav-panel');
    this.navLinks = this.panel?.querySelector('.mobile-nav-links');

    // Get menu button
    this.menuBtn = document.getElementById('mobile-menu-btn');

    // Get close button
    const closeBtn = document.getElementById('mobile-nav-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  bindEvents() {
    if (!this.menuBtn) return;

    // Menu button click
    this.menuBtn.addEventListener('click', () => this.toggle());

    // Overlay click
    this.overlay.addEventListener('click', () => this.close());

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Navigation links click
    this.navLinks.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-link')) {
        this.close();
      }
    });

    // Focus management
    this.panel.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    // Prevent body scroll when menu is open
    this.preventBodyScroll();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.lastFocusedElement = document.activeElement;

    // Update button state
    this.menuBtn.setAttribute('aria-expanded', 'true');
    this.menuBtn.classList.add('active');

    // Show overlay and panel
    this.overlay.classList.add('active');
    this.panel.classList.add('active');

    // Update ARIA attributes
    this.overlay.setAttribute('aria-hidden', 'false');

    // Focus management
    this.updateFocusableElements();
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Announce to screen readers
    this.announceToScreenReader('Navigation menu opened');
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Update button state
    this.menuBtn.setAttribute('aria-expanded', 'false');
    this.menuBtn.classList.remove('active');

    // Hide overlay and panel
    this.overlay.classList.remove('active');
    this.panel.classList.remove('active');

    // Update ARIA attributes
    this.overlay.setAttribute('aria-hidden', 'true');

    // Restore focus
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }

    // Restore body scroll
    document.body.style.overflow = '';

    // Announce to screen readers
    this.announceToScreenReader('Navigation menu closed');
  }

  updateFocusableElements() {
    this.focusableElements = Array.from(
      this.panel.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
  }

  handleKeydown(e) {
    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  preventBodyScroll() {
    const touchMove = (e) => {
      if (!this.isOpen) return;

      // Allow scrolling within the panel, but prevent body scroll
      if (this.panel.contains(e.target)) {
        return;
      }

      e.preventDefault();
    };

    document.addEventListener('touchmove', touchMove, { passive: false });
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  updateNavLinks() {
    // Update mobile nav links when desktop nav changes
    const originalNav = document.getElementById('nav-links');
    const mobileNav = document.querySelector('.mobile-nav-links');

    if (originalNav && mobileNav) {
      // Update specific elements that might change
      const originalWishlist = originalNav.querySelector('#wishlist-link');
      const mobileWishlist = mobileNav.querySelector('#mobile-wishlist-link');

      if (originalWishlist && mobileWishlist) {
        const badge = originalWishlist.querySelector('.wishlist-badge');
        const mobileBadge = mobileWishlist.querySelector('.wishlist-badge');
        if (badge && mobileBadge) {
          mobileBadge.textContent = badge.textContent;
        }
      }
    }
  }
}

// Export the mobile menu instance
export const mobileMenu = new MobileMenu();

// Update mobile nav when desktop nav changes
export function updateMobileNav() {
  mobileMenu.updateNavLinks();
}
