"use client";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      <div className="container mx-auto px-4 pt-20 sm:pt-24 md:pt-28 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text mb-4">
              Kullanım Şartları
            </h1>
            <p className="text-xl text-gray-300">
              GDG on Campus Trakya Üniversitesi
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Son Güncelleme: 2 Ekim 2025
            </p>
          </div>

          {/* Content */}
          <div className="bg-gray-800/30 backdrop-blur-md border border-gray-700/50 rounded-2xl p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                1. Kabul ve Onay
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Bu web sitesini kullanarak, aşağıdaki kullanım şartlarını kabul
                etmiş sayılırsınız. Bu şartları kabul etmiyorsanız, siteyi
                kullanmamanızı rica ederiz. Bu şartlar zaman zaman
                güncellenebilir ve güncel hali her zaman bu sayfada
                yayınlanacaktır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                2. Hizmet Tanımı
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  GDG on Campus Trakya Üniversitesi platformu aşağıdaki
                  hizmetleri sunar:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>
                    Teknoloji etkinliklerinin duyurulması ve kayıt alınması
                  </li>
                  <li>Üye profil yönetimi ve topluluk oluşturma</li>
                  <li>Proje paylaşım platformu</li>
                  <li>Sosyal medya entegrasyonu</li>
                  <li>Destek ve öneri sistemi</li>
                  <li>Etkinlik QR kod doğrulama sistemi</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                3. Kullanıcı Sorumlulukları
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Hesap Güvenliği:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Hesap bilgilerinizi güvende tutmak</li>
                    <li>Şifrenizi kimseyle paylaşmamak</li>
                    <li>Şüpheli aktiviteleri bildirmek</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    İçerik Sorumluluğu:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Yalnızca gerçek ve doğru bilgileri paylaşmak</li>
                    <li>Hakaret, küfür ve taciz içeriklerinden kaçınmak</li>
                    <li>Telif hakkı ihlali yapmamak</li>
                    <li>Zararlı yazılım ve spam içerik paylaşmamak</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Topluluk Kuralları:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Diğer kullanıcılara saygılı davranmak</li>
                    <li>Yapıcı ve eğitici içerikler üretmek</li>
                    <li>Teknoloji odaklı paylaşımlar yapmak</li>
                    <li>Akademik etik kurallara uymak</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                4. Yasaklanan Davranışlar
              </h2>
              <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30">
                <p className="text-gray-300 mb-4">
                  Aşağıdaki davranışlar kesinlikle yasaktır:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Sisteme zarar verme, hack girişimleri</li>
                  <li>Başka kullanıcıların hesaplarına yetkisiz erişim</li>
                  <li>Kişisel verilerin kötüye kullanılması</li>
                  <li>Platformu ticari amaçlarla kötüye kullanma</li>
                  <li>Sahte hesap oluşturma</li>
                  <li>Sistem kaynaklarını aşırı kullanma</li>
                  <li>Etkinlik QR kodlarını manipüle etme</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                5. Fikri Mülkiyet Hakları
              </h2>
              <div className="space-y-4">
                <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-500/30">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Açık Kaynak Yapısı
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Bu platform açık kaynak kodlu olarak geliştirilmiştir.
                    Platform kaynak kodu MIT lisansı altında GitHub'da
                    erişilebilirdir. Ancak, GDG ve Google logolar ile markaları
                    ilgili şirketlerin mülkiyetindedir.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Kullanıcı İçerikleri:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Paylaştığınız içerikler sizin mülkiyetinizde kalır</li>
                    <li>
                      Platformda paylaşım için gerekli lisansları vermiş
                      sayılırsınız
                    </li>
                    <li>
                      Telif hakkı ihlali durumunda sorumluluk kullanıcıya aittir
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                6. Hizmet Sürekliliği
              </h2>
              <div className="bg-yellow-900/20 rounded-xl p-6 border border-yellow-500/30">
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong className="text-yellow-400">Önemli Not:</strong>
                  Bu platform öğrenci topluluğu tarafından gönüllü olarak
                  işletilmektedir.
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>%100 kesintisiz hizmet garantisi veremeyiz</li>
                  <li>Planlı bakım ve güncellemeler yapılabilir</li>
                  <li>Teknik sorunlar yaşanabilir</li>
                  <li>Hizmet geçici olarak durabilir</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                7. Veri Yedekleme ve Kayıp
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Verilerinizin güvenliği için elimizden geleni yaparız, ancak:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Veri kaybı riskine karşı kendi yedeklerinizi alın</li>
                  <li>Önemli dosyaları başka yerlerde de saklayın</li>
                  <li>Platform Firebase altyapısını kullanmaktadır</li>
                  <li>Teknik arızalar durumunda veri kayıpları yaşanabilir</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                8. Etkinlik Katılım Kuralları
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Kayıt Süreçleri:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Sadece Trakya Üniversitesi öğrencileri katılabilir</li>
                    <li>Doğru akademik bilgiler (fakülte/bölüm) gereklidir</li>
                    <li>Kayıt onayları organizatörler tarafından yapılır</li>
                    <li>QR kod kontrolü ile katılım doğrulanır</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Etkinlik Kuralları:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Etkinliklere zamanında katılım</li>
                    <li>Diğer katılımcılara saygılı davranış</li>
                    <li>Telefon ve cihazları sessiz modda tutma</li>
                    <li>Etkinlik fotoğraf/video çekimlerine izin</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                9. Sorumluluk Sınırlamaları
              </h2>
              <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/50">
                <p className="text-gray-300 leading-relaxed mb-4">
                  GDG on Campus Trakya Üniversitesi aşağıdaki durumlardan
                  sorumlu değildir:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Kullanıcı hatalarından kaynaklanan kayıplar</li>
                  <li>
                    Üçüncü taraf hizmetlerden (Firebase, Vercel) kaynaklanan
                    sorunlar
                  </li>
                  <li>İnternet bağlantı problemleri</li>
                  <li>Kullanıcılar arası anlaşmazlıklar</li>
                  <li>Dış faktörlerin neden olduğu hizmet kesintileri</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                10. Hesap Askıya Alma ve Sonlandırma
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Askıya Alma Sebepleri:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Kullanım şartlarının ihlali</li>
                    <li>Diğer kullanıcıları rahatsız etme</li>
                    <li>Teknik sistemlere zarar verme girişimi</li>
                    <li>Sahte bilgi paylaşımı</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Sonlandırma Süreci:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                    <li>Önce uyarı yapılır</li>
                    <li>Gerekirse geçici askıya alma</li>
                    <li>Ciddi ihlallerde kalıcı silme</li>
                    <li>Kararlar yeniden değerlendirilebilir</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                11. İletişim ve Destek
              </h2>
              <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/50">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Kullanım şartları veya platform kullanımı hakkında:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>
                    <strong className="text-white">Destek Sistemi:</strong>{" "}
                    Platform içindeki bilet sistemi
                  </li>
                  <li>
                    <strong className="text-white">Kategoriler:</strong>{" "}
                    Şikayet, Öneri, Teknik Destek
                  </li>
                  <li>
                    <strong className="text-white">Yanıt Süresi:</strong> En
                    fazla 3-5 iş günü
                  </li>
                  <li>
                    <strong className="text-white">Açık Kaynak:</strong> GitHub
                    üzerinden katkı
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                12. Çerez Kullanımı ve Veri İşleme
              </h2>
              <div className="space-y-4">
                <div className="bg-orange-900/20 rounded-xl p-6 border border-orange-500/30">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Çerez ve Depolama Teknolojileri
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    Platformumuz kullanıcı deneyimini iyileştirmek ve hizmetleri
                    sağlayabilmek için çerezler ve yerel depolama teknolojileri
                    kullanmaktadır:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>
                      <strong className="text-white">Zorunlu Çerezler:</strong>{" "}
                      Firebase Authentication, oturum yönetimi
                    </li>
                    <li>
                      <strong className="text-white">Analitik Çerezler:</strong>{" "}
                      Vercel Analytics (isteğe bağlı)
                    </li>
                    <li>
                      <strong className="text-white">Fonksiyonel Çerezler:</strong>{" "}
                      Kullanıcı tercihleri, oturum takibi
                    </li>
                  </ul>
                  <p className="text-gray-300 leading-relaxed mt-4">
                    Detaylı bilgi için{" "}
                    <a
                      href="/cookie-policy"
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      Çerez Politikası
                    </a>{" "}
                    sayfamızı inceleyebilirsiniz.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    KVKK ve Veri Güvenliği:
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                    <li>Kişisel verileriniz KVKK kapsamında korunur</li>
                    <li>Verileriniz üçüncü taraflarla paylaşılmaz</li>
                    <li>İstediğiniz zaman verilerinizi silebilirsiniz</li>
                    <li>Veri işleme süreçleri şeffaf ve denetlenebilir</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                13. Yasal Uygunluk
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Bu kullanım şartları:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Türkiye Cumhuriyeti yasalarına tabidir</li>
                  <li>KVKK (Kişisel Verilerin Korunması Kanunu) uyumludur</li>
                  <li>Trakya Üniversitesi öğrenci yönetmeliklerine uygundur</li>
                  <li>Üniversite etik kurallarına göre düzenlenmiştir</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                14. Değişiklik ve Güncellemeler
              </h2>
              <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-500/30">
                <p className="text-gray-300 leading-relaxed mb-4">
                  Bu kullanım şartları zaman zaman güncellenebilir:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Önemli değişiklikler duyurulur</li>
                  <li>Güncel versiyon her zaman bu sayfadadır</li>
                  <li>
                    Kullanımaya devam etmek yeni şartları kabul etmek anlamına
                    gelir
                  </li>
                  <li>GitHub üzerinden değişiklik geçmişi görüntülenebilir</li>
                </ul>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-700/50 text-center">
              <div className="bg-green-900/20 rounded-xl p-6 border border-green-500/30">
                <p className="text-green-300 font-semibold mb-2">
                  🎓 Eğitim Amaçlı Platform
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Bu platform eğitim ve öğrenci topluluğu faaliyetleri amacıyla
                  oluşturulmuştur. Amacımız teknoloji meraklısı öğrencileri bir
                  araya getirmek ve öğrenmeyi desteklemektir.
                  <br />
                  <strong className="text-white">
                    Açık kaynak, şeffaf ve topluluk odaklı!
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
