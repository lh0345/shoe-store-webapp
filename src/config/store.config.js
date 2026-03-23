/* store.config.js - Store-specific configuration
   
   QUICK SETUP GUIDE:
   1. Update brand information
   2. Change color scheme
   3. Set contact details
   4. Replace logo
   5. Deploy!
   
   Setup time: 5 minutes per store
*/

export const storeConfig = {
  // ===== BRAND INFORMATION =====
  brand: {
    name: 'KopackaMk', // Store name
    slug: 'kopackamk', // URL-friendly slug for SEO
    tagline: 'Step Into Style',
    description: 'Premium footwear that combines comfort and style',
    logo: '/logo.png', // Replace with client logo
    favicon: '👟', // Emoji or path to favicon
  },

  // ===== COLOR SCHEME =====
  // Change these to match brand colors
  colors: {
    // Primary brand color (buttons, links, accents)
    accent: '#2563EB', // Blue - Change to client brand color

    // Accent variations (auto-generated if not specified)
    accentLight: '#DBEAFE',
    accentDark: '#1E40AF',

    // Text colors
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',

    // Background colors
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F9FAFB',

    // Border and divider colors
    border: '#E5E7EB',
    divider: '#F3F4F6',
  },

  // ===== CONTACT INFORMATION =====
  contact: {
    phone: '+38970000000', // WhatsApp number for orders
    email: 'info@urbanstep.com',
    address: 'Skopje, North Macedonia',

    // Social media (leave empty to hide)
    social: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
  },

  // ===== BUSINESS SETTINGS =====
  business: {
    // Currency
    defaultCurrency: 'MKD', // MKD or EUR
    exchangeRate: 61.5, // MKD to EUR rate

    // Store type (changes product model)
    storeType: 'shoes', // shoes, furniture, clothing, general

    // Features to enable/disable
    features: {
      wishlist: true,
      currencyToggle: true,
      adminPanel: true,
      socialSharing: true,
      searchBar: true,
      filters: true,
    },
  },

  // ===== SEO & METADATA =====
  seo: {
    title: 'KopackaMk — Step Into Style | Premium Footwear',
    description:
      'Discover premium footwear that combines comfort and style. Shop our latest collection.',
    keywords: 'shoes, sneakers, boots, footwear, athletic shoes, casual shoes',
    siteUrl: 'https://yourstore.com', // Change to actual domain
    ogImage: 'https://placehold.co/1200x630/2563EB/FFFFFF?text=STRIDE',
  },

  // ===== STORE POLICIES =====
  policies: {
    shipping: 'Free shipping on orders over 3000 MKD',
    returns: '30-day return policy',
    warranty: '1-year warranty on all products',
  },

  // ===== SOCIAL MEDIA LINKS =====
  social: {
    whatsapp: '', // Phone number with country code (e.g., '38970123456')
    instagram: '', // Username only (e.g., 'yourshop')
    facebook: '', // Page name or full URL (e.g., 'yourshop')
  },

  // ===== ADMIN CREDENTIALS (CHANGE IMMEDIATELY) =====
  admin: {
    defaultUsername: 'admin',
    defaultPassword: 'admin123', // MUST CHANGE ON FIRST SETUP
  },
};

// ===== HELPER FUNCTIONS =====

// Get formatted phone for WhatsApp
export function getWhatsAppPhone() {
  return storeConfig.contact.phone.replace(/\D/g, '');
}

// Get brand display name
export function getBrandName() {
  return storeConfig.brand.name;
}

// Get brand slug
export function getBrandSlug() {
  return storeConfig.brand.slug;
}

// Check if feature is enabled
export function isFeatureEnabled(feature) {
  return storeConfig.business.features[feature] !== false;
}

// Get primary brand color
export function getPrimaryColor() {
  return storeConfig.colors.accent;
}

// Export as default for easy import
export default storeConfig;
