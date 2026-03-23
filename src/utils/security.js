/* security.js - Client-side security utilities */

/**
 * Security utilities for client-side protection
 */
export class SecurityUtils {
  constructor() {
    this.initSecurityMonitoring();
  }

  /**
   * Initialize security monitoring and protections
   */
  initSecurityMonitoring() {
    // Detect potential XSS attempts
    this.monitorDOMChanges();

    // Prevent common attacks
    this.preventCommonAttacks();

    // Monitor for suspicious activity
    this.monitorSuspiciousActivity();
  }

  /**
   * Monitor DOM changes for potential XSS injection attempts
   */
  monitorDOMChanges() {
    // Monitor for script tag insertions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for script tags
            if (node.tagName === 'SCRIPT') {
              console.warn('Security Alert: Script tag detected in DOM');
              this.reportSecurityIncident('script_injection', {
                tagName: node.tagName,
                src: node.src,
                innerHTML: node.innerHTML?.substring(0, 100),
              });
              // Remove the script
              node.remove();
            }

            // Check for iframe injections
            if (node.tagName === 'IFRAME') {
              console.warn('Security Alert: Iframe detected in DOM');
              this.reportSecurityIncident('iframe_injection', {
                src: node.src,
              });
            }

            // Check for suspicious attributes
            const suspiciousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover'];
            suspiciousAttrs.forEach((attr) => {
              if (node.hasAttribute(attr)) {
                console.warn(`Security Alert: Suspicious attribute '${attr}' detected`);
                this.reportSecurityIncident('suspicious_attribute', {
                  attribute: attr,
                  value: node.getAttribute(attr)?.substring(0, 50),
                });
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'href', 'data-*'],
    });
  }

  /**
   * Prevent common client-side attacks
   */
  preventCommonAttacks() {
    // Prevent form hijacking
    document.addEventListener('submit', (e) => {
      const form = e.target;
      const action = form.action;

      // Check for suspicious form actions
      if (action && !action.startsWith(window.location.origin)) {
        console.warn('Security Alert: Form submitted to external domain');
        this.reportSecurityIncident('form_hijacking', {
          action: action,
          formData: this.sanitizeFormData(new FormData(form)),
        });
        e.preventDefault();
        return false;
      }
    });

    // Prevent eval usage
    window.eval = function () {
      console.warn('Security Alert: eval() function called');
      this.reportSecurityIncident('eval_usage', {
        arguments: Array.from(arguments),
      });
      throw new Error('eval() is disabled for security reasons');
    }.bind(this);

    // Prevent dangerous function access
    const dangerousFunctions = ['Function', 'setTimeout', 'setInterval'];
    dangerousFunctions.forEach((func) => {
      const original = window[func];
      window[func] = function (code) {
        if (typeof code === 'string' && (code.includes('eval') || code.includes('Function'))) {
          console.warn(`Security Alert: Dangerous ${func} usage detected`);
          this.reportSecurityIncident('dangerous_function', {
            function: func,
            code: code.substring(0, 100),
          });
          throw new Error(`${func} with dynamic code is disabled for security reasons`);
        }
        // For setTimeout and setInterval, call on window object
        if (func === 'setTimeout' || func === 'setInterval') {
          return original.apply(window, arguments);
        }
        return original.apply(this, arguments);
      }.bind(this);
    });
  }

  /**
   * Monitor for suspicious user activity
   */
  monitorSuspiciousActivity() {
    let rapidClicks = 0;
    let lastClickTime = 0;

    document.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastClickTime < 100) {
        // Less than 100ms between clicks
        rapidClicks++;
        if (rapidClicks > 10) {
          console.warn('Security Alert: Rapid clicking detected');
          this.reportSecurityIncident('rapid_clicking', {
            clickCount: rapidClicks,
            timeWindow: now - lastClickTime,
          });
        }
      } else {
        rapidClicks = 0;
      }
      lastClickTime = now;
    });

    // Monitor localStorage access
    // Temporarily disabled to fix "Illegal invocation" error
    /*
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      // Check for suspicious keys
      if (key.includes('<script') || value.includes('<script')) {
        console.warn('Security Alert: Suspicious localStorage access');
        this.reportSecurityIncident('suspicious_storage', {
          key: key,
          valueLength: value.length
        });
      }
      return originalSetItem.apply(localStorage, arguments);
    }.bind(this);
    */
  }

  /**
   * Sanitize form data for logging
   */
  sanitizeFormData(formData) {
    const sanitized = {};
    for (const [key, value] of formData.entries()) {
      // Don't log sensitive data
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret')
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value.length > 50 ? value.substring(0, 50) + '...' : value;
      }
    }
    return sanitized;
  }

  /**
   * Report security incidents
   */
  reportSecurityIncident(type, details) {
    const incident = {
      type: type,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      details: details,
    };

    // Store in localStorage for admin review
    const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
    incidents.push(incident);

    // Keep only last 100 incidents
    if (incidents.length > 100) {
      incidents.shift();
    }

    localStorage.setItem('security_incidents', JSON.stringify(incidents));

    // In production, this should be sent to a security monitoring service
  }

  /**
   * Get security incidents for admin review
   */
  getSecurityIncidents() {
    return JSON.parse(localStorage.getItem('security_incidents') || '[]');
  }

  /**
   * Clear security incidents
   */
  clearSecurityIncidents() {
    localStorage.removeItem('security_incidents');
  }

  /**
   * Validate input against common attack patterns
   */
  validateInput(input, type = 'general') {
    if (typeof input !== 'string') return true;

    const patterns = {
      general: /<script|javascript:|on\w+\s*=|data:\s*text\/html/i,
      url: /javascript:|data:\s*text\/html|vbscript:/i,
      html: /<script|<iframe|<object|<embed/i,
    };

    const pattern = patterns[type] || patterns.general;
    return !pattern.test(input);
  }

  /**
   * Sanitize HTML content
   */
  sanitizeHtml(html) {
    // Create a temporary DOM element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove dangerous elements
    const dangerousElements = temp.querySelectorAll(
      'script, iframe, object, embed, form[action], a[href^="javascript:"]'
    );
    dangerousElements.forEach((el) => el.remove());

    // Remove dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((attr) => {
        if (
          attr.name.startsWith('on') ||
          (attr.name === 'href' && attr.value.startsWith('javascript:'))
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return temp.innerHTML;
  }
}

// Create global security instance
window.securityUtils = new SecurityUtils();
