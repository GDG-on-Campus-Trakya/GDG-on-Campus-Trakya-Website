import { NextResponse } from 'next/server';

// Kötü niyetli bot listesi (User-Agent bazlı)
const BLOCKED_BOTS = [
  'semrush', 'ahrefs', 'dotbot', 'mj12bot', 'majestic', 'ahrefsbot',
  'serpstat', 'petalbot', 'yandex', 'baidu', 'sogou', 'exabot',
  'bytespider', 'dataforseo', 'blexbot', 'seekport', 'gigabot',
  'zoominfobot', 'zgrab', 'masscan', 'nmap', 'nikto', 'sqlmap',
  'python-requests', 'go-http-client', 'curl', 'wget'
];

// İzin verilen botlar (SEO için gerekli)
const ALLOWED_BOTS = [
  'googlebot', 'bingbot', 'slackbot', 'twitterbot', 'facebookexternalhit',
  'linkedinbot', 'whatsapp', 'telegrambot', 'discordbot'
];

export function middleware(request) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const pathname = request.nextUrl.pathname;

  // 1. Kötü niyetli botları engelle
  const isBlockedBot = BLOCKED_BOTS.some(bot => userAgent.includes(bot));
  const isAllowedBot = ALLOWED_BOTS.some(bot => userAgent.includes(bot));

  if (isBlockedBot && !isAllowedBot) {
    console.log(`🚫 Blocked bot: ${userAgent} from ${ip}`);
    return new NextResponse('Access Denied', { status: 403 });
  }

  // 2. Şüpheli istekleri engelle
  if (
    userAgent.includes('bot') && 
    !isAllowedBot && 
    !userAgent.includes('chrome') &&
    !userAgent.includes('safari') &&
    !userAgent.includes('firefox')
  ) {
    console.log(`⚠️ Suspicious bot blocked: ${userAgent}`);
    return new NextResponse('Access Denied', { status: 403 });
  }

  // 3. Şüpheli path'leri engelle
  const suspiciousPatterns = [
    '/wp-admin', '/wp-login', '/.env', '/.git', '/admin.php',
    '/xmlrpc.php', '/phpmyadmin', '/.well-known/security.txt',
    '/config.php', '/setup.php', '/.aws', '/backup'
  ];

  if (suspiciousPatterns.some(pattern => pathname.includes(pattern))) {
    console.log(`🔒 Suspicious path blocked: ${pathname} from ${ip}`);
    return new NextResponse('Not Found', { status: 404 });
  }

  const response = NextResponse.next();

  // Security headers ekle
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Robots-Tag', 'index, follow');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
