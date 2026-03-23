/* HolidayBannerService.js - Macedonia holiday sales banners with countdown */

export class HolidayBannerService {
  constructor(brandSlug) {
    this.storageKey = `${brandSlug}_holiday_banners`;
    this.dismissedKey = `${brandSlug}_dismissed_banners`;
    this.banners = this.loadBanners();
    this.dismissedBanners = this.loadDismissed();
    this.countdownInterval = null;
  }

  loadBanners() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const savedBanners = JSON.parse(data);
        const defaultBanners = this.getDefaultBanners();

        // Merge saved banners with default banners to ensure new properties are included
        const mergedBanners = defaultBanners.map((defaultBanner) => {
          const savedBanner = savedBanners.find((sb) => sb.id === defaultBanner.id);
          return savedBanner ? { ...defaultBanner, ...savedBanner } : defaultBanner;
        });

        return mergedBanners;
      }
      return this.getDefaultBanners();
    } catch (e) {
      console.error('Failed to load holiday banners:', e);
      return this.getDefaultBanners();
    }
  }

  loadDismissed() {
    try {
      const data = localStorage.getItem(this.dismissedKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveDismissed() {
    try {
      localStorage.setItem(this.dismissedKey, JSON.stringify(this.dismissedBanners));
    } catch (e) {
      console.error('Failed to save dismissed banners:', e);
    }
  }

  getDefaultBanners() {
    const currentYear = new Date().getFullYear();

    return [
      {
        id: 'christmas-2025',
        title: '🎄 Christmas Sale',
        message: 'Special holiday discounts - Up to 50% OFF on entire collection',
        icon: '🎅',
        enabled: true,
        startDate: `${currentYear}-12-01`,
        endDate: `${currentYear}-12-31`,
        backgroundColor: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
        textColor: '#FFFFFF',
        heroBackground:
          'linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(185,28,28,0.05) 50%, rgba(127,29,29,0.03) 100%), radial-gradient(circle at 30% 70%, rgba(34,197,94,0.06) 0%, transparent 60%)',
      },
      {
        id: 'new-year-2026',
        title: '🎆 New Year Sale 2026',
        message: 'Start the year right - Save up to 40% on all shoes',
        icon: '🎉',
        enabled: true,
        startDate: `${currentYear + 1}-01-01`,
        endDate: `${currentYear + 1}-01-07`,
        backgroundColor: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
        textColor: '#FFFFFF',
        heroBackground:
          'linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(239,68,68,0.05) 50%, rgba(248,113,113,0.03) 100%), radial-gradient(circle at 70% 30%, rgba(251,191,36,0.06) 0%, transparent 60%)',
      },
      {
        id: 'easter-2026',
        title: '🐣 Easter Spring Sale',
        message: 'Fresh styles for spring - Special holiday pricing',
        icon: '🌸',
        enabled: true,
        startDate: `${currentYear + 1}-04-10`,
        endDate: `${currentYear + 1}-04-21`,
        backgroundColor: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
        textColor: '#FFFFFF',
        heroBackground:
          'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(167,139,250,0.05) 50%, rgba(196,181,253,0.03) 100%), radial-gradient(circle at 20% 80%, rgba(34,197,94,0.06) 0%, transparent 60%)',
      },
      {
        id: 'black-friday-2026',
        title: '⚡ Black Friday Deals',
        message: "Biggest savings of the year - Don't miss out",
        icon: '🛍️',
        enabled: true,
        startDate: `${currentYear + 1}-11-25`,
        endDate: `${currentYear + 1}-11-30`,
        backgroundColor: 'linear-gradient(135deg, #000000 0%, #1f2937 100%)',
        textColor: '#fbbf24',
        heroBackground:
          'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(31,41,55,0.05) 50%, rgba(55,65,81,0.03) 100%), radial-gradient(circle at 80% 20%, rgba(251,191,36,0.06) 0%, transparent 60%)',
      },
      {
        id: 'spring-sale-2026',
        title: '🌷 Spring Collection',
        message: 'New arrivals now on sale - Refresh your style',
        icon: '☀️',
        enabled: true,
        startDate: `${currentYear + 1}-03-15`,
        endDate: `${currentYear + 1}-03-31`,
        backgroundColor: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
        textColor: '#FFFFFF',
        heroBackground:
          'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(74,222,128,0.05) 50%, rgba(110,231,183,0.03) 100%), radial-gradient(circle at 40% 60%, rgba(251,191,36,0.06) 0%, transparent 60%)',
      },
      {
        id: 'summer-sale-2026',
        title: '🏖️ Summer Clearance',
        message: 'Beat the heat with cool prices - Up to 60% OFF',
        icon: '😎',
        enabled: true,
        startDate: `${currentYear + 1}-07-01`,
        endDate: `${currentYear + 1}-07-31`,
        backgroundColor: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
        textColor: '#FFFFFF',
        heroBackground:
          'linear-gradient(135deg, rgba(234,88,12,0.08) 0%, rgba(251,146,60,0.05) 50%, rgba(253,186,116,0.03) 100%), radial-gradient(circle at 60% 40%, rgba(251,191,36,0.06) 0%, transparent 60%)',
      },
    ];
  }

  getActiveBanner() {
    const now = new Date();

    // Find first enabled banner that hasn't been dismissed
    for (const banner of this.banners) {
      // Skip if not enabled
      if (!banner.enabled) {
        continue;
      }

      // Skip if dismissed
      if (this.dismissedBanners.includes(banner.id)) {
        continue;
      }

      // Check if always-on (no dates or empty dates)
      if (!banner.startDate || !banner.endDate) {
        return banner;
      }

      // Check date range
      const startDate = new Date(banner.startDate);
      const endDate = new Date(banner.endDate + 'T23:59:59');

      if (now >= startDate && now <= endDate) {
        return banner;
      }
    }

    return null;
  }

  dismissBanner(bannerId) {
    if (!this.dismissedBanners.includes(bannerId)) {
      this.dismissedBanners.push(bannerId);
      this.saveDismissed();
    }
  }

  clearDismissed() {
    this.dismissedBanners = [];
    this.saveDismissed();
  }

  getCountdown(endDate) {
    const now = new Date();
    const end = new Date(endDate + 'T23:59:59');
    const diff = end - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }

  formatCountdown(countdown) {
    if (!countdown) return '';

    const parts = [];

    if (countdown.days > 0) {
      parts.push(`${countdown.days}d`);
    }
    if (countdown.hours > 0 || countdown.days > 0) {
      parts.push(`${countdown.hours}h`);
    }
    if (countdown.minutes > 0 || countdown.hours > 0 || countdown.days > 0) {
      parts.push(`${countdown.minutes}m`);
    }
    parts.push(`${countdown.seconds}s`);

    return parts.join(' ');
  }

  showBanner() {
    const activeBanner = this.getActiveBanner();

    if (!activeBanner) {
      this.hideBanner();
      return;
    }

    const banner = document.getElementById('holiday-banner');
    const title = document.getElementById('holiday-banner-title');
    const message = document.getElementById('holiday-banner-message');
    const icon = document.querySelector('.holiday-banner-icon');
    const countdown = document.getElementById('holiday-banner-countdown');
    const closeBtn = document.getElementById('holiday-banner-close');

    if (!banner) {
      console.error('Holiday banner element not found in DOM');
      return;
    }

    // Set content
    title.textContent = activeBanner.title;
    message.textContent = activeBanner.message;
    icon.textContent = activeBanner.icon;

    // Set colors (support gradients)
    if (activeBanner.backgroundColor.includes('gradient')) {
      banner.style.background = activeBanner.backgroundColor;
    } else {
      banner.style.backgroundColor = activeBanner.backgroundColor;
    }
    banner.style.color = activeBanner.textColor;

    // Apply festive hero background
    this.applyHeroBackground(activeBanner);

    // Show banner
    banner.style.display = 'block';

    // Animate in
    setTimeout(() => {
      banner.classList.add('active');
    }, 100);

    // Update countdown
    const updateCountdown = () => {
      const timeLeft = this.getCountdown(activeBanner.endDate);
      if (timeLeft) {
        countdown.textContent = `Ends in: ${this.formatCountdown(timeLeft)}`;
      } else {
        this.hideBanner();
        this.dismissBanner(activeBanner.id);
      }
    };

    updateCountdown();
    this.countdownInterval = setInterval(updateCountdown, 1000);

    // Remove any existing close button listeners and setup new one
    if (!closeBtn) {
      console.error('Close button not found');
      return;
    }

    // Remove old button and create fresh one to clear all event listeners
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    // Use arrow function to preserve 'this' context and add comprehensive event handling
    const handleClose = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Clear interval first
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }

      // Hide and dismiss
      this.hideBanner();
      this.dismissBanner(activeBanner.id);

      return false;
    };

    // Add multiple event types for maximum compatibility
    newCloseBtn.addEventListener('click', handleClose, { capture: true });
    newCloseBtn.addEventListener('mousedown', handleClose, { capture: true });
    newCloseBtn.addEventListener('touchstart', handleClose, { capture: true, passive: false });

    // Keyboard support
    newCloseBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleClose(e);
      }
    });

    // Make absolutely sure button is interactive
    newCloseBtn.style.cssText =
      'pointer-events: auto !important; cursor: pointer !important; z-index: 10001 !important;';

    // Reset navbar position
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.top = '0';
    }
  }

  applyHeroBackground(activeBanner) {
    const hero = document.querySelector('.hero');
    if (hero && activeBanner.heroBackground) {
      hero.setAttribute('data-holiday-bg', activeBanner.id);
      hero.classList.add('holiday-hero-active');
    }
  }

  resetHeroBackground() {
    const hero = document.querySelector('.hero');
    if (hero) {
      hero.removeAttribute('data-holiday-bg');
      hero.classList.remove('holiday-hero-active');
    }
  }

  hideBanner() {
    const banner = document.getElementById('holiday-banner');
    if (banner) {
      banner.classList.remove('active');
      setTimeout(() => {
        banner.style.display = 'none';
      }, 300);
    }

    // Reset hero background
    this.resetHeroBackground();

    // Reset navbar position
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.top = '0';
    }

    // Clear countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  saveBanners(banners) {
    try {
      this.banners = banners;
      localStorage.setItem(this.storageKey, JSON.stringify(banners));
    } catch (e) {
      console.error('Failed to save banners:', e);
    }
  }

  getBanners() {
    return this.banners;
  }
}
