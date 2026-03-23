/* helpers.js - Utility functions */

export function svgDataUri({ color = '#2563EB' }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
    <rect width='100%' height='100%' fill='${color}' rx='12'/>
    <g opacity='0.15'>
      <circle cx='600' cy='400' r='200' fill='white'/>
      <rect x='350' y='300' width='500' height='200' rx='24' fill='white'/>
    </g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

export function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatPhone(raw) {
  const s = String(raw).replace(/\D/g, '');
  if (s.length === 12 && s.startsWith('389')) {
    return `+389 ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}`;
  }
  return raw;
}

// Convert hex color to readable name
export function getColorName(hexColor) {
  const colorMap = {
    '#000000': 'Black',
    '#FFFFFF': 'White',
    '#FF0000': 'Red',
    '#00FF00': 'Lime',
    '#0000FF': 'Blue',
    '#FFFF00': 'Yellow',
    '#00FFFF': 'Cyan',
    '#FF00FF': 'Magenta',
    '#C0C0C0': 'Silver',
    '#808080': 'Gray',
    '#800000': 'Maroon',
    '#808000': 'Olive',
    '#008000': 'Green',
    '#800080': 'Purple',
    '#008080': 'Teal',
    '#000080': 'Navy',
    '#FF6347': 'Tomato',
    '#FF4500': 'Orange Red',
    '#FFD700': 'Gold',
    '#ADFF2F': 'Green Yellow',
    '#00CED1': 'Dark Turquoise',
    '#9370DB': 'Medium Purple',
    '#FF1493': 'Deep Pink',
    '#1E90FF': 'Dodger Blue',
    '#32CD32': 'Lime Green',
    '#FF8C00': 'Dark Orange',
    '#8B4513': 'Saddle Brown',
    '#2F4F4F': 'Dark Slate Gray',
    '#F5DEB3': 'Wheat',
    '#36454F': 'Charcoal',
    '#2563EB': 'Blue',
    '#E6D6C1': 'Beige',
    '#5C4B3E': 'Brown',
    '#A6ACA1': 'Gray',
    '#D7C8B0': 'Tan',
    '#2E2A28': 'Dark Brown',
    '#F3EDE7': 'Off White',
    '#3D3C3A': 'Charcoal',
    '#8B6E53': 'Light Brown',
    '#DAD6D0': 'Light Gray',
    '#6B5E53': 'Taupe',
    '#F5F2EF': 'Cream',
    '#1F1F1F': 'Black',
    '#EDE2D0': 'Ivory',
    '#7D746D': 'Gray Brown',
    '#2C2B28': 'Black',
    '#F8F5F2': 'White',
    '#A5A49B': 'Gray',
    '#EDE6DB': 'Beige',
    '#3B3B3B': 'Dark Gray',
    '#AFA396': 'Taupe',
  };

  // Return mapped name or hex if not found
  return colorMap[hexColor.toUpperCase()] || hexColor;
}

// Input validation functions
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone) {
  // Allow international format, Macedonian format, or basic numbers
  const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
}

export function validatePassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function validateSlug(slug) {
  // Only lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

export function validateProductName(name) {
  // Allow letters, numbers, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z0-9\s\-']{2,100}$/;
  return nameRegex.test(name);
}

export function validatePrice(price) {
  // Allow decimal numbers with optional currency symbols
  const priceRegex = /^[\d\s,]+\.?\d*$/;
  return priceRegex.test(price);
}

export function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>"'&]/g, ''); // Remove potentially dangerous characters
}

export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
}

export function validateLength(value, min, max, fieldName) {
  if (value.length < min) {
    throw new Error(`${fieldName} must be at least ${min} characters`);
  }
  if (value.length > max) {
    throw new Error(`${fieldName} must be no more than ${max} characters`);
  }
  return value;
}
