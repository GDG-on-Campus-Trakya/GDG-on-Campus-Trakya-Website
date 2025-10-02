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
  title: "GDG on Campus Trakya",
  description: "Google Developer Groups on Campus Trakya University",
};

export default async function RootLayout({ children }) {
  return (
    <html className="h-full">
      <head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" 
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
