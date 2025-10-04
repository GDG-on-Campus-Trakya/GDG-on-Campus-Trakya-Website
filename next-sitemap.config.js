/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/admin',
    '/admin/*',
    '/api/*',
    '/login',
    '/profile',
    '/tickets',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/login', '/profile', '/tickets'],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com'}/sitemap.xml`,
    ],
  },
  changefreq: 'daily',
  priority: 0.7,
  transform: async (config, path) => {
    // Özel priority ayarları
    const customPriority = {
      '/': 1.0,
      '/about': 0.9,
      '/events': 0.9,
      '/projects': 0.8,
      '/social': 0.8,
    };

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: customPriority[path] || config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
