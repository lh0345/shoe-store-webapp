import { AdminView } from '../src/views/admin/AdminView.js';

function makeServices(overrides = {}) {
  return {
    productService: {
      getStatistics: () => ({ total: 3, types: 2, colors: 4 }),
      getAll: jest.fn().mockResolvedValue([]),
      getById: jest.fn().mockResolvedValue(null),
      ...overrides.productService,
    },
    authService: {
      getCurrentUser: () => ({ username: 'testadmin' }),
      ...overrides.authService,
    },
  };
}

describe('AdminView', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '<main id="main"></main><footer class="site-footer"></footer>';
    jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('render builds dashboard with stats, username, and product table shell', async () => {
    const view = new AdminView(makeServices());
    const el = await view.render();

    expect(el.classList.contains('admin-dashboard')).toBe(true);
    expect(el.querySelector('.admin-title').textContent).toContain('Admin Dashboard');
    expect(el.querySelector('.admin-subtitle').textContent).toContain('testadmin');

    const statValues = el.querySelectorAll('.stat-value');
    expect(statValues[0].textContent).toBe('3');
    expect(statValues[1].textContent).toBe('2');
    expect(statValues[2].textContent).toBe('4');

    expect(el.querySelector('#products-table')).toBeTruthy();
    expect(el.querySelector('#products-tbody')).toBeTruthy();
    expect(view.productService.getAll).toHaveBeenCalled();
  });

  test('render uses storeConfig from localStorage when present', async () => {
    localStorage.setItem(
      'storeConfig',
      JSON.stringify({
        brand: { name: 'CustomBrand', tagline: 'T', description: 'D' },
        contact: { phone: '1', email: 'a@b.c', address: 'X' },
        colors: { accent: '#111', accentLight: '#222', accentDark: '#333' },
        business: { defaultCurrency: 'MKD', exchangeRate: 60 },
        policies: { shipping: 's', returns: 'r', warranty: 'w' },
      })
    );

    const view = new AdminView(makeServices());
    const el = await view.render();

    expect(el.querySelector('#brand-name').value).toBe('CustomBrand');
    expect(el.querySelector('#contact-email').value).toBe('a@b.c');
  });

  test('settings tab click shows settings content and hides products', async () => {
    const view = new AdminView(makeServices());
    const el = await view.render();

    const productsPane = el.querySelector('.admin-tab-content[data-content="products"]');
    const settingsPane = el.querySelector('.admin-tab-content[data-content="settings"]');
    const settingsTab = el.querySelector('.admin-tab[data-tab="settings"]');

    expect(productsPane.style.display).toBe('block');
    expect(settingsPane.style.display).toBe('none');

    settingsTab.click();

    expect(settingsPane.style.display).toBe('block');
    expect(productsPane.style.display).toBe('none');
  });
});
