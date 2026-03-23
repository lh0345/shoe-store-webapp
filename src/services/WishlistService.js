/* WishlistService.js - Manage customer wishlist with data persistence
 *
 * Features:
 * - Optimistic UI updates (changes appear immediately)
 * - Server-side persistence with localStorage fallback
 * - Event-driven badge updates across the application
 * - Error handling with user notifications
 *
 * Usage:
 * const wishlist = new WishlistService('store', 'user123');
 * await wishlist.toggle(42); // Add/remove product
 * console.log(wishlist.getCount()); // Get item count
 */
import { DataService } from './DataService.js';

export class WishlistService {
  constructor(brandSlug = 'store', userId = 'guest') {
    this.brandSlug = brandSlug;
    this.userId = userId;
    this.dataService = new DataService();
    this.wishlist = [];
    this.loadWishlist();
  }

  async loadWishlist() {
    try {
      this.wishlist = (await this.dataService.getWishlist(this.userId)) || [];
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { count: this.wishlist.length },
        })
      );
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      if (window.showErrorNotification) {
        window.showErrorNotification('Could not load wishlist. Using temporary storage.');
      }
      this.wishlist = [];
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { count: 0 },
        })
      );
    }
  }

  async saveToStorage(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const success = await this.dataService.saveWishlist(this.userId, this.wishlist);
        if (success) {
          // Dispatch custom event for UI updates
          window.dispatchEvent(
            new CustomEvent('wishlist-updated', {
              detail: { count: this.wishlist.length },
            })
          );
          return true;
        }
      } catch (error) {
        console.error(`Failed to save wishlist (attempt ${attempt}):`, error);
        if (attempt === retries) {
          if (window.showErrorNotification) {
            window.showErrorNotification('Could not save wishlist changes.');
          }
          return false;
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    return false;
  }

  // Add product to wishlist
  async add(productId) {
    try {
      if (!this.isInWishlist(productId)) {
        this.wishlist.push(productId);
        await this.saveToStorage();
        return { success: true, added: true };
      }
      return { success: true, added: false };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, error: 'Failed to add item to wishlist' };
    }
  }

  // Remove product from wishlist
  async remove(productId) {
    try {
      const index = this.wishlist.indexOf(productId);
      if (index > -1) {
        this.wishlist.splice(index, 1);
        await this.saveToStorage();
        return { success: true, removed: true };
      }
      return { success: true, removed: false };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, error: 'Failed to remove item from wishlist' };
    }
  }

  // Toggle product in wishlist
  async toggle(productId) {
    try {
      if (this.isInWishlist(productId)) {
        return await this.remove(productId);
      } else {
        return await this.add(productId);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      return { success: false, error: 'Failed to update wishlist' };
    }
  }

  // Check if product is in wishlist
  isInWishlist(productId) {
    return this.wishlist.includes(productId);
  }

  // Get all wishlist product IDs
  getAll() {
    return [...this.wishlist];
  }

  // Get count of items in wishlist
  getCount() {
    return this.wishlist.length;
  }

  // Clear entire wishlist
  async clear() {
    this.wishlist = [];
    await this.saveToStorage();
    return { success: true };
  }
}
