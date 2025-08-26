"use client";
// about/page.js
import InstaCarousel from "../../components/InstaCarousel";
import { motion } from "framer-motion";

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white"
    >
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] animate-gradient-x"
          >
            Ekibimizle Tanışın!
          </motion.span>
        </motion.h1>

        <motion.section
          variants={itemVariants}
          className="relative mx-auto mb-16 rounded-xl bg-gray-800/50 backdrop-blur-sm p-4 sm:p-6 lg:p-8 shadow-xl"
        >
          {/* <InstaCarousel /> */}
          <div className="text-center py-8">
            <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58]">
              Yeni Core Team yakında...
            </h2>
          </div>
        </motion.section>

        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] animate-gradient-x"
          >
            GDG Trakya On Campus
          </motion.span>
        </motion.h1>

        <motion.div
          variants={itemVariants}
          className="max-w-3xl mx-auto space-y-6"
        >
          <motion.p
            variants={itemVariants}
            className="text-center sm:text-lg lg:text-xl leading-relaxed text-[#d1d1e0] backdrop-blur-sm bg-gray-800/30 p-6 rounded-lg"
          >
            GDG Trakya On Campus, öğrenmek, paylaşmak ve gelişmek için bir araya
            gelen tutkulu geliştiriciler ve öğrencilerden oluşan bir
            topluluktur. Misyonumuz, öğrencilere Google teknolojilerini öğrenme
            fırsatları sunmak, sektör profesyonelleriyle iletişim kurmalarını
            sağlamak ve becerilerini geliştirmelerine yardımcı olmaktır.
          </motion.p>
          <motion.p
            variants={itemVariants}
            className="text-center sm:text-lg lg:text-xl leading-relaxed text-[#d1d1e0] backdrop-blur-sm bg-gray-800/30 p-6 rounded-lg"
          >
            İster yeni başlayın ister deneyimli bir geliştirici olun,
            etkinliklerimiz ve aktivitelerimiz sizi başarıya ulaşmanıza ve
            teknoloji meraklılarından oluşan güçlü bir topluluk kurmanıza
            yardımcı olmak için tasarlanmıştır.
          </motion.p>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"
        />
      </main>

      <style jsx global>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: left;
          }
          50% {
            background-position: right;
          }
        }
        .animate-gradient-x {
          background-size: 300% 100%;
          animation: gradient-x 8s ease-in-out infinite;
          background-image: linear-gradient(
            to right,
            #4285f4,
            /* Google Blue */ #db4437,
            /* Google Red */ #f4b400,
            /* Google Yellow */ #0f9d58,
            /* Google Green */ #4285f4 /* Back to Blue */
          );
        }
      `}</style>
    </motion.div>
  );
}
