// components/InstaCarousel.jsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";

const InstaCarousel = () => {
  const carouselImages = [
    "/organizer.jpg",
    "/sponsorluk.jpg",
    "/tasarim.jpg",
    "/sosyalmedya.jpg",
    "/egitim.jpg",
    "/yazilim.jpg",
    "/organizasyon.jpg",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Carousel
        className="relative w-full max-w-6xl mx-auto"
        opts={{
          align: "center",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {carouselImages.map((image, index) => (
            <CarouselItem
              key={index}
              className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/2 sm:basis-1/2 basis:1/2"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="h-full"
              >
                <Card className="border-none bg-transparent h-full">
                  <CardContent className="flex aspect-square items-center justify-center p-2">
                    <motion.img
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      src={image}
                      alt={`Carousel image ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <motion.div
          whileHover={{ scale: 1.1 }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
        >
          <CarouselPrevious className="hidden md:flex bg-gray-700/75 hover:bg-gray-700 text-white" />
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
        >
          <CarouselNext className="hidden md:flex bg-gray-700/75 hover:bg-gray-700 text-white" />
        </motion.div>
      </Carousel>
    </motion.div>
  );
};

export default InstaCarousel;
