/* ToastService.js - Modern toast notifications */

export class ToastService {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.body) {
      this.createContainer();
    } else {
      document.addEventListener('DOMContentLoaded', () => this.createContainer());
    }
  }

  createContainer() {
    // Create toast container
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 4000) {
    // Ensure container exists
    if (!this.container) {
      this.createContainer();
    }

    const id = Date.now() + Math.random();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-message">${this.escapeHtml(message)}</div>
        ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
      </div>
      <button class="toast-close" aria-label="Close notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;

    // Add to container
    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // Setup close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(id));

    // Auto dismiss
    if (duration > 0) {
      const progress = toast.querySelector('.toast-progress');
      if (progress) {
        progress.style.animationDuration = `${duration}ms`;
      }

      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  success(message, duration = 4000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 6000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 5000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 4000) {
    return this.show(message, 'info', duration);
  }

  remove(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(id);
    }, 300);
  }

  clear() {
    this.toasts.forEach((toast, id) => {
      this.remove(id);
    });
  }

  getIcon(type) {
    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`,
    };
    return icons[type] || icons.info;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global instance
window.toastService = new ToastService();
