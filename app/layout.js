// app/layout.js
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import CookieConsent from "@/components/CookieConsent";
import ConditionalAnalytics from "@/components/ConditionalAnalytics";
import "./globals.css";
import AuthProvider from "./AuthProvider";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com'),
  title: {
    default: "GDG on Campus Trakya Üniversitesi | Google Developer Groups",
    template: "%s | GDG on Campus Trakya"
  },
  description: "GDG on Campus Trakya Üniversitesi (gdgoncampustu) - Google Developer Groups on Campus TÜ. Trakya Üniversitesi'nde teknoloji, inovasyon ve yazılım geliştirme topluluğu. GDG, developer etkinlikleri, hackathonlar ve eğitim programları.",
  keywords: [
    "GDG",
    "gdgoncampustu",
    "GDG on Campus",
    "GDG on Campus Trakya",
    "GDG on Campus Trakya Üniversitesi",
    "Trakya Üniversitesi",
    "TÜ",
    "Google Developer Groups",
    "Google Developer",
    "Developer Groups Trakya",
    "Edirne developer",
    "Trakya University",
    "teknoloji topluluğu",
    "mühendis",
    "bilgisayar topluluğu",
    "bilgisayar mühendisi",
    "mühendislik topluluğu",
    "yazılım geliştirme",
    "hackathon",
    "developer etkinlikleri",
    "Google teknolojileri",
    "kampüs topluluğu"
  ],
  authors: [{ name: "GDG on Campus Trakya Üniversitesi" }],
  creator: "GDG on Campus Trakya Üniversitesi",
  publisher: "GDG on Campus Trakya Üniversitesi",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: '/',
    siteName: 'GDG on Campus Trakya Üniversitesi',
    title: 'GDG on Campus Trakya Üniversitesi | Google Developer Groups',
    description: 'GDG on Campus Trakya Üniversitesi (gdgoncampustu) - Google Developer Groups on Campus TÜ. Teknoloji ve inovasyon topluluğu.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GDG on Campus Trakya Üniversitesi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GDG on Campus Trakya Üniversitesi | Google Developer Groups',
    description: 'GDG on Campus Trakya Üniversitesi (gdgoncampustu) - Google Developer Groups on Campus TÜ.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: '/',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default async function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GDG on Campus Trakya Üniversitesi',
    alternateName: ['gdgoncampustu', 'GDG on Campus TÜ', 'Google Developer Groups Trakya'],
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com',
    logo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://gdgoncampustu.com'}/logo.png`,
    description: 'GDG on Campus Trakya Üniversitesi - Google Developer Groups on Campus. Teknoloji ve inovasyon topluluğu.',
    foundingLocation: {
      '@type': 'Place',
      name: 'Trakya Üniversitesi',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Edirne',
        addressCountry: 'TR'
      }
    },
    areaServed: 'Trakya Üniversitesi',
    sameAs: [
      'https://gdg.community.dev/gdg-on-campus-trakya-universitesi-edirne-turkey/',
    ],
    memberOf: {
      '@type': 'Organization',
      name: 'Google Developer Groups',
      url: 'https://developers.google.com/community/gdg'
    }
  };

  return (
    <html lang="tr" className="h-full">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans flex flex-col min-h-screen custom-scrollbar overflow-x-hidden`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <CookieConsent />
        </AuthProvider>
        <ConditionalAnalytics />
      </body>
    </html>
  );
}
