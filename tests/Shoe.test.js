import { Shoe } from '../src/models/Shoe.js';

describe('Shoe Model', () => {
  test('should create a valid shoe', () => {
    const shoeData = {
      id: 1,
      slug: 'test-shoe',
      name: 'Test Shoe',
      brand: 'TestBrand',
      price: '10000', // Just the number, will be formatted
      colors: ['#000000'],
      sizes: ['42'],
      description: 'A test shoe',
      type: 'sneakers',
    };

    const shoe = new Shoe(shoeData);

    expect(shoe.id).toBe(1);
    expect(shoe.name).toBe('Test Shoe');
    expect(shoe.priceMKD).toBe('10,000 ден'); // Formatted MKD string
    expect(shoe.priceEUR).toBe('€163'); // Formatted EUR string
  });

  test('should throw error for missing price', () => {
    const shoeData = {
      id: 1,
      slug: 'test-shoe',
      name: 'Test Shoe',
      price: '', // Empty price should throw
      colors: ['#000000'],
      sizes: ['42'],
    };

    expect(() => new Shoe(shoeData)).toThrow('Product price is required');
  });

  test('should throw error for invalid name', () => {
    const shoeData = {
      id: 1,
      slug: 'test-shoe',
      name: 'A', // Too short
      price: '10000 ден',
      colors: ['#000000'],
      sizes: ['42'],
    };

    expect(() => new Shoe(shoeData)).toThrow('Product name must be at least 3 characters');
  });

  test('should show discount only when price decreases', () => {
    // Test case 1: Price decrease should show discount
    const shoeDataDiscount = {
      id: 1,
      slug: 'discounted-shoe',
      name: 'Discounted Shoe',
      brand: 'TestBrand',
      price: '8000', // Current price: 8,000 ден
      oldPrice: '10000', // Old price: 10,000 ден (20% discount)
      colors: ['#000000'],
      sizes: ['42'],
      description: 'A discounted shoe',
      type: 'sneakers',
    };

    const discountedShoe = new Shoe(shoeDataDiscount);
    expect(discountedShoe.isOnSale()).toBe(true);
    expect(discountedShoe.getDiscountPercentage()).toBe(20);

    // Test case 2: Price increase should NOT show discount
    const shoeDataIncrease = {
      id: 2,
      slug: 'increased-shoe',
      name: 'Increased Shoe',
      brand: 'TestBrand',
      price: '12000', // Current price: 12,000 ден
      oldPrice: '10000', // Old price: 10,000 ден (price increased)
      colors: ['#000000'],
      sizes: ['42'],
      description: 'A price increased shoe',
      type: 'sneakers',
    };

    const increasedShoe = new Shoe(shoeDataIncrease);
    expect(increasedShoe.isOnSale()).toBe(false);
    expect(increasedShoe.getDiscountPercentage()).toBe(null);

    // Test case 3: Same price should NOT show discount
    const shoeDataSame = {
      id: 3,
      slug: 'same-price-shoe',
      name: 'Same Price Shoe',
      brand: 'TestBrand',
      price: '10000', // Current price: 10,000 ден
      oldPrice: '10000', // Old price: 10,000 ден (same price)
      colors: ['#000000'],
      sizes: ['42'],
      description: 'A same price shoe',
      type: 'sneakers',
    };

    const samePriceShoe = new Shoe(shoeDataSame);
    expect(samePriceShoe.isOnSale()).toBe(false);
    expect(samePriceShoe.getDiscountPercentage()).toBe(null);
  });
});
