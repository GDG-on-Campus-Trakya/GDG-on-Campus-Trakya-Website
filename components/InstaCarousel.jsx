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
            <Card className="border-none bg-transparent">
              <CardContent className="flex aspect-square items-center justify-center p-2">
                <img
                  src={image}
                  alt={`Carousel image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>

      <CarouselPrevious className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-gray-700/75 hover:bg-gray-700 text-white" />
      <CarouselNext className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-gray-700/75 hover:bg-gray-700 text-white" />
    </Carousel>
  );
};

export default InstaCarousel;
