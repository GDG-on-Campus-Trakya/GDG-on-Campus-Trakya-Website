// app/layout.js
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import "./globals.css";
import AuthProvider from "./AuthProvider";
import { Analytics } from "@vercel/analytics/next";
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
      <body
        className={`${inter.variable} font-sans flex flex-col min-h-screen custom-scrollbar overflow-x-hidden`}
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
