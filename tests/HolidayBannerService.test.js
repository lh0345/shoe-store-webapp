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

  test('skips banners with invalid YYYY-MM-DD or end before start', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 11, 15, 12, 0, 0));

    const svc = new HolidayBannerService('testbrand');
    const christmas = svc.getDefaultBanners().find((b) => b.id === 'christmas-2025');

    svc.banners = [
      { ...christmas, id: 'bad-ymd', startDate: '2025-02-31', endDate: '2025-12-31' },
      { ...christmas, id: 'bad-range', startDate: '2025-12-31', endDate: '2025-12-01' },
      christmas,
    ];

    expect(svc.getActiveBanner().id).toBe('christmas-2025');
  });

  test('getCountdown returns null for invalid end date', () => {
    const svc = new HolidayBannerService('testbrand');
    expect(svc.getCountdown('2025-02-31')).toBeNull();
  });
});
