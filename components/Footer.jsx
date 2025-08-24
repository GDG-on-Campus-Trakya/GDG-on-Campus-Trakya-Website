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
    <footer className="bg-gradient-to-t from-black to-gray-900 text-gray-300 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Left Section */}
          <div className="space-y-4 text-center sm:text-left">
            <img
              src="/landing-Photoroom.png"
              alt="GDG Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto sm:mx-0"
            />
            <p className="text-xs sm:text-sm max-w-xs mx-auto sm:mx-0">
              Teknoloji tutkunlarını bir araya getiren, geleceği şekillendiren topluluk.
            </p>
          </div>

          {/* Middle Section - Split into two columns */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-white">Sayfalar</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/about">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer text-sm sm:text-base"
                >
                  Hakkımızda
                </motion.span>
              </Link>
              <Link href="/events">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer text-sm sm:text-base"
                >
                  Etkinlikler
                </motion.span>
              </Link>
              <Link href="/projects">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer text-sm sm:text-base"
                >
                  Projeler
                </motion.span>
              </Link>
              <Link href="/social">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer text-sm sm:text-base"
                >
                  Sosyal Medya
                </motion.span>
              </Link>
              <Link href="/faq">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer text-sm sm:text-base"
                >
                  S.S.S.
                </motion.span>
              </Link>
            </div>
          </div>

          {/* Legal Section */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-white">Yasal</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/privacy">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer text-sm sm:text-base"
                >
                  Gizlilik Politikası
                </motion.span>
              </Link>
              <Link href="/terms">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer text-sm sm:text-base"
                >
                  Kullanım Şartları
                </motion.span>
              </Link>
              <Link href="/tickets">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer text-sm sm:text-base"
                >
                  Destek & Şikayetler
                </motion.span>
              </Link>
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-semibold text-white">Bizi Takip Edin</h3>
            <div className="flex space-x-4 justify-center sm:justify-start">
              {socialLinks.map((social) => (
                <motion.button
                  key={social.name}
                  whileHover={{ scale: 1.1, y: -2 }}
                  onClick={() => window.open(social.url, "_blank")}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 p-1.5 sm:p-2 hover:bg-gray-700 transition-colors"
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
          className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm"
        >
          © 2025 GDG On Campus Trakya. Her hakkı saklıdır.
        </motion.div>
      </div>
    </footer>
  );
}
