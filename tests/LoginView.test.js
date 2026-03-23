import { LoginView } from '../src/views/login/LoginView.js';

describe('LoginView', () => {
  beforeEach(() => {
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
});
