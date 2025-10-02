// Cookie consent utility functions

export const CONSENT_KEY = 'cookieConsent';

/**
 * Get current cookie consent preferences
 */
export function getCookieConsent() {
  if (typeof window === 'undefined') return null;

  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent ? JSON.parse(consent) : null;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
}

/**
 * Check if a specific cookie type is consented
 */
export function hasConsent(type) {
  const consent = getCookieConsent();

  // If no consent given yet, assume no consent (except necessary)
  if (!consent) {
    return type === 'necessary';
  }

  return consent[type] === true;
}

/**
 * Check if analytics cookies are allowed
 */
export function canUseAnalytics() {
  return hasConsent('analytics');
}

/**
 * Check if functional cookies are allowed
 */
export function canUseFunctional() {
  return hasConsent('functional');
}

/**
 * Save cookie consent
 */
export function saveCookieConsent(preferences) {
  if (typeof window === 'undefined') return;

  try {
    const consent = {
      ...preferences,
      necessary: true, // Always true
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    // Trigger custom event for other parts of the app
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', {
      detail: consent
    }));

    return consent;
  } catch (error) {
    console.error('Error saving cookie consent:', error);
    return null;
  }
}

/**
 * Clear all non-necessary cookies and storage
 */
export function clearNonNecessaryCookies() {
  if (typeof window === 'undefined') return;

  const consent = getCookieConsent();

  // Clear session storage audit log if functional cookies not allowed
  if (!consent?.functional) {
    try {
      sessionStorage.removeItem('auditSessionId');
    } catch (error) {
      console.error('Error clearing session storage:', error);
    }
  }
}

/**
 * Initialize consent-based features
 */
export function initializeCookieConsent() {
  if (typeof window === 'undefined') return;

  // Listen for consent changes
  window.addEventListener('cookieConsentChanged', (event) => {
    const consent = event.detail;

    // Clear cookies that are no longer allowed
    if (!consent.functional) {
      clearNonNecessaryCookies();
    }

    // Reload analytics if consent changed
    if (consent.analytics) {
      console.log('Analytics enabled');
    } else {
      console.log('Analytics disabled');
    }
  });
}
