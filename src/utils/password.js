/* password.js - Secure password hashing utilities for browser */

/**
 * Hash a password using Web Crypto API
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - Base64 encoded hash
 */
export async function hashPassword(password) {
  try {
    // Convert password to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Use SHA-256 for hashing
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);

    // Convert to base64
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));

    return hashBase64;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 * @param {string} password - The password to verify
 * @param {string} hash - The stored hash to compare against
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, hash) {
  try {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Generate a secure random salt (for future enhancement)
 * @returns {string} - Random salt string
 */
export function generateSalt() {
  const array = new Uint8Array(16);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?/]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
