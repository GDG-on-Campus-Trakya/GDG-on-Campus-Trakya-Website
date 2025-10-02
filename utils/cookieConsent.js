// Cookie consent utility functions

export const CONSENT_KEY = 'cookieConsent';

/**
 * Get current cookie consent preferences from Firestore
 * @param {string} userEmail - User's email address
 */
export async function getCookieConsent(userEmail = null) {
  if (typeof window === 'undefined') return null;

  // First check localStorage for immediate response (both logged in and out users)
  try {
    const localConsent = localStorage.getItem(CONSENT_KEY);
    if (localConsent) {
      return JSON.parse(localConsent);
    }
  } catch (error) {
    console.error('Error reading cookie consent from localStorage:', error);
  }

  // If user is logged in, also try to fetch from Firestore
  if (userEmail) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      const consentRef = doc(db, 'userConsents', userEmail);
      const consentSnap = await getDoc(consentRef);

      if (consentSnap.exists()) {
        const firestoreConsent = consentSnap.data();
        // Save to localStorage for faster future access
        localStorage.setItem(CONSENT_KEY, JSON.stringify(firestoreConsent));
        return firestoreConsent;
      }
    } catch (error) {
      console.error('Error reading cookie consent from Firestore:', error);
    }
  }

  return null;
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

    // Always save to localStorage for immediate access
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    // If user is logged in, also save to Firestore
    if (userEmail) {
      try {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../firebase');

        const consentRef = doc(db, 'userConsents', userEmail);
        await setDoc(consentRef, {
          ...consent,
          userEmail,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error saving cookie consent to Firestore:', error);
        // Continue anyway since we have localStorage
      }
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
