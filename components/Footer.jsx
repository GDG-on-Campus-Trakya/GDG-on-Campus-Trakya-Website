"use client";
// components/Footer.jsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-t from-gray-900 to-gray-800 text-gray-400">
      <div className="container mx-auto px-4 py-6 flex flex-col items-center sm:flex-row sm:justify-between">
        {/* Left Section: Links */}
        <div className="flex space-x-6 mb-4 sm:mb-0">
          <Link href="/about">
            <p className="hover:text-pink-500 transition-colors">Hakkımızda</p>
          </Link>
          <Link href="/events">
            <p className="hover:text-pink-500 transition-colors">Etkinlikler</p>
          </Link>
        </div>

        {/* Middle Section: Text */}
        <div className="text-sm text-center mb-4 sm:mb-0">
          © 2024 GDG On Campus Trakya. Her hakkı saklıdır.
        </div>

        {/* Right Section: Social Media Icons */}
        <div className="flex space-x-4">
          <button
            onClick={() =>
              window.open(
                "https://www.linkedin.com/company/gdscedirne/posts/?feedView=all",
                "_blank"
              )
            }
            className="w-6 h-6 sm:w-7 sm:h-7 cursor-pointer hover:scale-110 transition-transform"
            aria-label="LinkedIn"
          >
            <img
              src="/linkedin.png"
              alt="LinkedIn"
              className="w-full h-full object-contain"
            />
          </button>
          <button
            onClick={() =>
              window.open("https://www.instagram.com/gdgoncampustu/", "_blank")
            }
            className="w-6 h-6 sm:w-7 sm:h-7 cursor-pointer hover:scale-110 transition-transform"
            aria-label="Instagram"
          >
            <img
              src="/Instagram.png"
              alt="Instagram"
              className="w-full h-full object-contain"
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
