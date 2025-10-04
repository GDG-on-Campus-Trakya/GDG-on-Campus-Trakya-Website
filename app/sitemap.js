// app/sitemap.js
export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com';

  const routes = [
    '',
    '/about',
    '/events',
    '/projects',
    '/faq',
    '/login',
    '/profile',
    '/tickets',
    '/social',
    '/privacy',
    '/terms',
    '/cookie-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : route === '/events' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route === '/events' || route === '/about' ? 0.8 : 0.5,
  }));

  return routes;
}
