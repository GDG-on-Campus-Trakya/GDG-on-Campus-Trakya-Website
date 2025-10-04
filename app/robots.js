// app/robots.js
export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
