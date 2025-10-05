"use client";
// page.js
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white relative">
      <header className="flex flex-col lg:flex-row items-center justify-center p-2 sm:p-4 lg:p-8 w-full min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] relative pt-4 sm:pt-6">
        {/* Content Wrapper */}
        <div className="flex flex-col lg:flex-row items-center max-w-7xl w-full mx-auto gap-3 xs:gap-4 sm:gap-6 lg:gap-12 px-2 xs:px-3 sm:px-4 pb-24 sm:pb-32 md:pb-20">
          
          {/* Mobile Image Section - Visible only on small screens, positioned above text */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="lg:hidden flex justify-center w-full mb-1 xs:mb-2 sm:mb-4"
          >
            <div className="relative w-24 xs:w-28 sm:w-32 md:w-40">
              <div className="rounded-full p-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500">
                <div className="rounded-full p-2 bg-black">
                  <Image
                    className="w-full h-auto rounded-full shadow-lg"
                    src="/landing-Photoroom.png"
                    aria-label="GDG on Campus Trakya"
                    alt="GDG on Campus Trakya"
                    width={160}
                    height={160}
                    priority
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </div>
              
              {/* Enhanced Floating Elements - Adjusted for small screens */}
              <motion.div
                animate={{
                  y: [0, 10, 0],
                  rotate: [0, 180, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-sm opacity-60"
              />
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [360, 180, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute bottom-1 -left-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-sm opacity-60"
              />
            </div>
          </motion.div>

          {/* Left Section */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-3xl space-y-3 xs:space-y-4 sm:space-y-5 lg:space-y-8 text-center lg:text-left lg:mr-12 px-2 xs:px-3 sm:px-4"
          >
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold text-transparent bg-clip-text animate-gradient-text pb-1 xs:pb-2"
            >
              GDG on Campus Trakya Üniversitesi
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 px-0 xs:px-1 leading-tight xs:leading-normal"
            >
              GDG On Campus Trakya Üniversitesi - Teknoloji ve inovasyonun buluşma noktası. Geleceği birlikte şekillendiriyoruz!
            </motion.p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="w-full max-w-[280px] mx-auto space-y-3 sm:max-w-none sm:flex sm:flex-row sm:gap-4 sm:justify-center lg:justify-start sm:space-y-0 iphone-se-buttons"
            >
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/events'}
                className="block w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg text-white font-medium text-sm sm:text-base lg:text-lg transition duration-300 text-center"
              >
                Etkinlikleri Keşfet
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/about'}
                className="block w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 bg-transparent border-2 border-blue-600 hover:bg-blue-600/10 rounded-lg shadow-lg text-white font-medium text-sm sm:text-base lg:text-lg transition duration-300 text-center"
              >
                Bizi Tanı
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Section - Hidden on small screens, visible on large screens */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="hidden lg:flex justify-center w-full lg:w-2/3"
          >
            <div className="relative w-80 xl:w-full max-w-2xl">
              <div className="rounded-full p-1 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500">
                <div className="rounded-full p-4 bg-black">
                  <Image
                    className="w-full h-auto rounded-full shadow-lg"
                    src="/landing-Photoroom.png"
                    aria-label="GDG on Campus Trakya"
                    alt="GDG on Campus Trakya"
                    width={600}
                    height={600}
                    priority
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </div>
              
              {/* Enhanced Floating Elements - Adjusted for large screens */}
              <motion.div
                animate={{
                  y: [0, 20, 0],
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-60"
              />
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [360, 180, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute bottom-6 -left-6 w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-2xl opacity-60"
              />
            </div>
          </motion.div>
        </div>

        {/* Stats Section - Moved inside header and positioned at bottom */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-4 sm:bottom-8 left-0 right-0 w-full bg-gray-900/50 py-4 sm:py-6 lg:py-8 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-2 sm:px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 lg:gap-8 text-center">
              {[
                { value: "1000+", label: "Topluluk Üyesi", color: "text-blue-500" },
                { value: "20+", label: "Başarılı Etkinlik", color: "text-green-500" },
                { value: "10+", label: "Teknoloji Partneri", color: "text-purple-500" },
                { value: "50+", label: "Saat Eğitim", color: "text-yellow-500" }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.5 + (index * 0.1), duration: 0.5 }}
                  className="space-y-1 sm:space-y-2"
                >
                  <motion.h3 
                    whileHover={{ scale: 1.1 }}
                    className={`text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold ${stat.color}`}
                  >
                    {stat.value}
                  </motion.h3>
                  <p className="text-gray-400 text-xs sm:text-sm lg:text-base">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </header>

      {/* SEO-friendly content section */}
      <section className="sr-only">
        <h2>GDG on Campus Trakya Üniversitesi Hakkında</h2>
        <p>
          GDG on Campus Trakya Üniversitesi (gdgoncampustu), Trakya Üniversitesi&apos;nde (TÜ)
          faaliyet gösteren Google Developer Groups topluluğudur. GDG, teknoloji meraklıları,
          yazılım geliştiriciler ve öğrenciler için etkinlikler, hackathonlar, workshop&apos;lar
          ve eğitim programları düzenlemektedir.
        </p>
        <p>
          Google Developer Groups on Campus olarak, modern teknolojiler, yazılım geliştirme,
          yapay zeka, bulut bilişim ve diğer Google teknolojileri üzerine düzenli etkinlikler
          gerçekleştiriyoruz. Trakya Üniversitesi kampüsünde teknolojiyi seven herkes için
          bir topluluk oluşturuyoruz.
        </p>
      </section>

      <style jsx global>{`
        @keyframes gradient-text {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-text {
          background-size: 200% 200%;
          animation: gradient-text 6s infinite;
          background-image: linear-gradient(
            90deg,
            #FFD700,
            #4169E1,
            #32CD32,
            #FF4500,
            #FFD700
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes gradient-border {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-border {
          background-size: 200% 200%;
          animation: gradient-border 6s infinite;
          background-image: linear-gradient(
            90deg,
            yellow,
            blue,
            green,
            red,
            yellow
          );
        }
      `}</style>
    </div>
  );
}
