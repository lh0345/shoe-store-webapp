/* ErrorBoundary.js - Error boundary utility for client-side error handling */

/**
 * Error boundary utility for handling and reporting client-side errors
 */
export class ErrorBoundary {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
    this.errorContainer = null;
    this.init();
  }

  init() {
    this.createErrorContainer();
  }

  createErrorContainer() {
    this.errorContainer = document.createElement('div');
    this.errorContainer.id = 'error-boundary';
    this.errorContainer.className = 'error-boundary';
    this.errorContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #dc2626;
      color: white;
      padding: 10px;
      text-align: center;
      z-index: 10000;
      display: none;
      font-family: Arial, sans-serif;
      cursor: pointer;
    `;
    this.errorContainer.addEventListener('click', () => this.hideError());
    document.body.appendChild(this.errorContainer);
  }

  /**
   * Capture and handle JavaScript errors
   */
  captureError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context: context,
    };

    this.errors.push(errorInfo);

    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    console.error('Error captured:', errorInfo);

    // Show user-friendly error in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.showError(`Error: ${error.message}`);
    } else {
      this.showError('An unexpected error occurred. Please refresh the page.');
    }

    // In production, this would send to error reporting service
    // this.reportError(errorInfo);
  }

  showError(message) {
    if (this.errorContainer) {
      this.errorContainer.textContent = message;
      this.errorContainer.style.display = 'block';

      // Auto-hide after 10 seconds
      setTimeout(() => {
        this.hideError();
      }, 10000);
    }
  }

  hideError() {
    if (this.errorContainer) {
      this.errorContainer.style.display = 'none';
    }
  }

  /**
   * Get all captured errors
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Clear all captured errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Report error to external service (placeholder)
   */
  reportError() {
    // Placeholder for error reporting service integration
    // Example: send to Sentry, LogRocket, etc.
  }
}

// Create global instance
window.errorBoundary = new ErrorBoundary();

// Global error handler
window.addEventListener('error', (event) => {
  window.errorBoundary.captureError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  window.errorBoundary.captureError(new Error(event.reason), {
    type: 'unhandledrejection',
  });
});
