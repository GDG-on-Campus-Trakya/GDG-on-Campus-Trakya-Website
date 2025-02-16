"use client";
// page.js
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <header className="flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 w-full h-[calc(100vh-80px)] relative">
        {/* Content Wrapper */}
        <div className="flex flex-col lg:flex-row items-center max-w-7xl w-full mx-auto gap-12">
          {/* Left Section */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-6 lg:space-y-8 text-center lg:text-left lg:mr-12"
          >
            <motion.h1 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-5xl lg:text-7xl font-bold text-transparent bg-clip-text animate-gradient-text pb-2"
            >
              GDG On Campus Trakya
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl lg:text-2xl text-gray-300"
            >
              Teknoloji ve inovasyonun buluşma noktası. Geleceği birlikte şekillendiriyoruz!
            </motion.p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/events">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(37, 99, 235, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg text-white font-semibold text-lg transition duration-300"
                >
                  Etkinlikleri Keşfet
                </motion.button>
              </Link>
              <Link href="/about">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(37, 99, 235, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-transparent border-2 border-blue-600 hover:bg-blue-600/10 rounded-lg shadow-lg text-white font-semibold text-lg transition duration-300"
                >
                  Bizi Tanı
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="flex justify-center w-full lg:w-2/3 mt-32 lg:mt-0"
          >
            <div className="relative w-48 sm:w-64 md:w-80 lg:w-full max-w-2xl">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="rounded-full p-0.5 bg-gradient-to-r animate-gradient-border"
              >
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
              </motion.div>
              
              {/* Enhanced Floating Elements */}
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
          className="absolute bottom-8 left-0 right-0 w-full bg-gray-900/50 py-8 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
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
                  className="space-y-2"
                >
                  <motion.h3 
                    whileHover={{ scale: 1.1 }}
                    className={`text-4xl font-bold ${stat.color}`}
                  >
                    {stat.value}
                  </motion.h3>
                  <p className="text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </header>

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
