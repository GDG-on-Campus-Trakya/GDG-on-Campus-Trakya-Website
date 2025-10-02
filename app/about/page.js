"use client";
// about/page.js
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export default function AboutPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Modal açıldığında/kapandığında body scroll'u yönet
  useEffect(() => {
    if (selectedImage) {
      // Modal açıldığında scroll'u kapat
      document.body.style.overflow = 'hidden';
    } else {
      // Modal kapandığında scroll'u aç
      document.body.style.overflow = 'unset';
    }

    // Cleanup: Component unmount olduğunda scroll'u geri aç
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  const teamData = {
    organizer: {
      title: "Organizer",
      image: "/organizer.jpg",
      gradient: "from-[#4285F4] to-[#DB4437]",
    },
    koordinatorler: {
      title: "Koordinatörler",
      image: "/koordinatorler.jpg",
      gradient: "from-[#DB4437] to-[#F4B400]",
    },
    teams: [
      {
        department: "Dış İşleri",
        members: [
          { title: "Dış İlişkiler", image: "/dis isleri - dis iliskiler.jpg" },
          { title: "Sponsorluk", image: "/dis isleri - sponsorluk.jpg" },
        ],
        gradient: "from-[#F4B400] to-[#0F9D58]",
      },
      {
        department: "İç İşleri",
        members: [
          { title: "Organizasyon", image: "/ic isleri - organizasyon.jpg" },
          { title: "PR", image: "/ic isleri - pr.jpg" },
        ],
        gradient: "from-[#0F9D58] to-[#4285F4]",
      },
      {
        department: "Medya ve İletişim",
        members: [
          { title: "Sosyal Medya", image: "/medya ve iletisim - sosyal medya.jpg" },
          { title: "Tasarım", image: "/medya ve iletisim - tasarim.jpg" },
        ],
        gradient: "from-[#DB4437] to-[#F4B400]",
      },
      {
        department: "Yazılım",
        members: [
          { title: "Mentor", image: "/yazilim - mentor.jpg" },
        ],
        gradient: "from-[#4285F4] to-[#0F9D58]",
      },
    ],
  };

  // Tüm resimleri tek bir array'de topla
  const allImages = [
    { src: teamData.organizer.image, title: teamData.organizer.title },
    { src: teamData.koordinatorler.image, title: teamData.koordinatorler.title },
    ...teamData.teams.flatMap(team =>
      team.members.map(member => ({
        src: member.image,
        title: `${team.department} - ${member.title}`
      }))
    )
  ];

  const handleImageClick = (imageSrc) => {
    const index = allImages.findIndex(img => img.src === imageSrc);
    setDirection(1);
    setSelectedIndex(index);
    setSelectedImage(allImages[index]);
  };

  const goToNext = () => {
    setDirection(1);
    const nextIndex = (selectedIndex + 1) % allImages.length;
    setSelectedIndex(nextIndex);
    setSelectedImage(allImages[nextIndex]);
  };

  const goToPrevious = () => {
    setDirection(-1);
    const prevIdx = (selectedIndex - 1 + allImages.length) % allImages.length;
    setSelectedIndex(prevIdx);
    setSelectedImage(allImages[prevIdx]);
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      goToPrevious();
    } else if (info.offset.x < -swipeThreshold) {
      goToNext();
    }
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
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12"
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

        {/* Organizer - En Üst */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="max-w-2xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group rounded-2xl overflow-hidden shadow-2xl cursor-zoom-in"
              onClick={() => handleImageClick(teamData.organizer.image)}
            >
              <Image
                src={teamData.organizer.image}
                alt={teamData.organizer.title}
                width={1000}
                height={1000}
                priority
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:via-black/40 transition-all" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-black/60 backdrop-blur-sm">
                <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                  {teamData.organizer.title}
                </h2>
              </div>
              {/* Zoom Icon - Always visible on mobile, hover on desktop */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 sm:p-3 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Koordinatörler - İkinci Seviye */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="max-w-3xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group rounded-2xl overflow-hidden shadow-2xl cursor-zoom-in"
              onClick={() => handleImageClick(teamData.koordinatorler.image)}
            >
              <Image
                src={teamData.koordinatorler.image}
                alt={teamData.koordinatorler.title}
                width={1000}
                height={1000}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:via-black/40 transition-all" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 bg-black/60 backdrop-blur-sm">
                <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  {teamData.koordinatorler.title}
                </h2>
              </div>
              {/* Zoom Icon - Always visible on mobile, hover on desktop */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 sm:p-3 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Takımlar Carousel - Swipe */}
        <motion.div variants={itemVariants} className="mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] to-[#0F9D58]">
            Takımlarımız
          </h3>

          <Carousel
            className="relative w-full max-w-6xl mx-auto"
            opts={{
              align: "center",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {(() => {
                const allMembers = teamData.teams.flatMap(team =>
                  team.members.map(member => ({
                    ...member,
                    department: team.department,
                    gradient: team.gradient
                  }))
                );

                return allMembers.map((member, index) => (
                  <CarouselItem
                    key={index}
                    className="pl-2 md:pl-4 basis-full md:basis-1/2"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="h-full group"
                    >
                      <Card className="border-none bg-transparent h-full">
                        <CardContent className="p-0">
                          <div
                            className="relative w-full rounded-xl overflow-hidden shadow-2xl cursor-zoom-in"
                            onClick={() => handleImageClick(member.image)}
                          >
                            <Image
                              src={member.image}
                              alt={member.title}
                              width={800}
                              height={800}
                              className="w-full h-auto"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:via-black/40 transition-all" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                              <p className="text-sm sm:text-base text-gray-200 mb-1">
                                {member.department}
                              </p>
                              <h4 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                                {member.title}
                              </h4>
                            </div>
                            {/* Zoom Icon - Always visible on mobile, hover on desktop */}
                            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                              </svg>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ));
              })()}
            </CarouselContent>
          </Carousel>
        </motion.div>

        {/* About Section */}
        <motion.div variants={itemVariants} className="mt-20 mb-16">
          <motion.h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8"
          >
            <motion.span
              className="bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] animate-gradient-x"
            >
              GDG Trakya On Campus
            </motion.span>
          </motion.h2>

          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-center sm:text-lg lg:text-xl leading-relaxed text-[#d1d1e0] backdrop-blur-sm bg-gray-800/30 p-6 rounded-lg">
              GDG Trakya On Campus, öğrenmek, paylaşmak ve gelişmek için bir araya
              gelen tutkulu geliştiriciler ve öğrencilerden oluşan bir
              topluluktur. Misyonumuz, öğrencilere Google teknolojilerini öğrenme
              fırsatları sunmak, sektör profesyonelleriyle iletişim kurmalarını
              sağlamak ve becerilerini geliştirmelerine yardımcı olmaktır.
            </p>
            <p className="text-center sm:text-lg lg:text-xl leading-relaxed text-[#d1d1e0] backdrop-blur-sm bg-gray-800/30 p-6 rounded-lg">
              İster yeni başlayın ister deneyimli bir geliştirici olun,
              etkinliklerimiz ve aktivitelerimiz sizi başarıya ulaşmanıza ve
              teknoloji meraklılarından oluşan güçlü bir topluluk kurmanıza
              yardımcı olmak için tasarlanmıştır.
            </p>
          </div>
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

      {/* Image Modal with Navigation */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={selectedIndex}
                  custom={direction}
                  variants={{
                    enter: (direction) => ({
                      x: direction > 0 ? 300 : -300,
                      opacity: 0
                    }),
                    center: {
                      x: 0,
                      opacity: 1
                    },
                    exit: (direction) => ({
                      x: direction > 0 ? -300 : 300,
                      opacity: 0
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="relative w-full h-full cursor-grab active:cursor-grabbing"
                >
                  <Image
                    src={selectedImage.src}
                    alt={selectedImage.title}
                    fill
                    className="object-contain pointer-events-none"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-white text-center">
                  {selectedImage.title}
                </h3>
                <p className="text-center text-gray-300 mt-2">
                  {selectedIndex + 1} / {allImages.length}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 sm:w-12 sm:h-12 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold backdrop-blur-sm transition-all z-10 hover:scale-110"
              >
                ×
              </button>

              {/* Previous Button */}
              <button
                onClick={goToPrevious}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-2xl transition-all z-10 hover:scale-110"
              >
                ←
              </button>

              {/* Next Button */}
              <button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-2xl transition-all z-10 hover:scale-110"
              >
                →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
