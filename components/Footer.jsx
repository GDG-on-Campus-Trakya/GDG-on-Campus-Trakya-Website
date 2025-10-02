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
    {
      name: "GitHub",
      icon: "github",
      url: "https://github.com/GDG-on-Campus-Trakya/GDG-on-Campus-Trakya-Website",
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
              <Link href="/cookie-policy">
                <motion.span
                  whileHover={{ x: 5, color: "#60A5FA" }}
                  className="hover:text-blue-400 transition cursor-pointer text-sm sm:text-base"
                >
                  Çerez Politikası
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
                  {social.icon === "github" ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-full h-full text-white"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  ) : (
                    <img
                      src={social.icon}
                      alt={social.name}
                      className="w-full h-full object-contain"
                    />
                  )}
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
