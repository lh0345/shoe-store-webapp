import { HolidayBannerService } from '../src/services/HolidayBannerService.js';

describe('HolidayBannerService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('selects Christmas banner on a December date in local time', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 11, 15, 12, 0, 0));

    const svc = new HolidayBannerService('testbrand');
    const banner = svc.getActiveBanner();

    expect(banner).not.toBeNull();
    expect(banner.id).toBe('christmas-2025');
  });

  test('returns null when no default banner range includes the current date', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 6, 15, 12, 0, 0));

    const svc = new HolidayBannerService('testbrand');
    expect(svc.getActiveBanner()).toBeNull();
  });
});
