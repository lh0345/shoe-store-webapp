/* inputValidation.js - Comprehensive input validation and sanitization */
import { escapeHtml } from './helpers.js';

/**
 * Comprehensive input validation and sanitization utilities
 */
export class InputValidation {
  constructor() {
    this.validationRules = {
      // Product validation rules
      product: {
        name: {
          required: true,
          minLength: 2,
          maxLength: 100,
          pattern: /^[a-zA-ZÀ-ÿ0-9\s'&.,()-]+$/,
          sanitize: true,
        },
        description: {
          required: true,
          minLength: 10,
          maxLength: 1000,
          sanitize: true,
        },
        brand: {
          required: false,
          minLength: 2,
          maxLength: 50,
          pattern: /^[a-zA-ZÀ-ÿ0-9\s'&.,()-]+$/,
          sanitize: true,
        },
        type: {
          required: true,
          allowedValues: [
            'sneakers',
            'boots',
            'sandals',
            'dress-shoes',
            'athletic',
            'casual',
            'formal',
          ],
        },
        priceMKD: {
          required: true,
          pattern: /^\d+(\.\d{1,2})?$/,
          min: 0,
          max: 1000000,
          sanitize: true,
        },
        priceEUR: {
          required: false,
          pattern: /^\d+(\.\d{1,2})?$/,
          min: 0,
          max: 1000000,
          sanitize: true,
        },
        tags: {
          required: false,
          maxLength: 500,
          pattern: /^[a-zA-ZÀ-ÿ0-9\s,#/'&.,()-]+$/,
          sanitize: true,
        },
        slug: {
          required: true,
          pattern: /^[a-z0-9-]+$/,
          minLength: 3,
          maxLength: 100,
        },
      },

      // User input validation rules
      user: {
        username: {
          required: true,
          minLength: 3,
          maxLength: 30,
          pattern: /^[a-zA-Z0-9_-]+$/,
          sanitize: true,
        },
        password: {
          required: true,
          minLength: 8,
          maxLength: 128,
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          sanitize: false, // Don't sanitize passwords
        },
        email: {
          required: false,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          maxLength: 254,
          sanitize: true,
        },
      },

      // Order validation rules
      order: {
        name: {
          required: true,
          minLength: 2,
          maxLength: 100,
          pattern: /^[a-zA-ZÀ-ÿ\s\-'.]+$/,
          sanitize: true,
        },
        phone: {
          required: true,
          pattern: /^[\d\s\-+()]+$/,
          minLength: 7,
          maxLength: 20,
          sanitize: true,
        },
        address: {
          required: true,
          minLength: 5,
          maxLength: 200,
          pattern: /^[a-zA-ZÀ-ÿ0-9\s.,#/-]+$/,
          sanitize: true,
        },
        city: {
          required: true,
          minLength: 2,
          maxLength: 100,
          pattern: /^[a-zA-ZÀ-ÿ\s\-'.]+$/,
          sanitize: true,
        },
        postal: {
          required: false,
          pattern: /^[0-9]{4,10}$/,
          sanitize: true,
        },
        notes: {
          required: false,
          maxLength: 500,
          sanitize: true,
        },
      },

      // Settings validation rules
      settings: {
        brandName: {
          required: true,
          minLength: 2,
          maxLength: 50,
          pattern: /^[a-zA-ZÀ-ÿ0-9\s'&.,()-]+$/,
          sanitize: true,
        },
        brandTagline: {
          required: true,
          minLength: 5,
          maxLength: 100,
          sanitize: true,
        },
        brandDescription: {
          required: true,
          minLength: 10,
          maxLength: 500,
          sanitize: true,
        },
        contactPhone: {
          required: true,
          pattern: /^[\d\s\-+()]+$/,
          minLength: 7,
          maxLength: 20,
          sanitize: true,
        },
        contactEmail: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          maxLength: 254,
          sanitize: true,
        },
        contactAddress: {
          required: true,
          minLength: 5,
          maxLength: 200,
          sanitize: true,
        },
        colorHex: {
          required: true,
          pattern: /^#[0-9A-Fa-f]{6}$/,
          sanitize: true,
        },
        exchangeRate: {
          required: true,
          pattern: /^\d+(\.\d{1,4})?$/,
          min: 50,
          max: 100,
          sanitize: true,
        },
      },
    };

    this.errorMessages = {
      required: 'This field is required',
      minLength: (min) => `Must be at least ${min} characters`,
      maxLength: (max) => `Must be no more than ${max} characters`,
      pattern: 'Invalid format',
      min: (min) => `Must be at least ${min}`,
      max: (max) => `Must be no more than ${max}`,
      allowedValues: (values) => `Must be one of: ${values.join(', ')}`,
    };
  }

  /**
   * Validate a single field
   */
  validateField(value, rules) {
    const errors = [];

    // Check required
    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push(this.errorMessages.required);
      return errors; // Don't continue validation if required field is empty
    }

    // Skip further validation if value is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return errors;
    }

    // Convert to string for validation
    const strValue = String(value);

    // Check minLength
    if (rules.minLength && strValue.length < rules.minLength) {
      errors.push(this.errorMessages.minLength(rules.minLength));
    }

    // Check maxLength
    if (rules.maxLength && strValue.length > rules.maxLength) {
      errors.push(this.errorMessages.maxLength(rules.maxLength));
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(strValue)) {
      errors.push(this.errorMessages.pattern);
    }

    // Check numeric min/max
    if (rules.min !== undefined && parseFloat(strValue) < rules.min) {
      errors.push(this.errorMessages.min(rules.min));
    }

    if (rules.max !== undefined && parseFloat(strValue) > rules.max) {
      errors.push(this.errorMessages.max(rules.max));
    }

    // Check allowed values
    if (rules.allowedValues && !rules.allowedValues.includes(strValue)) {
      errors.push(this.errorMessages.allowedValues(rules.allowedValues));
    }

    return errors;
  }

  /**
   * Validate an entire form
   */
  validateForm(formData, formType) {
    const rules = this.validationRules[formType];
    if (!rules) {
      throw new Error(`Unknown form type: ${formType}`);
    }

    const errors = {};
    let isValid = true;

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const value = formData[fieldName];
      const fieldErrors = this.validateField(value, fieldRules, fieldName);

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  /**
   * Sanitize input based on rules
   */
  sanitizeInput(value, rules) {
    if (!rules.sanitize || value === null || value === undefined) {
      return value;
    }

    let sanitized = String(value);

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove control characters (except newlines and tabs)
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // For specific field types, apply additional sanitization
    if (rules.fieldType === 'html') {
      // Allow only safe HTML tags
      sanitized = this.sanitizeHtml(sanitized);
    } else if (rules.fieldType === 'url') {
      // Basic URL sanitization
      sanitized = sanitized.replace(/[<>"']/g, '');
    } else {
      // Default: escape HTML and remove dangerous characters
      sanitized = escapeHtml(sanitized);
    }

    return sanitized;
  }

  /**
   * Sanitize HTML content (allow only safe tags)
   */
  sanitizeHtml(html) {
    // Create a temporary DOM element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove dangerous elements
    const dangerousElements = temp.querySelectorAll(
      'script, iframe, object, embed, form, input, button, meta, link[rel="stylesheet"]'
    );
    dangerousElements.forEach((el) => el.remove());

    // Remove dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        // Allow only safe attributes
        const safeAttrs = ['href', 'src', 'alt', 'title', 'class', 'id', 'data-*'];
        const isSafe = safeAttrs.some((safe) => {
          if (safe.endsWith('*')) {
            return attr.name.startsWith(safe.slice(0, -1));
          }
          return attr.name === safe;
        });

        if (!isSafe) {
          el.removeAttribute(attr.name);
        }

        // Sanitize URLs
        if ((attr.name === 'href' || attr.name === 'src') && attr.value) {
          if (
            !attr.value.startsWith('#') &&
            !attr.value.startsWith('/') &&
            !attr.value.startsWith('https://')
          ) {
            el.removeAttribute(attr.name);
          }
        }
      });
    });

    return temp.innerHTML;
  }

  /**
   * Validate and sanitize form data
   */
  validateAndSanitizeForm(formData, formType) {
    const validation = this.validateForm(formData, formType);

    if (!validation.isValid) {
      return validation;
    }

    // Sanitize the data
    const rules = this.validationRules[formType];
    const sanitizedData = {};

    for (const [fieldName, value] of Object.entries(formData)) {
      const fieldRules = rules[fieldName];
      if (fieldRules) {
        sanitizedData[fieldName] = this.sanitizeInput(value, fieldRules);
      } else {
        sanitizedData[fieldName] = value;
      }
    }

    return {
      isValid: true,
      errors: {},
      sanitizedData,
    };
  }

  /**
   * Real-time field validation
   */
  attachFieldValidation(element, rules, onValidation = null) {
    if (!element) return;

    const validate = () => {
      const value = element.value;
      const errors = this.validateField(value, rules, element.name);

      // Update UI
      this.updateFieldValidationUI(element, errors);

      // Call callback if provided
      if (onValidation) {
        onValidation(errors.length === 0, errors);
      }

      return errors.length === 0;
    };

    // Validate on input
    element.addEventListener('input', validate);

    // Validate on blur
    element.addEventListener('blur', validate);

    // Initial validation if field has value
    if (element.value) {
      validate();
    }

    return validate;
  }

  /**
   * Update field validation UI
   */
  updateFieldValidationUI(element, errors) {
    // Remove existing validation classes/messages
    element.classList.remove('field-valid', 'field-invalid');
    let errorElement = element.parentNode.querySelector('.field-error');

    if (errors.length > 0) {
      element.classList.add('field-invalid');

      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        element.parentNode.appendChild(errorElement);
      }

      errorElement.textContent = errors[0]; // Show first error
      errorElement.style.display = 'block';
    } else if (element.value) {
      element.classList.add('field-valid');

      if (errorElement) {
        errorElement.style.display = 'none';
      }
    } else if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  /**
   * Validate file upload
   */
  validateFile(file, rules = {}) {
    const errors = [];

    // Check file type
    if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${rules.allowedTypes.join(', ')}`);
    }

    // Check file size
    if (rules.maxSize && file.size > rules.maxSize) {
      const maxSizeMB = (rules.maxSize / (1024 * 1024)).toFixed(1);
      errors.push(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    // Check file name (prevent path traversal)
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Invalid file name');
    }

    return errors;
  }

  /**
   * Generate secure filename
   */
  generateSecureFilename(originalName) {
    const extension = originalName.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Check password strength
   */
  checkPasswordStrength(password) {
    if (!password) return { score: 0, feedback: [] };

    let score = 0;
    const feedback = [];

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');

    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[@$!%*?&]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeated characters');
    }

    if (/123|abc|qwe|password/i.test(password)) {
      score -= 1;
      feedback.push('Avoid common sequences');
    }

    return {
      score: Math.max(0, Math.min(5, score)),
      feedback,
      isStrong: score >= 4,
    };
  }
}

// Create global instance
window.inputValidation = new InputValidation();
