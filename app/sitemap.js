// app/sitemap.js
import { getAllTests } from '@/lib/personality-test';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com';

  const staticRoutes = [
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
    '/personality-test',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : route === '/events' ? 'daily' : route === '/personality-test' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route === '/events' || route === '/about' ? 0.8 : route === '/personality-test' ? 0.9 : 0.5,
  }));

  // Fetch personality tests with slugs for dynamic routes
  let testRoutes = [];
  try {
    const tests = await getAllTests();
    testRoutes = tests.map((test) => ({
      url: `${baseUrl}/personality-test/${test.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching personality tests for sitemap:', error);
  }

  return [...staticRoutes, ...testRoutes];
}
