import { escapeHtml } from '../../utils/helpers.js';

function notify(message, type) {
  if (window.toastService) {
    window.toastService.show(message, type);
  } else if (type === 'error' && window.showErrorNotification) {
    window.showErrorNotification(message);
  } else {
    alert(message);
  }
}

export async function handlePasswordChange(admin, e) {
  e.preventDefault();

  // Validate CSRF token
  const form = document.getElementById('password-form');
  const csrfToken = form.querySelector('input[name="_csrf"]');
  if (!csrfToken || !window.csrfProtection.validateToken(csrfToken.value)) {
    notify('Security error: Invalid request. Please refresh the page.', 'error');
    return;
  }

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // Basic validation - no strict password requirements for admin
  if (!currentPassword || !newPassword || !confirmPassword) {
    notify('All fields are required', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    notify('New passwords do not match', 'error');
    return;
  }

  // No password strength validation for admin

  try {
    // Attempt to change password
    const result = await admin.authService.changePassword(currentPassword, newPassword);

    if (result.success) {
      notify('Password changed successfully', 'success');
      // Clear form
      document.getElementById('password-form').reset();
      document.getElementById('password-strength').innerHTML = '';
    } else {
      notify(result.error || 'Failed to change password', 'error');
    }
  } catch (error) {
    console.error('Password change error:', error);
    notify('Failed to change password. Please try again.', 'error');
  }
}

export function updatePasswordStrength(password) {
  const strengthEl = document.getElementById('password-strength');
  if (!password) {
    strengthEl.innerHTML = '';
    return;
  }

  // Always show strong password for admin
  strengthEl.innerHTML = '<span class="password-strength-strong">Strong password</span>';
}

/**
 * Update security statistics display
 */
export function updateSecurityStats(admin, container) {
  const stats = admin.rateLimiter.getStats();

  const totalAttemptsEl = container.querySelector('#total-attempts');
  const recentAttemptsEl = container.querySelector('#recent-attempts');
  const activeLockoutsEl = container.querySelector('#active-lockouts');
  const totalLockoutsEl = container.querySelector('#total-lockouts');

  if (totalAttemptsEl) totalAttemptsEl.textContent = stats.totalAttempts;
  if (recentAttemptsEl) recentAttemptsEl.textContent = stats.recentAttempts;
  if (activeLockoutsEl) activeLockoutsEl.textContent = stats.activeLockouts;
  if (totalLockoutsEl) totalLockoutsEl.textContent = stats.totalLockouts;
}

/**
 * Handle clearing all security data
 */
export function handleClearSecurityData(admin, e, container) {
  e.preventDefault();

  if (
    confirm(
      'Are you sure you want to clear all rate limiting data? This will reset all failed attempts and lockouts.'
    )
  ) {
    const success = admin.rateLimiter.clearAll();
    if (success) {
      alert('All rate limiting data has been cleared.');
      updateSecurityStats(admin, container);
    } else {
      alert('Failed to clear rate limiting data. Please try again.');
    }
  }
}

/**
 * Update security incidents display
 */
export function updateSecurityIncidents(admin, container) {
  const incidentsList = container.querySelector('#security-incidents-list');

  if (!incidentsList || !window.securityUtils) return;

  const incidents = window.securityUtils.getSecurityIncidents();

  if (incidents.length === 0) {
    incidentsList.innerHTML = `
        <div class="no-incidents">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>No security incidents detected</p>
        </div>
      `;
    return;
  }

  // Group incidents by type
  const groupedIncidents = incidents.reduce((groups, incident) => {
    if (!groups[incident.type]) {
      groups[incident.type] = [];
    }
    groups[incident.type].push(incident);
    return groups;
  }, {});

  const incidentsHTML = Object.entries(groupedIncidents)
    .map(([type, typeIncidents]) => {
      const latestIncident = typeIncidents[0]; // Most recent first
      const count = typeIncidents.length;

      return `
          <div class="incident-group">
            <div class="incident-header">
              <div class="incident-type">
                <span class="incident-icon">${getIncidentIcon(type)}</span>
                <span class="incident-title">${formatIncidentType(type)}</span>
              </div>
              <div class="incident-count">${count} incident${count > 1 ? 's' : ''}</div>
            </div>
            <div class="incident-details">
              <div class="incident-timestamp">${new Date(latestIncident.timestamp).toLocaleString()}</div>
              <div class="incident-url">${escapeHtml(latestIncident.url)}</div>
              ${latestIncident.details ? `<div class="incident-extra">${formatIncidentDetails(latestIncident.details)}</div>` : ''}
            </div>
          </div>
        `;
    })
    .join('');

  incidentsList.innerHTML = incidentsHTML;
}

/**
 * Handle clearing security incidents
 */
export function handleClearIncidents(admin, e, container) {
  e.preventDefault();

  if (
    confirm('Are you sure you want to clear all security incidents? This action cannot be undone.')
  ) {
    if (window.securityUtils) {
      window.securityUtils.clearSecurityIncidents();
      updateSecurityIncidents(admin, container);
      alert('All security incidents have been cleared.');
    }
  }
}

/**
 * Get icon for incident type
 */
export function getIncidentIcon(type) {
  const icons = {
    script_injection: '⚠️',
    iframe_injection: '🚫',
    suspicious_attribute: '🔍',
    form_hijacking: '📝',
    eval_usage: '🚨',
    dangerous_function: '⚡',
    rapid_clicking: '👆',
    suspicious_storage: '💾',
  };
  return icons[type] || '❓';
}

/**
 * Format incident type for display
 */
export function formatIncidentType(type) {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format incident details for display
 */
export function formatIncidentDetails(details) {
  if (typeof details === 'object') {
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${typeof value === 'string' ? escapeHtml(value) : value}`)
      .join(', ');
  }
  return escapeHtml(String(details));
}
