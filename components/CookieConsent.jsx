'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import Link from 'next/link';
import { saveCookieConsent, getCookieConsent, clearNonNecessaryCookies } from '@/utils/cookieConsent';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    saveCookieConsent({
      necessary: true,
      analytics: true,
      functional: true
    });
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    saveCookieConsent({
      necessary: true,
      analytics: false,
      functional: false
    });
    clearNonNecessaryCookies();
    setShowBanner(false);
  };

  const savePreferences = (preferences) => {
    saveCookieConsent(preferences);
    if (!preferences.functional) {
      clearNonNecessaryCookies();
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="w-full bg-gray-900 border-t border-gray-700 shadow-2xl pointer-events-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Left Content */}
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🍪</span>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    Çerez Kullanımı
                  </h3>
                  <p className="text-sm text-gray-300">
                    Web sitemiz, size en iyi deneyimi sunmak için çerezler ve yerel depolama kullanmaktadır.
                    {' '}
                    <Link href="/cookie-policy" className="text-blue-400 hover:underline">
                      Çerez Politikası
                    </Link>
                  </p>
                  {!showDetails && (
                    <button
                      onClick={() => setShowDetails(true)}
                      className="text-sm text-blue-400 hover:underline mt-2 inline-block"
                    >
                      Tercihlerini yönet →
                    </button>
                  )}
                </div>
              </div>

              {/* Details */}
              {showDetails && (
                <CookiePreferences
                  onSave={savePreferences}
                  onCancel={() => setShowDetails(false)}
                />
              )}
            </div>

            {/* Right Action Buttons */}
            {!showDetails && (
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                >
                  Tümünü Kabul Et
                </Button>
                <Button
                  onClick={acceptNecessary}
                  variant="outline"
                  className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-200 whitespace-nowrap"
                >
                  Sadece Gerekli Çerezler
                </Button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-gray-400 hover:text-gray-300 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CookiePreferences({ onSave, onCancel }) {
  const [preferences, setPreferences] = useState({
    analytics: true,
    functional: true
  });

  const handleSave = () => {
    onSave(preferences);
  };

  return (
    <div className="mt-4 space-y-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Necessary Cookies */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-white">
              Zorunlu Çerezler
            </h4>
            <input
              type="checkbox"
              checked={true}
              disabled
              className="w-4 h-4 rounded border-gray-600 bg-gray-700"
            />
          </div>
          <p className="text-xs text-gray-400">
            Kimlik doğrulama ve temel site işlevleri için gereklidir.
          </p>
        </div>

        {/* Analytics Cookies */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-white">
              Analitik Çerezler
            </h4>
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-blue-600"
            />
          </div>
          <p className="text-xs text-gray-400">
            Site performansını iyileştirmemize yardımcı olur.
          </p>
        </div>

        {/* Functional Cookies */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-white">
              Fonksiyonel Çerezler
            </h4>
            <input
              type="checkbox"
              checked={preferences.functional}
              onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 accent-blue-600"
            />
          </div>
          <p className="text-xs text-gray-400">
            Oturum takibi ve kullanıcı deneyimi için kullanılır.
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Tercihleri Kaydet
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1 bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-200"
        >
          İptal
        </Button>
      </div>
    </div>
  );
}
