"use client";
// components/Footer.jsx
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  const socialLinks = [
    {
      name: "LinkedIn",
      icon: "/linkedin.png",
      url: "https://www.linkedin.com/company/gdscedirne/posts/?feedView=all",
    },
    {
      name: "Instagram",
      icon: "/Instagram.png",
      url: "https://www.instagram.com/gdgoncampustu/",
    },
  ];

  return (
    <footer className="bg-gradient-to-t from-black to-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Section */}
          <div className="space-y-4">
            <img
              src="/landing-Photoroom.png"
              alt="GDG Logo"
              className="w-24 h-24"
            />
            <p className="text-sm max-w-xs">
              Teknoloji tutkunlarını bir araya getiren, geleceği şekillendiren topluluk.
            </p>
          </div>

          {/* Middle Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Hızlı Bağlantılar</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/about">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  Hakkımızda
                </motion.span>
              </Link>
              <Link href="/events">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer"
                >
                  Etkinlikler
                </motion.span>
              </Link>
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Bizi Takip Edin</h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.button
                  key={social.name}
                  whileHover={{ scale: 1.1, y: -2 }}
                  onClick={() => window.open(social.url, "_blank")}
                  className="w-10 h-10 rounded-full bg-gray-800 p-2 hover:bg-gray-700 transition-colors"
                >
                  <img
                    src={social.icon}
                    alt={social.name}
                    className="w-full h-full object-contain"
                  />
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t border-gray-800 mt-8 pt-8 text-center text-sm"
        >
          © 2025 GDG On Campus Trakya. Her hakkı saklıdır.
        </motion.div>
      </div>
    </footer>
  );
}
