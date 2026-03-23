/**
 * DataService reads in Jest skip the secure-API branch (process is defined),
 * so catalog loading is exercised via fetch('/data/products.json') + localStorage.
 */
import { DataService } from '../src/services/DataService.js';

describe('DataService', () => {
  const sampleProducts = [{ id: 1, name: 'Test Shoe', brand: 'X', price: 100 }];

  beforeEach(() => {
    global.fetch = jest.fn();
    localStorage.clear();
  });

  test('readJSON products loads from /data/products.json when fetch succeeds', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => sampleProducts,
    });

    const ds = new DataService();
    const data = await ds.readJSON('products');

    expect(global.fetch).toHaveBeenCalledWith('/data/products.json');
    expect(data).toEqual(sampleProducts);
  });

  test('readJSON products falls back to localStorage when fetch fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      global.fetch.mockRejectedValue(new Error('network'));

      localStorage.setItem('data_products', JSON.stringify(sampleProducts));

      const ds = new DataService();
      const data = await ds.readJSON('products');

      expect(data).toEqual(sampleProducts);
    } finally {
      warn.mockRestore();
    }
  });
});
