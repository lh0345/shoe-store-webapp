/* CurrencyService.js - Centralized currency management */

export class CurrencyService {
  constructor(defaultCurrency = 'MKD', exchangeRate = 61.5) {
    this.defaultCurrency = defaultCurrency;
    this.exchangeRate = exchangeRate;

    // Migration: If switching from EUR-based system to MKD-based system,
    // reset currency preference to default
    const storedCurrency = localStorage.getItem('preferred_currency');
    const migrationDone = localStorage.getItem('currency_migration_v2');

    if (!migrationDone) {
      // First time after migration - reset to default
      localStorage.setItem('preferred_currency', this.defaultCurrency);
      localStorage.setItem('currency_migration_v2', 'true');
      this.currentCurrency = this.defaultCurrency;
    } else {
      const raw = storedCurrency || this.defaultCurrency;
      this.currentCurrency = raw === 'EUR' || raw === 'MKD' ? raw : this.defaultCurrency;
      if (this.currentCurrency !== raw) {
        localStorage.setItem('preferred_currency', this.currentCurrency);
      }
    }
  }

  getCurrent() {
    return this.currentCurrency;
  }

  toggle() {
    this.currentCurrency = this.currentCurrency === 'EUR' ? 'MKD' : 'EUR';
    localStorage.setItem('preferred_currency', this.currentCurrency);

    // Dispatch event for UI updates
    window.dispatchEvent(
      new CustomEvent('currency-changed', {
        detail: { currency: this.currentCurrency },
      })
    );

    return this.currentCurrency;
  }

  formatPrice(mkdPrice, eurPrice) {
    return this.currentCurrency === 'EUR' ? eurPrice : mkdPrice;
  }

  updateButton(buttonElement) {
    if (buttonElement) {
      buttonElement.innerHTML = this.currentCurrency === 'EUR' ? '💶 EUR' : '💵 MKD';
    }
  }

  updateAllPrices() {
    // Update all price elements with data attributes
    // This includes: .card-price, .product-meta, .product-old-price, and any element with data-mkd/data-eur
    document.querySelectorAll('[data-mkd][data-eur]').forEach((el) => {
      const mkd = el.dataset.mkd;
      const eur = el.dataset.eur;

      // Skip if values are empty or undefined
      if (mkd && eur && mkd !== 'undefined' && eur !== 'undefined') {
        el.textContent = this.currentCurrency === 'EUR' ? eur : mkd;
      }
    });
  }
}
