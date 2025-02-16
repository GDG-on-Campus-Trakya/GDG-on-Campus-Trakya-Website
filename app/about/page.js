"use client";
// about/page.js
import InstaCarousel from "../../components/InstaCarousel";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 text-[#4a90e2]">
          Ekibimizle Tanışın!
        </h1>

        <section className="relative mx-auto mb-16 rounded-xl bg-gray-800/50 backdrop-blur-sm p-4 sm:p-6 lg:p-8 shadow-xl">
          <InstaCarousel />
        </section>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 text-[#4a90e2]">
          GDG Trakya On Campus
        </h1>

        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-center sm:text-lg lg:text-xl leading-relaxed text-[#d1d1e0]">
          GDG Trakya On Campus, öğrenmek, paylaşmak ve gelişmek için bir araya gelen tutkulu geliştiriciler ve öğrencilerden oluşan bir topluluktur. Misyonumuz, öğrencilere Google teknolojilerini öğrenme fırsatları sunmak, sektör profesyonelleriyle iletişim kurmalarını sağlamak ve becerilerini geliştirmelerine yardımcı olmaktır.
          </p>
          <p className="text-center sm:text-lg lg:text-xl leading-relaxed text-[#d1d1e0]">
          İster yeni başlayın ister deneyimli bir geliştirici olun, etkinliklerimiz ve aktivitelerimiz sizi başarıya ulaşmanıza ve teknoloji meraklılarından oluşan güçlü bir topluluk kurmanıza yardımcı olmak için tasarlanmıştır.
          </p>
        </div>
      </main>
    </div>
  );
}
