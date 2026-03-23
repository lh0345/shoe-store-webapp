/* AuthService.js - Supabase authentication with localStorage fallback */
import { User } from '../models/User.js';
import { sanitizeInput } from '../utils/helpers.js';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password.js';
import { RateLimiter } from '../utils/RateLimiter.js';
import { supabase } from '../config/supabase.js';
// import { createClient } from '@supabase/supabase-js'; // Using CDN version

// Use global Supabase client singleton

/**
 * SUPABASE INTEGRATION (Recommended for Production)
 *
 * 1. Install Supabase client:
 *    npm install @supabase/supabase-js
 *
 * 2. Initialize Supabase:
 *    import { createClient } from '@supabase/supabase-js'
 *    const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY')
 *
 * 3. Replace localStorage methods with Supabase Auth:
 *    - login() -> supabase.auth.signInWithPassword({ email, password })
 *    - logout() -> supabase.auth.signOut()
 *    - loadSession() -> supabase.auth.getSession()
 *    - Store user metadata in Supabase profiles table
 *
 * 4. Enable Row Level Security (RLS) in Supabase:
 *    - Create policies for authenticated users only
 *    - Add role-based access control in PostgreSQL
 *
 * 5. User Migration:
 *    - Existing localStorage users continue working with username/password
 *    - New users can authenticate with Supabase using email addresses
 *    - To migrate existing users to Supabase:
 *      1. Add email field to user object in localStorage
 *      2. Create corresponding Supabase auth user with same email
 *      3. User can then login with email instead of username
 *    - Admin user migration: Update admin@localhost to real email in localStorage
 *
 * 6. Hash passwords using bcrypt or Supabase's built-in auth
 */

/* eslint-env browser, node */

export class AuthService {
  /**
   * Template auth: session + users in localStorage only. Not a substitute for server-side
   * sessions, CSRF protection, or rate limits at the edge — see docs/DEPLOY.md.
   */
  constructor(brandSlug = 'store') {
    this.currentUser = null;
    this.storageKey = `${brandSlug}_admin_session`;
    this.usersKey = `${brandSlug}_admin_users`;
    this.sessionCache = new Map(); // Performance optimization
    this.sessionTimeout = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    this.sessionMonitorId = null; // Store interval ID for cleanup

    // Initialize Supabase with fallback (DISABLED for security)
    this.supabase = null;
    this.supabaseAvailable = false; // Disabled for security - no direct client access

    // Load session synchronously from localStorage first (for immediate availability)
    this.loadSessionSync();

    this.startSessionMonitoring();

    // Initialize rate limiter FIRST
    this.rateLimiter = new RateLimiter(brandSlug);

    // Initialize default admin asynchronously
    this.initializeDefaultAdmin();
  }

  async initSupabase() {
    try {
      // More robust environment variable detection
      const supabaseUrl = this.getEnvVar('SUPABASE_URL') || this.getEnvVar('VITE_SUPABASE_URL');
      const supabaseKey =
        this.getEnvVar('SUPABASE_ANON_KEY') || this.getEnvVar('VITE_SUPABASE_ANON_KEY');

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not found, using localStorage fallback for auth');
        // Load session from localStorage if Supabase not available
        this.loadSession();
        return;
      }

      // Use global Supabase client
      this.supabase = supabase;
      if (!this.supabase) {
        console.warn('Supabase client not available, using localStorage fallback for auth');
        // Load session from localStorage if Supabase not available
        this.loadSession();
        return;
      }

      // Test connection
      const { error } = await this.supabase.auth.getSession();
      if (error && error.message !== 'Auth session missing!') {
        throw error;
      }

      this.supabaseAvailable = true;
      console.log('✅ Supabase auth connected successfully');

      // Load session after Supabase is initialized
      await this.loadSession();
    } catch (error) {
      console.warn(
        '❌ Supabase auth connection failed, using localStorage fallback:',
        error.message
      );
      this.supabaseAvailable = false;
      this.supabase = null;
      // Fallback to localStorage session
      this.loadSession();
    }
  }

  getEnvVar(key) {
    // Try different environment sources
    /* eslint-disable no-undef */
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key];
    }
    /* eslint-enable no-undef */
    // Check global config loaded from server / static config.js
    if (typeof window !== 'undefined' && window.ENV_CONFIG?.[key]) {
      return window.ENV_CONFIG[key];
    }
    return undefined;
  }

  startSessionMonitoring() {
    // Clear any existing interval first
    if (this.sessionMonitorId) {
      clearInterval(this.sessionMonitorId);
    }

    // Set up Supabase auth state change listener
    if (this.supabase && this.supabaseAvailable) {
      this.supabase.auth.onAuthStateChange((event, session) => {
        console.log('Supabase auth state changed:', event, session?.user?.id);

        if (event === 'SIGNED_IN' && session?.user) {
          // User signed in via Supabase
          this.currentUser = new User({
            id: session.user.id,
            username: session.user.email || 'user',
            email: session.user.email,
            role: 'user',
            createdAt: session.user.created_at,
            lastLogin: new Date().toISOString(),
          });
          this.sessionCache.set(this.currentUser.id, this.currentUser);
        } else if (event === 'SIGNED_OUT') {
          // User signed out
          if (this.currentUser) {
            this.sessionCache.delete(this.currentUser.id);
          }
          this.currentUser = null;
          localStorage.removeItem(this.storageKey);

          // Redirect if on admin page
          if (window.location.pathname.includes('/admin')) {
            window.location.href = '/admin-login';
          }
        }
      });
    }

    // Check session validity every minute (for localStorage sessions)
    this.sessionMonitorId = setInterval(() => {
      if (this.isAuthenticated() && this.isSessionExpired()) {
        console.warn('Session expired, logging out');
        this.logout();
        if (window.location.pathname.includes('/admin')) {
          window.location.href = '/admin-login';
        }
      }
    }, 60000);
  }

  isSessionExpired() {
    try {
      const sessionData = localStorage.getItem(this.storageKey);
      if (!sessionData) return true;

      const { timestamp } = JSON.parse(sessionData);
      const now = Date.now();
      return now - timestamp > this.sessionTimeout;
    } catch {
      return true;
    }
  }

  async initializeDefaultAdmin() {
    try {
      const users = this.getUsers();

      if (users.length === 0) {
        // Hash the default password
        const hashedPassword = await hashPassword('admin123');

        // Create default admin account
        const defaultAdmin = new User({
          id: 'admin-1',
          username: 'admin',
          email: 'admin@localhost', // Default email for admin
          password: hashedPassword, // Store hashed password
          role: 'admin',
        });

        this.saveUser(defaultAdmin);
      }

      // Always clear any existing rate limiting data for admin user
      this.rateLimiter.clearAttempts('admin');
    } catch (error) {
      console.error('❌ Failed to initialize default admin:', error);
    }
  }
  getUsers() {
    try {
      const data = localStorage.getItem(this.usersKey);
      if (!data) return [];
      return JSON.parse(data).map((u) => new User(u));
    } catch (error) {
      console.error('Failed to load users:', error);
      if (window.showErrorNotification) {
        window.showErrorNotification('Could not load user data. Please refresh the page.');
      }
      return [];
    }
  }

  saveUser(user) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index > -1) {
      users[index] = user;
    } else {
      users.push(user);
    }

    try {
      localStorage.setItem(this.usersKey, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save user data:', error);

      // Check if it's a quota exceeded error
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        if (window.showErrorNotification) {
          window.showErrorNotification(
            'Storage full. Please clear browser data or contact support.'
          );
        }

        // Attempt to clear old session data to make room
        try {
          const oldKeys = Object.keys(localStorage).filter(
            (k) => k.includes('_session') && k !== this.storageKey
          );
          oldKeys.forEach((k) => localStorage.removeItem(k));

          // Retry save after cleanup
          localStorage.setItem(this.usersKey, JSON.stringify(users));
        } catch (retryError) {
          console.error('Failed to save after cleanup:', retryError);
          throw new Error('Storage quota exceeded. Unable to save user data.');
        }
      } else {
        throw error;
      }
    }
  }

  async login(username, password) {
    try {
      // Input validation and sanitization
      const cleanUsername = sanitizeInput(username, 50);
      const cleanPassword = sanitizeInput(password, 100);

      if (!cleanUsername || !cleanPassword) {
        return { success: false, error: 'Username and password are required' };
      }

      if (cleanUsername.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }

      if (cleanPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Ensure default admin exists BEFORE rate limiting check
      await this.initializeDefaultAdmin();

      // Check rate limiting
      const rateLimitCheck = this.rateLimiter.isRateLimited(cleanUsername);

      if (rateLimitCheck.limited) {
        return {
          success: false,
          error: rateLimitCheck.reason,
          rateLimited: true,
          waitTime: rateLimitCheck.waitTime,
        };
      }

      // Try Supabase authentication first (DISABLED for security)
      // Direct Supabase auth removed to prevent API key exposure
      console.log('Supabase authentication disabled for security - using localStorage fallback');

      // Fallback to localStorage authentication
      console.log('Using localStorage authentication fallback');
      const users = this.getUsers();
      const user = users.find((u) => u.username === cleanUsername);

      if (user) {
        // Verify password against stored hash
        let isValidPassword = await verifyPassword(cleanPassword, user.password);

        // For backward compatibility, also try direct comparison (in case password is stored as plain text)
        if (!isValidPassword && user.password === cleanPassword) {
          isValidPassword = true;
          // Update the password to be hashed
          const hashedPassword = await hashPassword(cleanPassword);
          user.password = hashedPassword;
          this.saveUser(user);
        }

        if (isValidPassword) {
          // Clear failed attempts on successful login
          this.rateLimiter.clearAttempts(cleanUsername);

          this.currentUser = user;
          this.sessionCache.set(user.id, user);

          try {
            localStorage.setItem(
              this.storageKey,
              JSON.stringify({
                ...user.toJSON(),
                timestamp: Date.now(),
              })
            );
          } catch (error) {
            console.error('Failed to save session:', error);
          }

          return { success: true, user: user.toJSON() };
        } else {
          // Password verification failed - don't log for security
        }
      } else {
        // User not found - don't log for security
      }

      // Record failed attempt
      this.rateLimiter.recordFailedAttempt(cleanUsername);

      return { success: false, error: 'Password or Username is incorrect' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred during login' };
    }
  }

  async logout() {
    try {
      // Supabase logout disabled for security (no direct client access)

      // Local logout (always performed)
      if (this.currentUser) {
        this.sessionCache.delete(this.currentUser.id);
      }
      this.currentUser = null;
      localStorage.removeItem(this.storageKey);

      // Clear CSRF token for security
      if (window.csrfProtection) {
        window.csrfProtection.clearToken();
      }

      this.destroy(); // Clean up resources
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      this.currentUser = null;
      localStorage.removeItem(this.storageKey);
      this.destroy();
    }
  }

  destroy() {
    // Clear session monitoring interval to prevent memory leaks
    if (this.sessionMonitorId) {
      clearInterval(this.sessionMonitorId);
      this.sessionMonitorId = null;
    }
    // Clear session cache
    this.sessionCache.clear();
  }

  loadSessionSync() {
    try {
      // Load session synchronously from localStorage
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const userData = JSON.parse(data);
        // Check if it's a recent session (within 7 days)
        const sessionAge = Date.now() - (userData.timestamp || 0);
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (sessionAge < maxAge) {
          this.currentUser = new User(userData);
          console.log('Restored localStorage session synchronously');
        } else {
          // Session expired, remove it
          localStorage.removeItem(this.storageKey);
          console.log('Session expired, cleared');
        }
      }
    } catch (error) {
      console.error('Failed to load session synchronously:', error);
      // Corrupted session data - clear it
      try {
        localStorage.removeItem(this.storageKey);
      } catch (e) {
        console.error('Failed to clear corrupted session:', e);
      }
    }
  }

  async loadSession() {
    try {
      // If we already have a session from sync load, prefer Supabase if available
      const hadLocalSession = !!this.currentUser;

      // Try to restore Supabase session first
      if (this.supabase && this.supabaseAvailable) {
        try {
          const {
            data: { session },
            error,
          } = await this.supabase.auth.getSession();
          if (!error && session?.user) {
            this.currentUser = new User({
              id: session.user.id,
              username: session.user.email || 'user',
              email: session.user.email,
              role: 'user', // Could be enhanced with user metadata
              createdAt: session.user.created_at,
              lastLogin: new Date().toISOString(),
            });
            console.log('Restored Supabase session');
            return;
          }
        } catch (supabaseError) {
          console.warn('Failed to restore Supabase session:', supabaseError.message);
        }
      }

      // If we didn't have a local session and Supabase failed, try localStorage
      if (!hadLocalSession) {
        this.loadSessionSync();
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      // Corrupted session data - clear it
      try {
        localStorage.removeItem(this.storageKey);
      } catch (e) {
        console.error('Failed to clear corrupted session:', e);
      }
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.isAuthenticated()) {
        return { success: false, error: 'Not authenticated' };
      }

      // Validate new password strength
      const strengthCheck = validatePasswordStrength(newPassword);
      if (!strengthCheck.isValid) {
        return { success: false, error: strengthCheck.errors.join('. ') };
      }

      // Try Supabase password update first
      if (this.supabase && this.supabaseAvailable) {
        try {
          const { error } = await this.supabase.auth.updateUser({
            password: newPassword,
          });

          if (!error) {
            console.log('Password updated in Supabase');
            return { success: true, message: 'Password changed successfully' };
          } else {
            console.warn('Supabase password update failed:', error.message);
            // Fall through to localStorage update
          }
        } catch (supabaseError) {
          console.warn(
            'Supabase password change error, falling back to localStorage:',
            supabaseError.message
          );
          this.supabaseAvailable = false;
          // Fall through to localStorage update
        }
      }

      // Fallback to localStorage password update
      console.log('Using localStorage password update fallback');

      // Verify current password
      const isCurrentValid = await verifyPassword(currentPassword, this.currentUser.password);
      if (!isCurrentValid) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update user password
      this.currentUser.password = hashedNewPassword;

      // Save updated user
      const users = this.getUsers();
      const userIndex = users.findIndex((u) => u.id === this.currentUser.id);
      if (userIndex > -1) {
        users[userIndex] = this.currentUser;
        try {
          localStorage.setItem(this.usersKey, JSON.stringify(users));
          return { success: true, message: 'Password changed successfully' };
        } catch (error) {
          console.error('Failed to save updated password:', error);
          return { success: false, error: 'Failed to save new password' };
        }
      }

      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  hasPermission(permission) {
    return this.currentUser?.hasPermission(permission) || false;
  }

  /**
   * Get rate limiting statistics
   * @returns {Object} - Rate limiting stats
   */
  getRateLimitStats() {
    return this.rateLimiter.getStats();
  }
}
