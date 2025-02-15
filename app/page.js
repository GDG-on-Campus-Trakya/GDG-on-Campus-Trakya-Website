"use client";
// page.js
import Link from "next/link";
import React from "react";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      <header className="flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 w-full">
        {/* Content Wrapper */}
        <div className="flex flex-col lg:flex-row items-center max-w-7xl w-full mx-auto">
          {/* Left Section */}
          <div className="max-w-3xl space-y-4 lg:space-y-6 text-center lg:text-left lg:mr-12">
            <h1 className="text-4xl lg:text-7xl font-bold text-transparent bg-clip-text animate-gradient-text pb-2">
              GDG On Campus Trakya
            </h1>
            {/* <p className="text-lg lg:text-xl text-gray-300">
              güzel kulüp gelin
            </p>
            <Link href="/events">
              <button className="px-6 py-3 lg:px-8 lg:py-4 bg-red-500 hover:bg-red-600 rounded-lg shadow-lg text-white font-semibold text-base lg:text-lg transition duration-300">
                Etkinlikler
              </button>
            </Link> */}
          </div>
          {/* Right Section */}
          <div className="flex justify-center w-full lg:w-2/3 mt-8 lg:mt-0">
            <div className="relative w-48 sm:w-64 md:w-80 lg:w-full max-w-2xl">
              {/* Video with Slimmed Gradient Border */}
              <div className="rounded-full p-0.5 bg-gradient-to-r animate-gradient-border">
                <video
                  className="w-full h-auto rounded-full shadow-lg border-2 border-transparent"
                  src="/video2.mp4" // Replace with your actual video file path
                  aria-label="Promotional Video"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ objectFit: "cover" }}
                />
              </div>
              {/* Floating Icons */}
              <div className="absolute -top-6 sm:-top-8 md:-top-10 -right-6 sm:-right-8 md:-right-10 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-full blur-2xl hidden md:block"></div>
              <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 -left-6 sm:-left-8 md:-left-10 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-gradient-to-r from-yellow-500 to-red-500 rounded-full blur-2xl hidden md:block"></div>
              <div className="absolute top-6 sm:top-8 md:top-10 -left-6 sm:-left-8 md:-left-10 w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-3xl hidden lg:block"></div>
              <div className="absolute bottom-12 sm:bottom-8 md:bottom-50 -right-6 sm:-right-8 md:-right-10 w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-2xl hidden lg:block"></div>
            </div>
          </div>
        </div>
      </header>
      {/* Gradient Animation Styles */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
}
