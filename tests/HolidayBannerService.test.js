import { DateTime } from 'luxon';
import {
  HolidayBannerService,
  HOLIDAY_BANNER_TIME_ZONE,
} from '../src/services/HolidayBannerService.js';

describe('HolidayBannerService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('uses Europe/Skopje for banner date logic', () => {
    expect(HOLIDAY_BANNER_TIME_ZONE).toBe('Europe/Skopje');
  });

  test('selects Christmas banner on a December date in Europe/Skopje', () => {
    jest.useFakeTimers();
    jest.setSystemTime(
      DateTime.fromObject(
        { year: 2025, month: 12, day: 15, hour: 12 },
        { zone: 'Europe/Skopje' }
      ).toJSDate()
    );

    const svc = new HolidayBannerService('testbrand');
    const banner = svc.getActiveBanner();

    expect(banner).not.toBeNull();
    expect(banner.id).toBe('christmas-2025');
  });

  test('returns null when no default banner range includes the current date in Skopje', () => {
    jest.useFakeTimers();
    jest.setSystemTime(
      DateTime.fromObject(
        { year: 2025, month: 7, day: 15, hour: 12 },
        { zone: 'Europe/Skopje' }
      ).toJSDate()
    );

    const svc = new HolidayBannerService('testbrand');
    expect(svc.getActiveBanner()).toBeNull();
  });

  test('skips banners with invalid YYYY-MM-DD or end before start', () => {
    jest.useFakeTimers();
    jest.setSystemTime(
      DateTime.fromObject(
        { year: 2025, month: 12, day: 15, hour: 12 },
        { zone: 'Europe/Skopje' }
      ).toJSDate()
    );

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
