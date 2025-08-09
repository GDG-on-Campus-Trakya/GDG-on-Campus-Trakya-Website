# GDG On Campus Trakya - Website  

Bu repo, GDG On Campus Trakya topluluğunun web sitesini barındırır. Web sitesi, kulüp etkinliklerini ve bilgilerinin dijital ortamda erişilebilir olmasını sağlar.  

## 🚀 Özellikler  

Sitemizde şu işlemleri gerçekleştirebilirsiniz:  
- **Etkinlikler:**  
  - Önümüzdeki etkinlikleri görüntüleyebilir ve kayıt olabilirsiniz.  
  - Geçmiş etkinlikleri inceleyebilirsiniz.  
- **Kulüp Bilgileri:**  
  - Kulüp hakkında bilgi edinebilir, misyonumuzu ve vizyonumuzu öğrenebilirsiniz.  

## 🛠️ Kullanılan Teknolojiler  

Projede aşağıdaki teknolojiler kullanılmıştır:  
- **[Next.js 14](https://nextjs.org/):** Hızlı ve kullanıcı dostu bir React framework'ü.  
- **[Firebase](https://firebase.google.com/):** Authentication, Firestore veritabanı ve hosting çözümleri için.  
- **[Tailwind CSS](https://tailwindcss.com/):** Hızlı ve esnek stil yönetimi için modern CSS framework'ü.  

## 📁 Proje Kurulumu  

Projeyi çalıştırmak için aşağıdaki adımları izleyin:  

1. Reponun bir kopyasını klonlayın:  
   ```bash  
   git clone https://github.com/GDG-on-Campus-Trakya/GDG-on-Campus-Trakya-Website.git  
2. Gerekli bağımlılıkları yükleyin:
   ```bash  
   npm install
3. Gerekli .env.local dosyasını oluşturun ve Firebase yapılandırma bilgilerinizi ekleyin.
   ```bash  
   NEXT_PUBLIC_FIREBASE_API_KEY="API_KEY"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="AUTH_DOMAIN"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="PROJECT_ID"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="STORAGE_BUCKET"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="MESSAGING_SENDER_ID"
   NEXT_PUBLIC_FIREBASE_APP_ID="APP_ID"

   EMAIL_USER="email"
   EMAIL_APP_PASSWORD="password"

   NEXT_PUBLIC_BASE_URL="url"
   IS_DEV=true
4. Geliştirme sunucusunu başlatın:
   ```bash  
   npm run dev
5. Tarayıcınızdan şu URL'yi açarak projeyi görüntüleyebilirsiniz: http://localhost:3000.

## 💻 Katkıda Bulunmak
Katkıda bulunmak isterseniz:
1. Bir fork oluşturun.
2. Yeni bir branch oluşturun:
    ```bash  
    git checkout -b feature/yeni-ozellik  
3. Değişikliklerinizi yapın ve commit edin.
    ```bash  
    git commit -m "Yeni özellik eklendi"  
4. Pull Request gönderin.

## 📧 İletişim
Sorularınız ya da geri bildirimleriniz için bize ulaşabilirsiniz:
- **[Instagram](https://www.instagram.com/gdgoncampustu/)**
- **[LinkedIn](https://www.linkedin.com/company/gdscedirne/posts/?feedView=all)**




