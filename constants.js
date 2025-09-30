const facultyDepartments = {
  "Arda Meslek Yüksekokulu": [
    "Aşçılık",
    "Eczane Hizmetleri",
    "Gıda Teknolojisi",
    "Kimya Teknolojisi",
    "Laboratuvar Teknolojisi",
    "Yağ Endüstrisi"
  ],
  "Diş Hekimliği Fakültesi": [
    "Diş Hekimliği"
  ],
  "Eczacılık Fakültesi": [
    "Eczacılık"
  ],
  "Edebiyat Fakültesi": [
    "Almanca Mütercim ve Tercümanlık",
    "Arkeoloji",
    "Arnavut Dili ve Edebiyatı",
    "Boşnak Dili ve Edebiyatı",
    "Bulgarca Mütercim ve Tercümanlık",
    "Çağdaş Yunan Dili ve Edebiyatı",
    "İngilizce Mütercim ve Tercümanlık",
    "Sanat Tarihi",
    "Tarih",
    "Türk Dili ve Edebiyatı"
  ],
  "Edirne Sosyal Bilimler Meslek Yüksekokulu": [
    "Bankacılık ve Sigortacılık",
    "Büro Yönetimi ve Yönetici Asistanlığı",
    "Dış Ticaret",
    "Halkla İlişkiler ve Tanıtım",
    "Lojistik",
    "Muhasebe ve Vergi Uygulamaları",
    "Ofis Teknolojileri ve Veri Yönetimi",
    "Pazarlama",
    "Sosyal Hizmetler",
    "Turizm ve Otel İşletmeciliği"
  ],
  "Edirne Teknik Bilimler Meslek Yüksekokulu": [
    "Basım ve Yayım Teknolojileri",
    "Bilgisayar Programcılığı",
    "Biyomedikal Cihaz Teknolojisi",
    "Dijital Tarım Teknolojileri",
    "Elektrik",
    "Elektronik Teknolojisi",
    "Giyim Üretim Teknolojisi",
    "Harita ve Kadastro",
    "Hibrid ve Elektrikli Taşıtlar Teknolojisi",
    "Hibrid ve Elektrikli Taşıtlar Teknolojisi (KKTC Uyruklu)",
    "İnsansız Araç Teknikerliği",
    "İş Sağlığı ve Güvenliği",
    "Makine",
    "Mobil Teknolojileri",
    "Radyo ve Televizyon Programcılığı",
    "Radyo ve Televizyon Teknolojisi",
    "Robotik ve Yapay Zekâ",
    "Robotik ve Yapay Zeka (KKTC Uyruklu)",
    "Uçak Teknolojisi"
  ],
  "Eğitim Fakültesi": [
    "Almanca Öğretmenliği (Almanca)",
    "Fen Bilgisi Öğretmenliği",
    "İlköğretim Matematik Öğretmenliği",
    "İngilizce Öğretmenliği (İngilizce)",
    "Okul Öncesi Öğretmenliği",
    "Özel Eğitim Öğretmenliği",
    "Rehberlik ve Psikolojik Danışmanlık",
    "Sınıf Öğretmenliği",
    "Sosyal Bilgiler Öğretmenliği",
    "Türkçe Öğretmenliği"
  ],
  "Fen Fakültesi": [
    "Bilgi Güvenliği Teknolojisi",
    "Biyoloji",
    "Fizik",
    "Kimya",
    "Matematik",
    "Yazılım Geliştirme"
  ],
  "Güzel Sanatlar Fakültesi": [
    "İletişim ve Tasarımı"
  ],
  "Havsa Meslek Yüksekokulu": [
    "Bankacılık ve Sigortacılık",
    "İşletme Yönetimi",
    "Lojistik",
    "Maliye",
    "Muhasebe ve Vergi Uygulamaları"
  ],
  "İktisadi ve İdari Bilimler Fakültesi": [
    "Çalışma Ekonomisi ve Endüstri İlişkileri",
    "Ekonometri",
    "İktisat",
    "İşletme",
    "Maliye",
    "Siyaset Bilimi ve Kamu Yönetimi",
    "Uluslararası İlişkiler"
  ],
  "İlahiyat Fakültesi": [
    "İlahiyat",
    "İlahiyat (M.T.O.K.)"
  ],
  "İpsala Meslek Yüksekokulu": [
    "Dış Ticaret",
    "Elektronik Teknolojisi",
    "Laboratuvar Teknolojisi",
    "Lojistik",
    "Mahkeme Büro Hizmetleri",
    "Mekatronik"
  ],
  "Keşan Hakkı Yörük Sağlık Yüksekokulu": [
    "Acil Yardım ve Afet Yönetimi",
    "Hemşirelik"
  ],
  "Keşan Meslek Yüksekokulu": [
    "Çocuk Gelişimi",
    "Elektrik",
    "Laborant ve Veteriner Sağlık",
    "Otomotiv Teknolojisi",
    "Turizm ve Otel İşletmeciliği",
    "Yenilenebilir Enerji Teknikerliği"
  ],
  "Keşan Yusuf Çapraz Uygulamalı Bilimler Yüksekokulu": [
    "Bankacılık ve Sigortacılık",
    "Bankacılık ve Sigortacılık (KKTC Uyruklu)",
    "Bilişim Sistemleri ve Teknolojileri",
    "Gümrük İşletme",
    "Halkla İlişkiler ve Reklamcılık",
    "Uluslararası Ticaret ve Finansman"
  ],
  "Kırkpınar Spor Bilimleri Fakültesi": [
    "Spor Yöneticiliği"
  ],
  "Mimarlık Fakültesi": [
    "İç Mimarlık",
    "Mimarlık",
    "Mimarlık (İngilizce) (UOLP-Uluslararası Balkan Üniversitesi) (Ücretli)",
    "Peyzaj Mimarlığı"
  ],
  "Mühendislik Fakültesi": [
    "Bilgisayar Mühendisliği",
    "Bilgisayar Mühendisliği (KKTC Uyruklu)",
    "Elektrik-Elektronik Mühendisliği",
    "Genetik ve Biyomühendislik",
    "Genetik ve Biyomühendislik (KKTC Uyruklu)",
    "Gıda Mühendisliği",
    "Makine Mühendisliği"
  ],
  "Sağlık Bilimleri Fakültesi": [
    "Beslenme ve Diyetetik",
    "Ergoterapi",
    "Fizyoterapi ve Rehabilitasyon",
    "Hemşirelik",
    "Odyoloji",
    "Sağlık Yönetimi"
  ],
  "Sağlık Hizmetleri Meslek Yüksekokulu": [
    "Ağız ve Diş Sağlığı",
    "Ameliyathane Hizmetleri",
    "Anestezi",
    "Dezenfeksiyon, Sterilizasyon ve Antisepsi Teknikerliği",
    "Dijital Sağlık Sistemleri Teknikerliği",
    "Elektronörofizyoloji",
    "Fizyoterapi",
    "İlk ve Acil Yardım",
    "Odyometri",
    "Ortopedik Protez ve Ortez",
    "Patoloji Laboratuvar Teknikleri",
    "Radyoterapi",
    "Radyoterapi (KKTC Uyruklu)",
    "Tıbbi Dokümantasyon ve Sekreterlik",
    "Tıbbi Görüntüleme Teknikleri",
    "Tıbbi Laboratuvar Teknikleri"
  ],
  "Şehit Ressam Hasan Rıza Güzel Sanatlar Meslek Yüksekokulu": [
    "Geleneksel El Sanatları",
    "Grafik Tasarımı",
    "Kuyumculuk ve Takı Tasarımı",
    "Mimari Dekoratif Sanatlar",
    "Mimari Restorasyon",
    "Seramik ve Cam Tasarımı"
  ],
  "Tıp Fakültesi": [
    "Tıp"
  ],
  "Tunca Meslek Yüksekokulu": [
    "Bilgisayar Programcılığı (Uzaktan Öğretim)",
    "Web Tasarımı ve Kodlama (Uzaktan Öğretim)"
  ],
  "Uygulamalı Bilimler Fakültesi": [
    "Finans ve Bankacılık",
    "Turizm İşletmeciliği",
    "Yönetim Bilişim Sistemleri"
  ],
  "Uzunköprü Meslek Yüksekokulu": [
    "Büro Yönetimi ve Yönetici Asistanlığı",
    "Emlak Yönetimi",
    "İşletme Yönetimi",
    "Maliye",
    "Ofis Teknolojileri ve Veri Yönetimi",
    "Sağlık Kurumları İşletmeciliği",
    "Yerel Yönetimler"
  ],
  "Uzunköprü Uygulamalı Bilimler Yüksekokulu": [
    "Bankacılık ve Sigortacılık",
    "Muhasebe ve Finans Yönetimi"
  ]
}

export const faculties = Object.keys(facultyDepartments);
export const departments = Object.values(facultyDepartments).flat();
export { facultyDepartments };
export default facultyDepartments;