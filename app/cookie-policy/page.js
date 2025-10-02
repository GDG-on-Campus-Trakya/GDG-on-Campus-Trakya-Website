import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white py-12 px-4">
      <div className="container mx-auto px-4 pt-20 sm:pt-24 md:pt-28 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text mb-4">
              Çerez Politikası
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
            {/* Giriş */}
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                1. Çerez Nedir?
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Çerezler, web sitelerini ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza
                kaydedilen küçük metin dosyalarıdır. Çerezler, web sitesinin düzgün çalışmasını
                sağlamak, kullanıcı deneyimini iyileştirmek ve site performansını analiz etmek
                için yaygın olarak kullanılır.
              </p>
            </section>

            {/* Kullandığımız Çerezler */}
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                2. Kullandığımız Çerezler ve Depolama Teknolojileri
              </h2>

              {/* Zorunlu Çerezler */}
              <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                <h3 className="text-xl font-semibold text-white mb-3">
                  2.1. Zorunlu Çerezler
                </h3>
                <p className="text-gray-300 mb-3 leading-relaxed">
                  Bu çerezler web sitesinin temel işlevlerini yerine getirmesi için gereklidir
                  ve devre dışı bırakılamaz.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>
                    <strong>Firebase Authentication Çerezleri:</strong> Kullanıcı oturumlarını
                    yönetmek ve kimlik doğrulama işlemlerini gerçekleştirmek için kullanılır.
                  </li>
                  <li>
                    <strong>Session Storage:</strong> Oturum boyunca geçici verileri saklamak
                    için kullanılır (audit log session ID).
                  </li>
                </ul>
              </div>

              {/* Analitik Çerezler */}
              <div className="mb-6 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                <h3 className="text-xl font-semibold text-white mb-3">
                  2.2. Analitik Çerezler
                </h3>
                <p className="text-gray-300 mb-3 leading-relaxed">
                  Site kullanımını anlamamıza ve performansı iyileştirmemize yardımcı olan çerezlerdir.
                  Bu çerezleri reddetme hakkınız vardır.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>
                    <strong>Vercel Analytics:</strong> Sayfa görüntülemeleri, kullanıcı etkileşimleri
                    ve site performansı hakkında anonim istatistikler toplar.
                  </li>
                </ul>
              </div>

              {/* Fonksiyonel Çerezler */}
              <div className="mb-6 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <h3 className="text-xl font-semibold text-white mb-3">
                  2.3. Fonksiyonel Çerezler
                </h3>
                <p className="text-gray-300 mb-3 leading-relaxed">
                  Gelişmiş özellikler ve kişiselleştirme sağlayan çerezlerdir.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                  <li>
                    <strong>Local Storage:</strong> Kullanıcı tercihlerini (çerez onayı, tema tercihi vb.)
                    saklamak için kullanılır.
                  </li>
                  <li>
                    <strong>Audit Log Session ID:</strong> Güvenlik ve kullanıcı aktivite takibi için
                    oturum kimliklerini saklar.
                  </li>
                </ul>
              </div>
            </section>

            {/* Çerez Ömürleri */}
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                3. Çerez Ömürleri
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Çerez Türü
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Ömrü
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-sm text-white">
                        Firebase Auth Token
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        1 saat (yenilenebilir)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-white">
                        Session Storage
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        Oturum sonuna kadar
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-white">
                        Local Storage (tercihler)
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        Kalıcı (kullanıcı silinceye kadar)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-white">
                        Analytics Çerezleri
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        24 saat
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Çerezleri Yönetme */}
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                4. Çerezleri Nasıl Yönetebilirsiniz?
              </h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Çerez tercihlerinizi aşağıdaki yollarla yönetebilirsiniz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4 ml-4">
                <li>
                  <strong>Site Üzerinden:</strong> Sayfanın alt kısmındaki çerez tercihlerini kullanarak
                  istediğiniz zaman tercihlerinizi değiştirebilirsiniz.
                </li>
                <li>
                  <strong>Tarayıcı Ayarları:</strong> Çoğu web tarayıcısı, çerezleri otomatik olarak
                  kabul eder ancak tarayıcı ayarlarınızdan çerezleri engelleyebilir veya silebilirsiniz.
                </li>
                <li>
                  <strong>Local Storage:</strong> Tarayıcınızın geliştirici araçlarından (F12)
                  Application/Storage sekmesinden local storage verilerini silebilirsiniz.
                </li>
              </ul>

              <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                <p className="text-sm text-gray-300 leading-relaxed">
                  <strong>⚠️ Uyarı:</strong> Zorunlu çerezleri devre dışı bırakırsanız,
                  web sitesinin bazı bölümleri düzgün çalışmayabilir ve giriş yapamayabilirsiniz.
                </p>
              </div>
            </section>

            {/* Tarayıcı Ayarları */}
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                5. Tarayıcı Ayarları ile Çerez Yönetimi
              </h2>
              <ul className="space-y-2 text-gray-300 ml-4">
                <li>
                  <strong>Chrome:</strong> Ayarlar → Gizlilik ve güvenlik → Çerezler ve diğer site verileri
                </li>
                <li>
                  <strong>Firefox:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler ve Site Verileri
                </li>
                <li>
                  <strong>Safari:</strong> Tercihler → Gizlilik → Çerezleri ve web sitesi verilerini yönet
                </li>
                <li>
                  <strong>Edge:</strong> Ayarlar → Çerezler ve site izinleri → Çerezleri ve depolanan verileri yönet
                </li>
              </ul>
            </section>

            {/* Üçüncü Taraf Hizmetler */}
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                6. Üçüncü Taraf Hizmetler
              </h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Sitemizde kullanılan üçüncü taraf hizmetler ve gizlilik politikaları:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>
                  <strong>Firebase (Google):</strong>{' '}
                  <a
                    href="https://firebase.google.com/support/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Firebase Gizlilik Politikası
                  </a>
                </li>
                <li>
                  <strong>Vercel Analytics:</strong>{' '}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Vercel Gizlilik Politikası
                  </a>
                </li>
              </ul>
            </section>

            {/* Haklarınız */}
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                7. KVKK Kapsamında Haklarınız
              </h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                KVKK (6698 sayılı Kişisel Verilerin Korunması Kanunu) kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
                <li>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
              </ul>
            </section>

            {/* İletişim */}
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                8. İletişim
              </h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                Çerez politikamız hakkında sorularınız veya talepleriniz için bizimle iletişime geçebilirsiniz.
              </p>
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <Link 
                  href="/tickets" 
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Destek sayfasına git →</span>
                </Link>
              </div>
            </section>

            {/* Değişiklikler */}
            <section>
              <h2 className="text-2xl font-bold text-blue-400 mb-4">
                9. Politika Değişiklikleri
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Bu çerez politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda
                sizi bilgilendireceğiz. Bu sayfayı düzenli olarak ziyaret ederek güncel politikamızı
                takip edebilirsiniz.
              </p>
            </section>
          </div>

          {/* Footer Links */}
          <div className="mt-12 pt-8 border-t border-gray-700/50 text-center">
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <Link href="/terms" className="text-blue-400 hover:underline">
                Kullanım Koşulları
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/privacy" className="text-blue-400 hover:underline">
                Gizlilik Politikası
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/" className="text-blue-400 hover:underline">
                Ana Sayfa
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
