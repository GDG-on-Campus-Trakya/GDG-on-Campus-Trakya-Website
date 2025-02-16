"use client";
// page.js
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <header className="flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 w-full h-[calc(100vh-80px)]">
        {/* Content Wrapper */}
        <div className="flex flex-col lg:flex-row items-center max-w-7xl w-full mx-auto gap-12">
          {/* Left Section */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-6 lg:space-y-8 text-center lg:text-left lg:mr-12"
          >
            <h1 className="text-5xl lg:text-7xl font-bold text-transparent bg-clip-text animate-gradient-text pb-2">
              GDG On Campus Trakya
            </h1>
            <p className="text-xl lg:text-2xl text-gray-300">
              Teknoloji ve inovasyonun buluşma noktası. Geleceği birlikte şekillendiriyoruz!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/events">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg text-white font-semibold text-lg transition duration-300"
                >
                  Etkinlikleri Keşfet
                </motion.button>
              </Link>
              <Link href="/about">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-transparent border-2 border-blue-600 hover:bg-blue-600/10 rounded-lg shadow-lg text-white font-semibold text-lg transition duration-300"
                >
                  Bizi Tanı
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Right Section */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center w-full lg:w-2/3 mt-8 lg:mt-0"
          >
            <div className="relative w-48 sm:w-64 md:w-80 lg:w-full max-w-2xl">
              <div className="rounded-full p-0.5 bg-gradient-to-r animate-gradient-border">
                <video
                  className="w-full h-auto rounded-full shadow-lg border-2 border-transparent"
                  src="/video2.mp4"
                  aria-label="Promotional Video"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ objectFit: "cover" }}
                />
              </div>
              
              {/* Enhanced Floating Elements */}
              <motion.div
                animate={{
                  y: [0, 20, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-60"
              />
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute bottom-6 -left-6 w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-2xl opacity-60"
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Stats Section - Now positioned below the header */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full bg-gray-900/50 py-16"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-blue-500">500+</h3>
              <p className="text-gray-400">Topluluk Üyesi</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-green-500">50+</h3>
              <p className="text-gray-400">Başarılı Etkinlik</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-purple-500">20+</h3>
              <p className="text-gray-400">Teknoloji Partneri</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-yellow-500">100+</h3>
              <p className="text-gray-400">Saat Eğitim</p>
            </div>
          </div>
        </div>
      </motion.section>

      <style jsx>{`
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
            yellow,
            blue,
            green,
            red,
            yellow
          );
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
