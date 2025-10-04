"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const faqData = [
    {
      category: "🎯 Genel Sorular",
      questions: [
        {
          question: "GDG on Campus Trakya nedir?",
          answer:
            "GDG on Campus Trakya, Google Developer Groups programının Trakya Üniversitesi'ndeki resmi topluluğudur. Teknoloji meraklısı öğrencileri bir araya getirerek, eğitim etkinlikleri, workshop'lar ve networking fırsatları sunuyoruz.",
        },
        {
          question: "Bu platform nasıl çalışıyor?",
          answer:
            "Platformumuz tamamen açık kaynak kodlu olarak geliştirilmiştir. Firebase altyapısı kullanarak güvenli veri saklama, Next.js ile modern web deneyimi sunuyoruz. GitHub'da kaynak kodlarımızı inceleyebilirsiniz.",
        },
        {
          question: "Kimler katılabilir?",
          answer:
            "Trakya Üniversitesi öğrencileri katılabilir. Kayıt sırasında fakülte ve bölüm bilgilerinizi doğru girmeniz gerekmektedir. Tüm bölümlerden öğrenciler hoş karşılanır!",
        },
      ],
    },
    {
      category: "👤 Hesap ve Profil",
      questions: [
        {
          question: "Nasıl hesap oluşturabilirim?",
          answer:
            "Google hesabınızla giriş yaparak otomatik olarak hesap oluşturabilirsiniz. İlk girişte profil bilgilerinizi (isim, fakülte, bölüm) tamamlamanız gerekecek.",
        },
        {
          question: "Profil bilgilerimi nasıl güncellerim?",
          answer:
            "Profil sayfanızdan 'Profili Düzenle' butonuna tıklayarak isim, fakülte, bölüm bilgilerinizi güncelleyebilir ve profil fotoğrafınızı değiştirebilirsiniz.",
        },
        {
          question: "Hesabımı silebilir miyim?",
          answer:
            "Evet! Profil sayfanızda 'Hesabımı Sil' butonu bulunmaktadır. Bu işlem tüm verilerinizi kalıcı olarak siler. Alternatif olarak destek bilet sistemi üzerinden de talepte bulunabilirsiniz.",
        },
        {
          question: "Verilerim güvende mi?",
          answer:
            "Evet, verileriniz Firebase güvenlik kuralları ve HTTPS şifreleme ile korunmaktadır. KVKK uyumlu gizlilik politikamızı inceleyebilirsiniz. Platform açık kaynak olduğu için şeffaflığımızı GitHub'dan kontrol edebilirsiniz.",
        },
      ],
    },
    {
      category: "📅 Etkinlikler",
      questions: [
        {
          question: "Etkinliklere nasıl kayıt olurum?",
          answer:
            "Etkinlikler sayfasından ilgilendiğiniz etkinliğe tıklayın ve 'Kayıt Ol' butonunu kullanın. Profil bilgilerinizin eksiksiz olması gerekiyor. Kayıt sonrası onay beklemeniz gerekebilir.",
        },
        {
          question: "QR kod sistemi nasıl çalışıyor?",
          answer:
            "Kayıt olduktan sonra profil sayfanızda etkinlik için benzersiz bir QR kod oluşturulur. Etkinlik günü bu kodu organizatörlere göstererek katılımınızı onaylatırsınız.",
        },
        {
          question: "Kayıt iptal edebilir miyim?",
          answer:
            "Evet, profil sayfanızdaki 'Kayıtlı Etkinlikler' bölümünden kayıt iptal edebilirsiniz. Etkinlik tarihi yaklaştıkça iptal kısıtlamaları olabilir.",
        },
        {
          question: "Etkinlik dolu ise ne yapmalıyım?",
          answer:
            "Bekleme listesine katılabilir veya benzer gelecek etkinliklerimizi takip edebilirsiniz. Sosyal medya hesaplarımızdan duyuruları kaçırmayın!",
        },
      ],
    },
    // {
    //   category: "💡 Projeler",
    //   questions: [
    //     {
    //       question: "Nasıl proje paylaşabilirim?",
    //       answer: "Projeler sayfasından 'Yeni Proje Ekle' butonunu kullanarak GitHub repo linkini, açıklamayı ve teknolojileri paylaşabilirsiniz. Projeniz incelendikten sonra yayınlanır."
    //     },
    //     {
    //       question: "Hangi tür projeler paylaşabilirim?",
    //       answer: "Web geliştirme, mobil uygulama, yapay zeka, veri bilimi, oyun geliştirme gibi tüm teknoloji projelerini paylaşabilirsiniz. Açık kaynak projeler tercih edilir."
    //     },
    //     {
    //       question: "Projeme nasıl katkıda bulunurum?",
    //       answer: "Diğer üyelerin projelerini inceleyip GitHub'dan katkı yapabilir, yorumlar bırakabilir veya iş birliği önerisinde bulunabilirsiniz."
    //     }
    //   ]
    // },
    // {
    //   category: "📱 Sosyal Medya",
    //   questions: [
    //     {
    //       question: "Sosyal medya paylaşımları nasıl çalışıyor?",
    //       answer: "Instagram'daki @gdgoncampustu hesabımızdan paylaşımlarımızı otomatik olarak sitede gösteriyoruz. Bu sayede güncel içerikleri kaçırmazsınız."
    //     },
    //     {
    //       question: "Sosyal medya hesaplarınız hangileri?",
    //       answer: "Instagram: @gdgoncampustu ve LinkedIn: GDG on Campus Trakya hesaplarımızı takip edebilirsiniz. Tüm duyurular bu kanallardan da paylaşılır."
    //     }
    //   ]
    // },
    {
      category: "🎫 Destek Sistemi",
      questions: [
        {
          question: "Nasıl destek alabilirim?",
          answer:
            "Bilet sistemi üzerinden şikayet, öneri, teknik destek veya genel konularda bilet oluşturabilirsiniz. Dosya eki de ekleyebilirsiniz.",
        },
        {
          question: "Destek biletlerim nasıl takip edilir?",
          answer:
            "Tüm biletlerinizi 'Destek' sayfasında görebilir, yanıtları takip edebilir ve kapalı biletleri yeniden açabilirsiniz.",
        },
        {
          question: "Ne kadar sürede yanıt alırım?",
          answer:
            "Genellikle 3-5 iş günü içinde yanıt vermeye çalışıyoruz. Acil durumlar için LinkedIn veya Instagram'dan da ulaşabilirsiniz.",
        },
        {
          question: "Hangi dosya türlerini yükleyebilirim?",
          answer:
            "JPG, PNG, GIF, PDF ve TXT dosyaları yükleyebilirsiniz. Maksimum dosya boyutu 5MB, en fazla 3 dosya ekleyebilirsiniz.",
        },
      ],
    },
    {
      category: "⚙️ Teknik Sorular",
      questions: [
        {
          question: "Site mobil uyumlu mu?",
          answer:
            "Evet! Responsive tasarım ile tüm cihazlarda (telefon, tablet, bilgisayar) mükemmel çalışır. PWA desteği de mevcuttur.",
        },
        {
          question: "Hangi teknolojiler kullanılıyor?",
          answer:
            "Next.js, React, Firebase (Auth, Firestore, Storage), Tailwind CSS, Framer Motion ve Vercel hosting kullanıyoruz. Tamamen modern stack!",
        },
        {
          question: "Çerez kullanıyor musunuz?",
          answer:
            "Hayır, şu anda çerez kullanmıyoruz. Sadece Vercel Analytics ile anonim istatistik topluyoruz. Gelecekte kullanırsak bilgilendiririz.",
        },
        {
          question: "Site ne kadar hızlı?",
          answer:
            "Next.js optimizasyonları ve Vercel Edge Network sayesinde çok hızlı yüklenir. Images lazy loading ve code splitting teknikleri kullanılır.",
        },
        {
          question: "Kaynak kodlara nasıl erişebilirim?",
          answer:
            "GitHub'da tamamen açık kaynak! Katkıda bulunmak isterseniz pull request gönderebilir, issue açabilirsiniz.",
        },
      ],
    },
    {
      category: "🔒 Gizlilik ve Güvenlik",
      questions: [
        {
          question: "Kişisel verilerim nasıl korunuyor?",
          answer:
            "KVKK uyumlu olarak çalışıyoruz. Verileriniz Firebase güvenlik kuralları ile korunur, HTTPS şifreleme kullanılır. Gizlilik politikamızı mutlaka okuyun.",
        },
        {
          question: "Verilerimi kimlerle paylaşıyorsunuz?",
          answer:
            "Verilerinizi üçüncü taraflarla paylaşmıyoruz. Sadece etkinlik organizasyonu ve istatistiksel analizler için kullanırız. Anonim veriler kullanılır.",
        },
        {
          question: "Veri sızıntısı durumunda ne yapıyorsunuz?",
          answer:
            "Firebase'in güvenlik önlemleri sayesinde risk minimaldır. Olası durumda derhal kullanıcılar bilgilendirilir ve gerekli aksiyonlar alınır.",
        },
      ],
    },
    {
      category: "📞 İletişim",
      questions: [
        {
          question: "Size nasıl ulaşabilirim?",
          answer:
            "Öncelikle site içi destek sistemi, ardından Instagram (@gdgoncampustu) ve LinkedIn hesaplarımızdan ulaşabilirsiniz.",
        },
        {
          question: "Acil durumlar için iletişim var mı?",
          answer:
            "Teknik acil durumlar için sosyal medya hesaplarımızdan hızlı yanıt alabilirsiniz. Etkinlik günü WhatsApp grupları da kurulur.",
        },
        {
          question: "Geri bildirimlerim değerlendiriliyor mu?",
          answer:
            "Kesinlikle! Tüm önerilerinizi ciddiye alır, platform geliştirmelerinde öncelik veririz. Topluluk odaklı bir yaklaşımımız var.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <div className="container mx-auto px-4 pt-20 sm:pt-24 md:pt-28 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] mb-6"
            >
              Sıkça Sorulan Sorular
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              Platformumuz ve topluluğumuz hakkında merak ettiğiniz her şey
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-900/20 rounded-2xl p-6 border border-blue-500/30"
            >
              <p className="text-blue-200">
                💡 <strong>İpucu:</strong> Aradığınızı bulamazsanız, destek
                bilet sistemimizden soru sorabilirsiniz!
              </p>
            </motion.div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqData.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6"
              >
                <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-gray-700/50">
                  {category.category}
                </h2>

                <div className="space-y-4">
                  {category.questions.map((item, questionIndex) => {
                    const itemKey = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openItems[itemKey];

                    return (
                      <div
                        key={questionIndex}
                        className="border border-gray-700/30 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(itemKey)}
                          className="w-full px-6 py-4 text-left bg-gray-700/20 hover:bg-gray-700/30 transition-all duration-200 flex items-center justify-between"
                        >
                          <span className="font-semibold text-white pr-4">
                            {item.question}
                          </span>
                          <motion.svg
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-5 h-5 text-blue-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </motion.svg>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 py-4 bg-gray-800/20 border-t border-gray-700/30">
                                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                  {item.answer}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-purple-500/30"
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              Hala sorunuz mu var?
            </h3>
            <p className="text-gray-300 mb-6">
              FAQ'da bulamadığınız sorular için destek sistemimizi kullanın veya
              sosyal medyadan ulaşın!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/tickets")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Destek Bileti Oluştur
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  window.open(
                    "https://www.instagram.com/gdgoncampustu/",
                    "_blank"
                  )
                }
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Instagram'dan Ulaş
              </motion.button>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => (window.location.href = "/about")}
              className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:border-blue-500/50 transition-all duration-200"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm text-gray-300">Hakkımızda</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => (window.location.href = "/events")}
              className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:border-green-500/50 transition-all duration-200"
            >
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm text-gray-300">Etkinlikler</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => (window.location.href = "/privacy")}
              className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:border-purple-500/50 transition-all duration-200"
            >
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-sm text-gray-300">Gizlilik</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => (window.location.href = "/terms")}
              className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl hover:border-yellow-500/50 transition-all duration-200"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm text-gray-300">Kullanım Şartları</div>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
