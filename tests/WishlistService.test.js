import { WishlistService } from '../src/services/WishlistService.js';
import { DataService } from '../src/services/DataService.js';

// Mock fetch for Node.js environment
global.fetch = jest.fn();

describe('WishlistService', () => {
  let wishlistService;
  let mockDataService;

  beforeEach(() => {
    // Mock DataService
    mockDataService = {
      getWishlist: jest.fn(),
      saveWishlist: jest.fn().mockResolvedValue(true),
    };

    // Mock the DataService constructor
    jest.spyOn(DataService.prototype, 'constructor').mockImplementation(() => mockDataService);
    jest
      .spyOn(DataService.prototype, 'getWishlist')
      .mockImplementation(mockDataService.getWishlist);
    jest
      .spyOn(DataService.prototype, 'saveWishlist')
      .mockImplementation(mockDataService.saveWishlist);

    wishlistService = new WishlistService('store', 'user');
  });

  test('should initialize with empty wishlist', () => {
    expect(wishlistService.getAll()).toEqual([]);
    expect(wishlistService.getCount()).toBe(0);
  });

  test('should add item to wishlist', async () => {
    mockDataService.saveWishlist.mockResolvedValue(true);

    const result = await wishlistService.toggle(1);

    expect(result.success).toBe(true);
    expect(wishlistService.isInWishlist(1)).toBe(true);
    expect(wishlistService.getCount()).toBe(1);
    expect(mockDataService.saveWishlist).toHaveBeenCalledWith('user', [1]);
  });

  test('should remove item from wishlist', async () => {
    wishlistService.wishlist = [1, 2]; // Manually set for test
    mockDataService.saveWishlist.mockResolvedValue(true);

    const result = await wishlistService.toggle(1);

    expect(result.success).toBe(true);
    expect(wishlistService.isInWishlist(1)).toBe(false);
    expect(wishlistService.getCount()).toBe(1);
    expect(mockDataService.saveWishlist).toHaveBeenCalledWith('user', [2]);
  });

  test('should handle data service errors', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDataService.saveWishlist.mockRejectedValue(new Error('Save failed'));

    try {
      const result = await wishlistService.toggle(1);

      // Optimistic update: item is added even if save fails
      expect(result.success).toBe(true);
      expect(result.added).toBe(true);
      expect(wishlistService.isInWishlist(1)).toBe(true);
    } finally {
      consoleError.mockRestore();
    }
  });

  test('should load wishlist from storage', async () => {
    mockDataService.getWishlist.mockResolvedValue([1, 3, 5]);

    await wishlistService.loadWishlist();

    expect(wishlistService.getAll()).toEqual([1, 3, 5]);
    expect(wishlistService.getCount()).toBe(3);
  });

  test('clear should empty wishlist and persist', async () => {
    wishlistService.wishlist = [9, 8];
    mockDataService.saveWishlist.mockResolvedValue(true);

    const result = await wishlistService.clear();

    expect(result.success).toBe(true);
    expect(wishlistService.getCount()).toBe(0);
    expect(mockDataService.saveWishlist).toHaveBeenCalledWith('user', []);
  });
});
