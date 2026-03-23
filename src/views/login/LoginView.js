/* LoginView.js - Admin login view */
import { escapeHtml } from '../../utils/helpers.js';

export class LoginView {
  constructor(services) {
    this.services = services;
    this.authService = services.authService;
  }

  render() {
    // Show customer nav items and hide admin logout
    document.querySelectorAll('.customer-only').forEach((el) => (el.style.display = ''));
    const navLogout = document.getElementById('nav-logout');
    if (navLogout) navLogout.style.display = 'none';

    // Show footer on login page
    const footer = document.querySelector('.site-footer');
    if (footer) footer.style.display = '';

    const container = document.createElement('div');
    container.className = 'login-container';

    container.innerHTML = `
      <div class="login-card">
        <div class="login-header">
          <span class="logo-icon">◆</span>
          <h1><span class="brand-name"></span> Admin</h1>
          <p>Sign in</p>
        </div>
        
        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" placeholder="Enter username" required autofocus>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter password" required>
          </div>
          
          <div id="login-error" class="login-error" style="display:none;"></div>
          
          <button type="submit" class="btn btn-primary btn-block">Sign In</button>
        </form>
        
        ${
          this.authService.isAuthenticated()
            ? `
          <div class="logout-section">
            <p>Already logged in as ${escapeHtml(this.authService.getCurrentUser()?.username || 'admin')}</p>
            <button id="logout-btn" class="btn btn-secondary">Logout & Login as Different User</button>
            <button id="clear-data-btn" class="btn btn-danger" style="margin-top: 10px;">Clear All Data & Reset</button>
          </div>
        `
            : ''
        }
        
      </div>
    `;

    this.attachEventListeners(container);

    // Ensure CSRF token is added to the login form
    if (window.csrfProtection) {
      const form = container.querySelector('#login-form');
      if (form) {
        window.csrfProtection.addTokenToForm(form);
      }
    }

    return container;
  }

  attachEventListeners(container) {
    const form = container.querySelector('#login-form');
    const errorDiv = container.querySelector('#login-error');
    const logoutBtn = container.querySelector('#logout-btn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.authService.logout();
        // Reload the page to show the login form
        window.location.reload();
      });
    }

    const clearDataBtn = container.querySelector('#clear-data-btn');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        if (confirm('This will clear all user data and reset the application. Are you sure?')) {
          // Clear all localStorage data
          localStorage.clear();
          alert('All data cleared. The page will reload.');
          window.location.reload();
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Temporarily disable CSRF validation for debugging
      // const csrfToken = form.querySelector('input[name="_csrf"]');
      // if (!csrfToken || !window.csrfProtection.validateToken(csrfToken.value)) {
      //   const errorDiv = container.querySelector('#login-error');
      //   errorDiv.textContent = 'Security error: Invalid request. Please refresh the page.';
      //   errorDiv.style.color = '#dc2626';
      //   errorDiv.style.display = 'block';
      //   return;
      // }

      const username = container.querySelector('#username').value;
      const password = container.querySelector('#password').value;

      // Basic validation using InputValidation
      const usernameValidation = window.inputValidation.validateField(
        username,
        window.inputValidation.validationRules.user.username
      );

      // For login, only check that password is not empty (don't validate format for existing passwords)
      const passwordValidation = [];
      if (!password || password.trim().length === 0) {
        passwordValidation.push('Password is required');
      }

      if (usernameValidation.length > 0 || passwordValidation.length > 0) {
        const errorDiv = container.querySelector('#login-error');
        const errors = [...usernameValidation, ...passwordValidation];
        errorDiv.textContent = errors.join(', ');
        errorDiv.style.color = '#dc2626';
        errorDiv.style.display = 'block';
        return;
      }

      const result = await this.authService.login(username, password);

      if (result.success) {
        window.location.href = '/admin';
      } else {
        // Handle rate limiting
        if (result.rateLimited && result.waitTime) {
          const minutes = Math.floor(result.waitTime / 60);
          const seconds = result.waitTime % 60;
          const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          errorDiv.textContent = `${result.error} (${timeString} remaining)`;
          errorDiv.style.color = '#d97706'; // Orange for rate limiting
          errorDiv.classList.add('rate-limited');
        } else {
          errorDiv.textContent = result.error;
          errorDiv.style.color = '#dc2626'; // Red for other errors
          errorDiv.classList.remove('rate-limited');
        }
        errorDiv.style.display = 'block';
      }
    });

    // Attach real-time validation to login form inputs
    if (window.inputValidation) {
      const usernameInput = container.querySelector('#username');
      const passwordInput = container.querySelector('#password');

      if (usernameInput) {
        window.inputValidation.attachFieldValidation(
          usernameInput,
          window.inputValidation.validationRules.user.username
        );
      }
      if (passwordInput) {
        // For login, only validate that password is not empty (don't enforce format for existing passwords)
        passwordInput.addEventListener('input', () => {
          const value = passwordInput.value;
          // Clear previous errors
          passwordInput.classList.remove('error');
          const existingError = passwordInput.parentNode.querySelector('.form-error');
          if (existingError) existingError.remove();

          if (!value || value.trim().length === 0) {
            passwordInput.classList.add('error');
            const errorEl = document.createElement('div');
            errorEl.className = 'form-error';
            errorEl.textContent = 'Password is required';
            passwordInput.parentNode.appendChild(errorEl);
          }
        });
      }
    }
  }
}
