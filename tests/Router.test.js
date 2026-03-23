import { Router } from '../src/router/Router.js';

/** jsdom updates pathname from history; do not redefine window.location. */
function go(path) {
  window.history.pushState({}, '', path);
}

describe('Router handleRoute', () => {
  beforeEach(() => {
    jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    document.body.innerHTML = '<main id="main"></main><div id="page-progress"></div>';
    go('/');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('calls home for / and /index.html', async () => {
    const home = jest.fn();
    const router = new Router({ home }, { autoInit: false });

    go('/');
    await router.handleRoute();
    expect(home).toHaveBeenCalledTimes(1);

    go('/index.html');
    await router.handleRoute();
    expect(home).toHaveBeenCalledTimes(2);
  });

  test('dispatches collection, wishlist, admin, admin-login', async () => {
    const routes = {
      collection: jest.fn(),
      wishlist: jest.fn(),
      admin: jest.fn(),
      adminLogin: jest.fn(),
    };
    const router = new Router(routes, { autoInit: false });

    go('/collection');
    await router.handleRoute();
    expect(routes.collection).toHaveBeenCalled();

    go('/wishlist');
    await router.handleRoute();
    expect(routes.wishlist).toHaveBeenCalled();

    go('/admin');
    await router.handleRoute();
    expect(routes.admin).toHaveBeenCalled();

    go('/admin-login');
    await router.handleRoute();
    expect(routes.adminLogin).toHaveBeenCalled();
  });

  test('/product with no slug calls notFound', async () => {
    const product = jest.fn();
    const notFound = jest.fn();
    const router = new Router({ product, notFound }, { autoInit: false });

    go('/product');
    await router.handleRoute();
    expect(notFound).toHaveBeenCalled();
    expect(product).not.toHaveBeenCalled();

    notFound.mockClear();
    go('/product/');
    await router.handleRoute();
    expect(notFound).toHaveBeenCalled();
    expect(product).not.toHaveBeenCalled();
  });

  test('/product/:slug calls product(slug)', async () => {
    const product = jest.fn();
    const router = new Router({ product }, { autoInit: false });

    go('/product/air-max');
    await router.handleRoute();
    expect(product).toHaveBeenCalledWith('air-max');
  });

  test('unknown path calls notFound', async () => {
    const notFound = jest.fn();
    const router = new Router({ notFound }, { autoInit: false });

    go('/nope');
    await router.handleRoute();
    expect(notFound).toHaveBeenCalled();
  });
});
