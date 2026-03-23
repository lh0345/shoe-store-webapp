import { AuthService } from '../src/services/AuthService.js';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('is not authenticated when no session is stored', () => {
    const auth = new AuthService('jestbrand');
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getCurrentUser()).toBeNull();
  });

  test('login rejects short username', async () => {
    const auth = new AuthService('jestbrand');
    const r = await auth.login('ab', 'password123');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/at least 3/);
  });

  test('login rejects short password', async () => {
    const auth = new AuthService('jestbrand');
    const r = await auth.login('user', '12');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/at least 6/);
  });

  test('login rejects unknown user after default admin init', async () => {
    const auth = new AuthService('jestbrand');
    const r = await auth.login('unknownuser', 'password123');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/incorrect/i);
  });
});
