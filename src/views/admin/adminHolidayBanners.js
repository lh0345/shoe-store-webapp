import { escapeHtml } from '../../utils/helpers.js';

export function previewBanner(banner) {
  const bannerEl = document.getElementById('holiday-banner');
  const title = document.getElementById('holiday-banner-title');
  const message = document.getElementById('holiday-banner-message');
  const icon = document.querySelector('.holiday-banner-icon');
  const countdown = document.getElementById('holiday-banner-countdown');

  if (!bannerEl) return;

  // Set content
  title.textContent = banner.title;
  message.textContent = banner.message;
  icon.textContent = banner.icon;
  countdown.textContent = 'Preview Mode';

  // Set colors
  if (banner.backgroundColor.includes('gradient')) {
    bannerEl.style.background = banner.backgroundColor;
  } else {
    bannerEl.style.backgroundColor = banner.backgroundColor;
  }
  bannerEl.style.color = banner.textColor;

  // Show banner
  bannerEl.style.display = 'block';
  setTimeout(() => bannerEl.classList.add('active'), 100);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    bannerEl.classList.remove('active');
    setTimeout(() => (bannerEl.style.display = 'none'), 400);
  }, 5000);
}

export function renderHolidayBanners(container) {
  if (!window.holidayBannerService) return;

  const bannersList = container.querySelector('#holiday-banners-list');
  if (!bannersList) return;

  const banners = window.holidayBannerService.getBanners();

  bannersList.innerHTML = banners
    .map(
      (banner) => `
      <div class="holiday-banner-item collapsed">
        <div class="holiday-banner-item-header">
          <div class="holiday-banner-item-title">
            <span class="holiday-banner-item-icon">${banner.icon}</span>
            <span>${escapeHtml(banner.title)}</span>
          </div>
          <div class="holiday-banner-item-actions">
            <label class="toggle-switch">
              <input type="checkbox" data-holiday-id="${escapeHtml(String(banner.id))}" ${banner.enabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <svg class="chevron" width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <div class="holiday-banner-item-details">
          <div class="form-group">
            <label>Title</label>
            <input type="text" name="title" data-holiday-id="${banner.id}" value="${escapeHtml(banner.title)}" placeholder="Banner title">
          </div>
          <div class="form-group">
            <label>Message</label>
            <input type="text" name="message" data-holiday-id="${banner.id}" value="${escapeHtml(banner.message)}" placeholder="Promotional message">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Start Date <span class="optional-label">(Europe/Skopje; leave empty for always-on)</span></label>
              <input type="date" name="startDate" data-holiday-id="${banner.id}" value="${banner.startDate || ''}">
            </div>
            <div class="form-group">
              <label>End Date <span class="optional-label">(Europe/Skopje; leave empty for always-on)</span></label>
              <input type="date" name="endDate" data-holiday-id="${banner.id}" value="${banner.endDate || ''}">
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-secondary test-banner-btn" data-holiday-id="${banner.id}">
            👁️ Preview Banner
          </button>
        </div>
      </div>
    `
    )
    .join('');

  // Attach collapsible handlers
  bannersList.querySelectorAll('.holiday-banner-item-header').forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.closest('.holiday-banner-item');
      item.classList.toggle('collapsed');
    });
  });

  // Attach preview handlers
  bannersList.querySelectorAll('.test-banner-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bannerId = btn.dataset.holidayId;
      const banner = banners.find((b) => b.id === bannerId);
      if (banner) {
        previewBanner(banner);
      }
    });
  });

  // Attach toggle switch handlers to prevent event propagation
  bannersList.querySelectorAll('.toggle-switch').forEach((label) => {
    label.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}
