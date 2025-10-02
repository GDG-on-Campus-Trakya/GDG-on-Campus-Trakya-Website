// Cookie consent utility functions

export const CONSENT_KEY = 'cookieConsent';

/**
 * Get current cookie consent preferences from Firestore
 * @param {string} userEmail - User's email address
 */
export async function getCookieConsent(userEmail = null) {
  if (typeof window === 'undefined') return null;

  // If no user email provided, check localStorage as fallback (for non-logged in users)
  if (!userEmail) {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      return consent ? JSON.parse(consent) : null;
    } catch (error) {
      console.error('Error reading cookie consent from localStorage:', error);
      return null;
    }
  }

  // Fetch from Firestore for logged-in users
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../firebase');

    const consentRef = doc(db, 'userConsents', userEmail);
    const consentSnap = await getDoc(consentRef);

    if (consentSnap.exists()) {
      return consentSnap.data();
    }

    return null;
  } catch (error) {
    console.error('Error reading cookie consent from Firestore:', error);
    return null;
  }
}

/**
 * Check if a specific cookie type is consented
 * @param {string} type - Type of consent (necessary, analytics, functional)
 * @param {string} userEmail - User's email address
 */
export async function hasConsent(type, userEmail = null) {
  const consent = await getCookieConsent(userEmail);

  // If no consent given yet, assume no consent (except necessary)
  if (!consent) {
    return type === 'necessary';
  }

  return consent[type] === true;
}

/**
 * Check if analytics cookies are allowed
 * @param {string} userEmail - User's email address
 */
export async function canUseAnalytics(userEmail = null) {
  return await hasConsent('analytics', userEmail);
}

/**
 * Check if functional cookies are allowed
 * @param {string} userEmail - User's email address
 */
export async function canUseFunctional(userEmail = null) {
  return await hasConsent('functional', userEmail);
}

/**
 * Save cookie consent to Firestore
 * @param {Object} preferences - User's consent preferences
 * @param {string} userEmail - User's email address
 */
export async function saveCookieConsent(preferences, userEmail = null) {
  if (typeof window === 'undefined') return;

  try {
    const consent = {
      ...preferences,
      necessary: true, // Always true
      timestamp: new Date().toISOString()
    };

    // If user is logged in, save to Firestore
    if (userEmail) {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      const consentRef = doc(db, 'userConsents', userEmail);
      await setDoc(consentRef, {
        ...consent,
        userEmail,
        updatedAt: serverTimestamp()
      });
    } else {
      // For non-logged in users, use localStorage as fallback
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    }

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
 * @param {string} userEmail - User's email address
 */
export async function clearNonNecessaryCookies(userEmail = null) {
  if (typeof window === 'undefined') return;

  const consent = await getCookieConsent(userEmail);

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
