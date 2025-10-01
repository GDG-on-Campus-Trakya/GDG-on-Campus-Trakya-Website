/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' vitals.vercel-insights.com *.googleapis.com *.firebaseapp.com *.firebasedatabase.app apis.google.com accounts.google.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' data: blob:",
              "img-src 'self' data: blob: *.googleapis.com *.googleusercontent.com firebasestorage.googleapis.com storage.googleapis.com",
              "connect-src 'self' *.googleapis.com *.firebaseapp.com *.firebasedatabase.app accounts.google.com vitals.vercel-insights.com wss: https:",
              "frame-src 'self' *.firebaseapp.com *.googleapis.com accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' *.firebaseapp.com *.googleapis.com",
              "frame-ancestors 'self' *.firebaseapp.com *.googleapis.com accounts.google.com",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Prevent MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // XSS Protection (legacy, for older browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Force HTTPS (only in production)
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
          // Control browser features
          {
            key: "Permissions-Policy",
            value: [
              "camera=(self)",
              "microphone=()",
              "geolocation=()",
              "interest-cohort=()",
              "payment=()",
              "usb=()",
              "bluetooth=()",
              "fullscreen=(self)",
            ].join(", "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
