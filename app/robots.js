// app/robots.js
export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com';

  return {
    rules: [
      // İyi botlar (SEO için gerekli)
      {
        userAgent: ['Googlebot', 'Googlebot-Image', 'Googlebot-News', 'Googlebot-Video'],
        allow: '/',
        disallow: ['/admin/', '/api/', '/profile/'],
        crawlDelay: 1,
      },
      {
        userAgent: ['Bingbot', 'Slurp', 'DuckDuckBot'],
        allow: '/',
        disallow: ['/admin/', '/api/', '/profile/'],
        crawlDelay: 2,
      },
      // Kötü/Agresif botları engelle
      {
        userAgent: [
          'AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot', 'SEMrushBot',
          'PetalBot', 'Yandex', 'Baiduspider', 'Sogou', 'Exabot',
          'BLEXBot', 'DataForSeoBot', 'ZoominfoBot', 'serpstatbot',
          'MegaIndex', 'linkdexbot', 'rogerbot', 'spbot',
        ],
        disallow: '/',
      },
      // Diğer tüm botlar için genel kural
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/profile/', '/login/', '/welcome/'],
        crawlDelay: 2,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
