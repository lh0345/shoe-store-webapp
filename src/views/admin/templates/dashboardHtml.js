import { escapeHtml } from '../../../utils/helpers.js';

export function buildAdminDashboardHtml({ stats, config, username }) {
  return `      <div class="admin-header">
        <div>
          <h1 class="admin-title">Admin Dashboard</h1>
          <p class="admin-subtitle">Logged in as <strong>${escapeHtml(username)}</strong></p>
        </div>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="products">
          <span>📦</span> Products
        </button>
        <button class="admin-tab" data-tab="settings">
          <span>⚙️</span> Settings
        </button>
        <button class="admin-tab" data-tab="security">
          <span>🔒</span> Security
        </button>
      </div>

      <div class="admin-tab-content" data-content="products" style="display:block;">
        <div class="admin-actions">
          <button class="btn btn-primary" id="add-product-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3.5V12.5M3.5 8H12.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add Product
          </button>
          <button class="btn btn-secondary" id="export-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 1H3C2.44772 1 2 1.44772 2 2V14C2 14.5523 2.44772 15 3 15H13C13.5523 15 14 14.5523 14 14V5M10 1L14 5M10 1V5H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Export PDF
          </button>
        </div>

        <div class="admin-stats">
          <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Total Products</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.types}</div>
            <div class="stat-label">Product Types</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.colors}</div>
            <div class="stat-label">Available Colors</div>
          </div>
        </div>

        <div class="admin-search">
          <input type="text" id="admin-search" class="admin-search-input" placeholder="Search products...">
        </div>

        <div class="admin-table-container">
          <table class="admin-table" id="products-table">
            <thead>
              <tr>
                <th class="sortable" data-sort="id">
                  <span>ID</span>
                  <svg class="sort-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 8L6 10L8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M4 4L6 2L8 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </th>
                <th class="sortable" data-sort="name">
                  <span>Name</span>
                  <svg class="sort-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 8L6 10L8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M4 4L6 2L8 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </th>
                <th>Type</th>
                <th class="sortable" data-sort="price">
                  <span>Price</span>
                  <svg class="sort-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4 8L6 10L8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M4 4L6 2L8 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </th>
                <th>Sizes</th>
                <th>Colors</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="products-tbody"></tbody>
          </table>
          
          <div class="pagination-controls" id="pagination-controls" style="display: none;">
            <div class="pagination-info">
              <span id="pagination-info">Showing 1-5 of 10 products</span>
            </div>
            <div class="pagination-buttons">
              <button class="btn btn-sm btn-secondary" id="prev-page" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Previous
              </button>
              <div class="page-numbers" id="page-numbers"></div>
              <button class="btn btn-sm btn-secondary" id="next-page" disabled>
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="admin-tab-content" data-content="settings" style="display:none;">
        <form id="settings-form" class="settings-form">
          <div class="settings-section collapsed">
            <div class="settings-header">
              <h3>Brand Information</h3>
              <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="settings-content">
              <div class="settings-grid">
                <div class="form-group">
                  <label for="brand-name">Brand Name</label>
                  <input type="text" id="brand-name" value="${escapeHtml(config.brand.name)}" required>
                </div>
                <div class="form-group">
                  <label for="brand-slug">Brand Slug</label>
                  <input type="text" id="brand-slug" value="${escapeHtml(config.brand.slug || '')}" placeholder="kopackamk" required>
                  <small class="form-help-text">URL-friendly identifier (lowercase, numbers, hyphens only)</small>
                </div>
                <div class="form-group">
                  <label for="brand-tagline">Tagline</label>
                  <input type="text" id="brand-tagline" value="${escapeHtml(config.brand.tagline)}" required>
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label for="brand-description">Description</label>
                  <textarea id="brand-description" rows="2" required>${escapeHtml(config.brand.description)}</textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section collapsed">
            <div class="settings-header">
              <h3>Contact Information</h3>
              <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="settings-content">
              <div class="settings-grid">
                <div class="form-group">
                  <label for="contact-phone">Phone (WhatsApp)</label>
                  <input type="tel" id="contact-phone" value="${escapeHtml(config.contact.phone)}" required>
                </div>
                <div class="form-group">
                  <label for="contact-email">Email</label>
                  <input type="email" id="contact-email" value="${escapeHtml(config.contact.email)}" required>
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label for="contact-address">Address</label>
                  <input type="text" id="contact-address" value="${escapeHtml(config.contact.address)}" required>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section collapsed">
            <div class="settings-header">
              <h3>Brand Colors</h3>
              <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="settings-content">
              <div class="settings-grid">
                <div class="form-group">
                  <label for="color-accent">Accent Color</label>
                  <div class="color-input-group">
                    <input type="color" id="color-accent" value="${config.colors.accent}">
                    <input type="text" id="color-accent-text" value="${config.colors.accent}" pattern="^#[0-9A-Fa-f]{6}$">
                  </div>
                </div>
                <div class="form-group">
                  <label for="color-accent-light">Accent Light</label>
                  <div class="color-input-group">
                    <input type="color" id="color-accent-light" value="${config.colors.accentLight}">
                    <input type="text" id="color-accent-light-text" value="${config.colors.accentLight}" pattern="^#[0-9A-Fa-f]{6}$">
                  </div>
                </div>
                <div class="form-group">
                  <label for="color-accent-dark">Accent Dark</label>
                  <div class="color-input-group">
                    <input type="color" id="color-accent-dark" value="${config.colors.accentDark}">
                    <input type="text" id="color-accent-dark-text" value="${config.colors.accentDark}" pattern="^#[0-9A-Fa-f]{6}$">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section collapsed">
            <div class="settings-header">
              <h3>Business Settings</h3>
              <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="settings-content">
              <div class="settings-grid">
                <div class="form-group">
                  <label for="business-currency">Default Currency</label>
                  <select id="business-currency" required>
                    <option value="MKD" ${config.business.defaultCurrency === 'MKD' ? 'selected' : ''}>MKD</option>
                    <option value="EUR" ${config.business.defaultCurrency === 'EUR' ? 'selected' : ''}>EUR</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="business-exchange-rate">Exchange Rate (MKD to EUR)</label>
                  <input type="number" id="business-exchange-rate" value="${config.business.exchangeRate}" step="0.01" required>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section collapsed">
            <div class="settings-header">
              <h3>Store Policies</h3>
              <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="settings-content">
              <div class="settings-grid">
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label for="policy-shipping">Shipping Policy</label>
                  <input type="text" id="policy-shipping" value="${escapeHtml(config.policies.shipping)}" required>
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label for="policy-returns">Returns Policy</label>
                  <input type="text" id="policy-returns" value="${escapeHtml(config.policies.returns)}" required>
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label for="policy-warranty">Warranty Policy</label>
                  <input type="text" id="policy-warranty" value="${escapeHtml(config.policies.warranty)}" required>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section collapsed">
            <div class="settings-header">
              <h3>Social Media Links</h3>
              <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="settings-content">
              <div class="settings-grid">
                <div class="form-group">
                  <label for="social-whatsapp">WhatsApp Number <span class="optional-label">(optional)</span></label>
                  <input type="text" id="social-whatsapp" value="${escapeHtml(config.social?.whatsapp || '')}" placeholder="e.g., 38970123456">
                  <small>Enter phone number with country code (no + or spaces)</small>
                </div>
                <div class="form-group">
                  <label for="social-instagram">Instagram Username <span class="optional-label">(optional)</span></label>
                  <input type="text" id="social-instagram" value="${escapeHtml(config.social?.instagram || '')}" placeholder="e.g., yourshop">
                  <small>Username only (without @)</small>
                </div>
                <div class="form-group">
                  <label for="social-facebook">Facebook Page <span class="optional-label">(optional)</span></label>
                  <input type="text" id="social-facebook" value="${escapeHtml(config.social?.facebook || '')}" placeholder="e.g., yourshop">
                  <small>Page name or full URL</small>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section collapsed">
            <div class="settings-header">
              <h3>🎉 Holiday Banners</h3>
              <svg class="chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="settings-content">
              <p class="settings-description">Manage promotional holiday banners. Toggle to enable/disable, set dates for automatic display, or leave dates empty for always-on banners.</p>
              <div class="holiday-banner-controls">
                <button type="button" class="btn btn-sm btn-secondary" id="clear-dismissed-btn">
                  🔄 Reset Dismissed Banners
                </button>
                <button type="button" class="btn btn-sm btn-primary" id="test-current-banner-btn">
                  👁️ Test Current Active Banner
                </button>
              </div>
              <div id="holiday-banners-list"></div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">💾 Save Configuration</button>
          </div>
        </form>
      </div>

      <div class="admin-modal" id="product-modal" style="display:none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="modal-title">Add Product</h2>
            <button class="modal-close" id="modal-close">&times;</button>
          </div>
          <form id="product-form" class="product-form">
            <input type="hidden" id="product-id">
            
            <div class="form-group">
              <label for="product-name">Product Name *</label>
              <input type="text" id="product-name" required>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="product-price">Price (MKD) *</label>
                <input type="text" id="product-price" placeholder="150,000" required>
              </div>
              <div class="form-group">
                <label for="product-old-price">Old Price (MKD) <span class="optional-label">Optional</span></label>
                <input type="text" id="product-old-price" placeholder="180,000">
                <div class="discount-display" id="discount-display" style="display:none; margin-top: var(--spacing-xs); color: var(--accent); font-weight: 600; font-size: var(--text-sm);"></div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="product-type">Type *</label>
                <select id="product-type" required>
                  <option value="sneakers">Sneakers</option>
                  <option value="boots">Boots</option>
                  <option value="sandals">Sandals</option>
                  <option value="dress">Dress Shoes</option>
                  <option value="athletic">Athletic</option>
                  <option value="heels">Heels</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <div class="form-group"></div>
            </div>

            <div class="form-group">
              <label for="product-description">Description</label>
              <textarea id="product-description" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label for="product-tags">Tags (comma-separated)</label>
              <input type="text" id="product-tags" placeholder="Modern, Comfortable, Leather">
            </div>

            <div class="form-group">
              <label>Available Colors</label>
              <div id="colors-container" class="colors-container"></div>
              <button type="button" class="btn-secondary btn-sm" id="add-color-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Color
              </button>
            </div>

            <div class="form-group">
              <label>Available Sizes (EU)</label>
              <div id="sizes-container" class="sizes-container">
                <div class="size-checkbox"><input type="checkbox" id="size-35" name="size" value="35"> <label for="size-35">35</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-36" name="size" value="36"> <label for="size-36">36</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-37" name="size" value="37"> <label for="size-37">37</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-38" name="size" value="38"> <label for="size-38">38</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-39" name="size" value="39"> <label for="size-39">39</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-40" name="size" value="40"> <label for="size-40">40</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-41" name="size" value="41"> <label for="size-41">41</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-42" name="size" value="42"> <label for="size-42">42</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-43" name="size" value="43"> <label for="size-43">43</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-44" name="size" value="44"> <label for="size-44">44</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-45" name="size" value="45"> <label for="size-45">45</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-46" name="size" value="46"> <label for="size-46">46</label></div>
                <div class="size-checkbox"><input type="checkbox" id="size-47" name="size" value="47"> <label for="size-47">47</label></div>
              </div>
            </div>
            
            <div class="form-group">
              <label>Out of Stock Sizes</label>
              <p class="form-help-text">Mark sizes that are currently unavailable</p>
              <div id="unavailable-sizes-container" class="sizes-container">
                <div class="size-checkbox"><input type="checkbox" id="unavailable-35" name="unavailableSize" value="35"> <label for="unavailable-35">35</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-36" name="unavailableSize" value="36"> <label for="unavailable-36">36</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-37" name="unavailableSize" value="37"> <label for="unavailable-37">37</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-38" name="unavailableSize" value="38"> <label for="unavailable-38">38</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-39" name="unavailableSize" value="39"> <label for="unavailable-39">39</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-40" name="unavailableSize" value="40"> <label for="unavailable-40">40</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-41" name="unavailableSize" value="41"> <label for="unavailable-41">41</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-42" name="unavailableSize" value="42"> <label for="unavailable-42">42</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-43" name="unavailableSize" value="43"> <label for="unavailable-43">43</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-44" name="unavailableSize" value="44"> <label for="unavailable-44">44</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-45" name="unavailableSize" value="45"> <label for="unavailable-45">45</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-46" name="unavailableSize" value="46"> <label for="unavailable-46">46</label></div>
                <div class="size-checkbox"><input type="checkbox" id="unavailable-47" name="unavailableSize" value="47"> <label for="unavailable-47">47</label></div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Save Product</button>
              <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div class="admin-tab-content" data-content="security" style="display:none;">
        <div class="security-section">
          <h3>Change Password</h3>
          <p class="security-description">Update your admin password to keep your account secure.</p>

          <form id="password-form" class="password-form">
            <div class="form-group">
              <label for="current-password">Current Password</label>
              <input type="password" id="current-password" required autocomplete="current-password">
            </div>

            <div class="form-group">
              <label for="new-password">New Password</label>
              <input type="password" id="new-password" required autocomplete="new-password">
              <div class="password-strength" id="password-strength"></div>
            </div>

            <div class="form-group">
              <label for="confirm-password">Confirm New Password</label>
              <input type="password" id="confirm-password" required autocomplete="new-password">
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Change Password</button>
            </div>
          </form>
        </div>

        <div class="security-section">
          <h3>Security Monitoring</h3>
          <p class="security-description">Monitor login attempts and security events to protect your admin account.</p>

          <div class="security-stats" id="security-stats">
            <div class="stat-card">
              <div class="stat-value" id="total-attempts">0</div>
              <div class="stat-label">Total Failed Attempts</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="recent-attempts">0</div>
              <div class="stat-label">Recent Attempts (1h)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="active-lockouts">0</div>
              <div class="stat-label">Active Lockouts</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" id="total-lockouts">0</div>
              <div class="stat-label">Total Lockouts</div>
            </div>
          </div>

          <div class="security-actions">
            <button class="btn btn-secondary" id="refresh-security-stats">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 8C13.5 10.4853 11.4853 12.5 9 12.5C7.41337 12.5 6.06569 11.6839 5.23744 10.5M2.5 8C2.5 5.51472 4.51472 3.5 7 3.5C8.58663 3.5 9.93431 4.31607 10.7626 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11.5 5.5H10.7626C9.93431 4.31607 8.58663 3.5 7 3.5V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4.5 10.5H5.23744C6.06569 11.6839 7.41337 12.5 9 12.5V13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Refresh Stats
            </button>
            <button class="btn btn-danger" id="clear-security-data">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4H4C3.44772 4 3 4.44772 3 5V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V5C13 4.44772 12.5523 4 12 4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 7V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 7V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 4H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 2H7C6.44772 2 6 2.44772 6 3V4H10V3C10 2.44772 9.55228 2 9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Clear All Data
            </button>
          </div>

          <div class="security-info">
            <div class="info-item">
              <strong>Rate Limiting Active:</strong> Progressive delays (5s → 15s → 1min → 5min) followed by 15-minute account lockout after 5 failed attempts.
            </div>
            <div class="info-item">
              <strong>Auto-Cleanup:</strong> Failed attempts expire after 24 hours. Successful logins clear all attempts.
            </div>
          </div>
        </div>

        <div class="security-section">
          <h3>Client-Side Security Incidents</h3>
          <p class="security-description">Monitor client-side security events and potential attack attempts detected by the browser.</p>

          <div class="security-incidents-controls">
            <button class="btn btn-secondary" id="refresh-incidents">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 8C13.5 10.4853 11.4853 12.5 9 12.5C7.41337 12.5 6.06569 11.6839 5.23744 10.5M2.5 8C2.5 5.51472 4.51472 3.5 7 3.5C8.58663 3.5 9.93431 4.31607 10.7626 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11.5 5.5H10.7626C9.93431 4.31607 8.58663 3.5 7 3.5V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M4.5 10.5H5.23744C6.06569 11.6839 7.41337 12.5 9 12.5V13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Refresh Incidents
            </button>
            <button class="btn btn-danger" id="clear-incidents">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4H4C3.44772 4 3 4.44772 3 5V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V5C13 4.44772 12.5523 4 12 4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 7V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 7V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 4H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 2H7C6.44772 2 6 2.44772 6 3V4H10V3C10 2.44772 9.55228 2 9 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Clear Incidents
            </button>
          </div>

          <div class="security-incidents-list" id="security-incidents-list">
            <div class="no-incidents">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p>No security incidents detected</p>
            </div>
          </div>
        </div>
      </div>`;
}
