import { LoginView } from '../src/views/login/LoginView.js';

describe('LoginView', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML =
      '<nav><button id="nav-logout" style="display:none"></button></nav><div class="customer-only"></div><footer class="site-footer"></footer>';
    window.inputValidation = {
      validateField: jest.fn().mockReturnValue([]),
      validationRules: { user: { username: {} } },
      attachFieldValidation: jest.fn(),
    };
  });

  afterEach(() => {
    delete window.inputValidation;
  });

  test('render shows login form when not authenticated', () => {
    const view = new LoginView({
      authService: {
        isAuthenticated: () => false,
        getCurrentUser: () => null,
      },
    });
    const el = view.render();
    expect(el.classList.contains('login-container')).toBe(true);
    expect(el.querySelector('#login-form')).toBeTruthy();
    expect(el.querySelector('#username')).toBeTruthy();
    expect(el.querySelector('#password')).toBeTruthy();
  });

  test('render shows logged-in section when authenticated', () => {
    const view = new LoginView({
      authService: {
        isAuthenticated: () => true,
        getCurrentUser: () => ({ username: 'admin' }),
      },
    });
    const el = view.render();
    expect(el.querySelector('#logout-btn')).toBeTruthy();
    expect(el.textContent).toContain('Already logged in');
  });

  test('form submit calls login with credentials on success path', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const login = jest.fn().mockResolvedValue({ success: true });
    try {
      const view = new LoginView({
        authService: {
          isAuthenticated: () => false,
          getCurrentUser: () => null,
          login,
        },
      });
      const el = view.render();
      el.querySelector('#username').value = 'adminuser';
      el.querySelector('#password').value = 'secret12';
      el.querySelector('#login-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      );

      await login.mock.results[0].value;
      await Promise.resolve();

      expect(login).toHaveBeenCalledWith('adminuser', 'secret12');
    } finally {
      consoleError.mockRestore();
    }
  });

  test('form submit shows error when login fails', async () => {
    const login = jest.fn().mockResolvedValue({ success: false, error: 'Invalid credentials' });
    const view = new LoginView({
      authService: {
        isAuthenticated: () => false,
        getCurrentUser: () => null,
        login,
      },
    });
    const el = view.render();
    el.querySelector('#username').value = 'adminuser';
    el.querySelector('#password').value = 'secret12';
    el.querySelector('#login-form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );

    await login.mock.results[0].value;
    await Promise.resolve();

    const err = el.querySelector('#login-error');
    expect(err.style.display).toBe('block');
    expect(err.textContent).toContain('Invalid credentials');
  });
});
