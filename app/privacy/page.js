"use client";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] mb-4">
              Gizlilik Politikası
            </h1>
            <p className="text-xl text-gray-300">
              GDG on Campus Trakya Üniversitesi
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Son Güncelleme: 24 Ağustos 2025
            </p>
          </div>

          {/* Content */}
          <div className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                1. Giriş
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                GDG on Campus Trakya Üniversitesi olarak, kişisel verilerinizin
                korunması ve gizliliği bizim için son derece önemlidir. Bu
                gizlilik politikası, web sitemizde hangi kişisel verilerin
                toplandığını, nasıl kullanıldığını ve korunduğunu
                açıklamaktadır.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Bu platform tamamen{" "}
                <strong className="text-blue-400">açık kaynak</strong> olarak
                geliştirilmiştir ve kaynak kodu GitHub üzerinden herkes
                tarafından incelenebilir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                2. Toplanan Kişisel Veriler
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Hesap Bilgileri:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Ad ve soyad</li>
                    <li>E-posta adresi</li>
                    <li>Profil fotoğrafı (isteğe bağlı)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Akademik Bilgiler:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Fakülte bilgisi</li>
                    <li>Bölüm bilgisi</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    İletişim Verileri:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Destek biletlerinde paylaşılan bilgiler</li>
                    <li>Dosya ekleri (isteğe bağlı)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                3. Verilerin Kullanım Amaçları
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Topladığımız kişisel veriler yalnızca aşağıdaki amaçlar için
                kullanılmaktadır:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>
                  <strong className="text-white">
                    Etkinlik Organizasyonu:
                  </strong>{" "}
                  Etkinliklerimize katılım sağlama ve organizasyon
                </li>
                <li>
                  <strong className="text-white">İstatistiksel Analiz:</strong>{" "}
                  Fakülte ve bölüm dağılımı gibi anonim istatistikler
                </li>
                <li>
                  <strong className="text-white">Destek Hizmetleri:</strong>{" "}
                  Teknik destek ve önerilerin değerlendirilmesi
                </li>
                <li>
                  <strong className="text-white">İletişim:</strong> Etkinlik
                  duyuruları ve önemli güncellemeler
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                4. Hukuki Dayanak
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Kişisel verilerinizi KVKK'nın 5. maddesinin (c) fıkrası uyarınca{" "}
                <strong className="text-white">açık rızanız</strong> ile
                işlemekteyiz. Ayrıca, etkinlik organizasyonu ve öğrenci topluluk
                faaliyetleri için{" "}
                <strong className="text-white">meşru menfaat </strong>
                dayanağını da kullanmaktayız.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                5. Veri Saklama Süresi
              </h2>
              <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Şu anda otomatik veri silme sistemimiz bulunmamaktadır.
                  Veriler manuel olarak yönetilmektedir:
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>
                    <strong className="text-white">Hesap Bilgileri:</strong>{" "}
                    Hesap silme özelliği ile verileriniz tamamen silinebilir
                  </li>
                  <li>
                    <strong className="text-white">Destek Biletleri:</strong>{" "}
                    Çözümlendikten sonra arşivlenir, talep üzerine silinir
                  </li>
                  <li>
                    <strong className="text-white">Etkinlik Kayıtları:</strong>{" "}
                    İstatistiksel amaçla saklanır, ekstra kişisel veri olmadan
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    <strong>Not:</strong> Hesap silme işlemi için profil
                    sayfanızdan "Hesabımı Sil" butonunu kullanabilir veya destek
                    bilet sistemi üzerinden talepte bulunabilirsiniz.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                6. Veri Güvenliği
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Verilerinizin güvenliği için aşağıdaki tedbirleri alıyoruz:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Firebase güvenlik kuralları ile veri erişim kontrolü</li>
                  <li>HTTPS şifreleme ile güvenli veri aktarımı</li>
                  <li>Düzenli güvenlik güncellemeleri</li>
                  <li>Sınırlı yetkilendirme ve erişim kontrolü</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                7. Haklar
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                KVKK kapsamında sahip olduğunuz haklar:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                  <h4 className="font-semibold text-white mb-2">
                    Erişim Hakkı
                  </h4>
                  <p className="text-sm text-gray-300">
                    Verilerinizin işlenip işlenmediğini öğrenme
                  </p>
                </div>
                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                  <h4 className="font-semibold text-white mb-2">
                    Düzeltme Hakkı
                  </h4>
                  <p className="text-sm text-gray-300">
                    Yanlış verilerin düzeltilmesini isteme
                  </p>
                </div>
                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                  <h4 className="font-semibold text-white mb-2">Silme Hakkı</h4>
                  <p className="text-sm text-gray-300">
                    Destek sistemi üzerinden verilerinizin manuel silinmesini
                    talep etme
                  </p>
                </div>
                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                  <h4 className="font-semibold text-white mb-2">
                    İtiraz Hakkı
                  </h4>
                  <p className="text-sm text-gray-300">
                    Veri işleme sürecine itiraz etme
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                8. Çerez Kullanımı
              </h2>
              <div className="bg-green-900/20 rounded-xl p-6 border border-green-500/30">
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-green-400">
                    Şu anda çerez kullanmıyoruz.
                  </strong>
                  Yalnızca Vercel Analytics aracılığıyla anonim kullanım
                  istatistikleri topluyoruz. Gelecekte çerez kullanımına
                  başlarsak, bu sayfa güncellenecek ve bilgilendirileceksiniz.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                9. Üçüncü Taraf Hizmetler
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                  <h4 className="font-semibold text-white mb-2">
                    Firebase (Google)
                  </h4>
                  <p className="text-sm text-gray-300">
                    Kimlik doğrulama ve veri saklama
                  </p>
                </div>
                <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
                  <h4 className="font-semibold text-white mb-2">
                    Vercel Analytics
                  </h4>
                  <p className="text-sm text-gray-300">
                    Anonim site kullanım istatistikleri
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                10. Açık Kaynak Yapısı
              </h2>
              <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-500/30">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Bu platform tamamen açık kaynak kodlu olarak geliştirilmiştir.
                  Kaynak kodlarına GitHub üzerinden erişebilir ve veri işleme
                  süreçlerimizi şeffaf bir şekilde inceleyebilirsiniz.
                </p>
                <p className="text-purple-300 font-semibold">
                  🔍 Şeffaflık bizim önceliğimizdir!
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                11. İletişim
              </h2>
              <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/50">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Gizlilik politikamız hakkında sorularınız veya veri koruma
                  haklarınızı kullanmak istiyorsanız:
                </p>
                <div className="space-y-2">
                  <p className="text-white">
                    <strong>Veri Sorumlusu:</strong> GDG on Campus Trakya
                    Üniversitesi
                  </p>
                  <p className="text-white">
                    <strong>İletişim:</strong> Site içindeki destek bilet
                    sistemi
                  </p>
                  <p className="text-white">
                    <strong>Üniversite:</strong> Trakya Üniversitesi
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                12. Güncellemeler
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Bu gizlilik politikası gerektiğinde güncellenebilir. Önemli
                değişiklikler olduğunda kullanıcılarımız bilgilendirilecektir.
                Düzenli olarak bu sayfayı kontrol etmenizi öneririz.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-700/50 text-center">
              <p className="text-gray-400 text-sm">
                Bu gizlilik politikası KVKK (Kişisel Verilerin Korunması Kanunu)
                ve ilgili mevzuatlar uyarınca hazırlanmıştır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
