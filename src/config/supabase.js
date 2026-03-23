/* supabase.js - REMOVED: Direct client access disabled for security */

/**
 * SUPABASE CLIENT DISABLED
 *
 * For security reasons, direct Supabase client access has been removed.
 * All database operations now go through the secure server-side API proxy.
 *
 * This prevents:
 * - API key exposure in client-side code
 * - Direct database access from browsers
 * - Potential abuse of database resources
 *
 * Use the secure API endpoints instead:
 * - GET /api/products - Get products
 * - POST /api/wishlist - Update wishlist
 * - POST /api/orders - Create orders
 *
 * Template default: no browser DB. Re-enabling a client is a deliberate fork — see docs/DEPLOY.md.
 */

// Export null to prevent accidental usage
export const supabase = null;
export function getSupabaseClient() {
  console.warn('Direct Supabase client access is disabled for security. Use secure API endpoints.');
  return null;
}
