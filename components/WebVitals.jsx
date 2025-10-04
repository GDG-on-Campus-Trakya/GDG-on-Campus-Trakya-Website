'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Web Vitals metriklerini logla (development) veya analytics'e gönder (production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', {
        name: metric.name,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        rating: metric.rating,
        delta: Math.round(metric.delta),
        id: metric.id,
      });
    }

    // Production'da Vercel Analytics otomatik olarak toplar
    // Eğer custom analytics kullanmak isterseniz:
    // if (process.env.NODE_ENV === 'production') {
    //   fetch('/api/analytics', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(metric),
    //   }).catch(console.error);
    // }
  });

  return null;
}
