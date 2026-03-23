import { AuthService } from '../src/services/AuthService.js';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('is not authenticated when no session is stored', () => {
    const auth = new AuthService('jestbrand');
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.getCurrentUser()).toBeNull();
  });
});
