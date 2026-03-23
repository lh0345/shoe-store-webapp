/* CSRFProtection.js - CSRF protection utility */
export class CSRFProtection {
  constructor() {
    this.tokenKey = 'csrf_token';
    this.tokenLength = 32;
  }

  /**
   * Generate a cryptographically secure random token
   */
  generateToken() {
    const array = new Uint8Array(this.tokenLength);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get or create CSRF token
   */
  getToken() {
    let token = sessionStorage.getItem(this.tokenKey);
    if (!token) {
      token = this.generateToken();
      sessionStorage.setItem(this.tokenKey, token);
    }
    return token;
  }

  /**
   * Validate CSRF token
   */
  validateToken(token) {
    const storedToken = sessionStorage.getItem(this.tokenKey);
    return token && storedToken && token === storedToken;
  }

  /**
   * Clear CSRF token (logout)
   */
  clearToken() {
    sessionStorage.removeItem(this.tokenKey);
  }

  /**
   * Add CSRF token to form
   */
  addTokenToForm(form) {
    if (!form) return;

    // Remove existing CSRF token if present
    const existingToken = form.querySelector('input[name="_csrf"]');
    if (existingToken) {
      existingToken.remove();
    }

    // Add new CSRF token
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_csrf';
    tokenInput.value = this.getToken();
    form.appendChild(tokenInput);
  }

  /**
   * Protect all forms on the page
   */
  protectForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach((form) => {
      // Skip forms that already have CSRF protection
      if (form.querySelector('input[name="_csrf"]')) return;

      this.addTokenToForm(form);

      // Add submit event listener for validation
      form.addEventListener('submit', (e) => {
        const tokenInput = form.querySelector('input[name="_csrf"]');
        if (!tokenInput || !this.validateToken(tokenInput.value)) {
          e.preventDefault();
          console.error('CSRF token validation failed');
          alert('Security error: Invalid request. Please refresh the page and try again.');
          return false;
        }
      });
    });
  }

  /**
   * Add CSRF token to AJAX requests
   */
  addTokenToRequest(options = {}) {
    const token = this.getToken();
    if (options.headers) {
      options.headers['X-CSRF-Token'] = token;
    } else {
      options.headers = { 'X-CSRF-Token': token };
    }
    return options;
  }

  /**
   * Validate CSRF token from request headers
   */
  validateRequestToken(requestToken) {
    return this.validateToken(requestToken);
  }
}
