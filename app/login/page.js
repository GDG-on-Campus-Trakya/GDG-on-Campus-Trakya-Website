"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, googleProvider } from "../../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const router = useRouter();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if email is verified
        if (!result.user.emailVerified) {
          setError("Lütfen email adresinizi doğrulayın. Email kutunuzu kontrol edin.");
          await auth.signOut(); // Sign out the user
          setLoading(false);
          return;
        }
      } else {
        if (!name.trim()) {
          setError("Lütfen adınızı girin");
          setLoading(false);
          return;
        }
        
        result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Send email verification
        await sendEmailVerification(result.user);
        
        const userRef = doc(db, "users", result.user.uid);
        await setDoc(userRef, {
          name: name.trim(),
          email: email,
          createdAt: new Date().toISOString(),
          wantsToGetEmails: true,
        });
        
        // Sign out the user and show verification message
        await auth.signOut();
        setVerificationEmailSent(true);
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error("Authentication error:", error);
      }
      
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("Bu email adresi zaten kullanımda");
          break;
        case "auth/invalid-email":
          setError("Geçersiz email adresi");
          break;
        case "auth/weak-password":
          setError("Şifre en az 8 karakter olmalı ve 1 küçük harf, 1 rakam içermelidir");
          break;
        case "auth/user-not-found":
          setError("Kullanıcı bulunamadı");
          break;
        case "auth/wrong-password":
          setError("Hatalı şifre");
          break;
        case "auth/invalid-credential":
          setError("Email veya şifre hatalı");
          break;
        case "auth/too-many-requests":
          setError("Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin");
          break;
        default:
          setError("Bir hata oluştu. Lütfen tekrar deneyin");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, googleProvider);

      if (result?.user) {
        const { uid, email, displayName } = result.user;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: email,
            createdAt: new Date().toISOString(),
            name: displayName || "New User",
            wantsToGetEmails: true,
          });
        }
      }

      router.push("/");
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error("Google sign-in error:", error);
      }
      
      if (error.code === 'auth/popup-blocked') {
        setError('Popup engellendi! Lütfen tarayıcınızda popup engellemesini kapatın.');
      } else if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        setError('Google ile giriş yapılırken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Lütfen email adresinizi girin");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    } catch (error) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error("Password reset error:", error);
      }
      
      switch (error.code) {
        case "auth/user-not-found":
          setError("Bu email adresi kayıtlı değil");
          break;
        case "auth/invalid-email":
          setError("Geçersiz email adresi");
          break;
        default:
          setError("Şifre sıfırlama emaili gönderilemedi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-[#1a1a2e] to-[#000000]">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-32">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-10">
            <Link href="/">
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                src="/landing-Photoroom.png"
                alt="GDG Logo"
                className="h-14 w-auto cursor-pointer"
              />
            </Link>
          </div>

          {/* Başlık */}
          <div className="mb-8">
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl lg:text-4xl font-bold text-white mb-2"
            >
              {isLogin ? "Hoş Geldiniz !" : "Hesap Oluştur"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400"
            >
              {isLogin ? "Lütfen bilgilerinizi girin" : "Başlamak için kayıt olun"}
            </motion.p>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition backdrop-blur-sm"
                  placeholder="Adınızı ve soyadınızı girin"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition backdrop-blur-sm"
                placeholder="Email adresinizi girin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition backdrop-blur-sm"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  maxLength={24}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-400 mt-2">
                  8-24 karakter arası, en az 1 küçük harf ve 1 rakam içermelidir
                </p>
              )}
            </div>

            {/* Remember me & Forgot Password */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-300">Beni hatırla</span>
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  disabled={loading}
                >
                  Şifremi Unuttum?
                </button>
              </div>
            )}

            {/* Hata Mesajı */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Başarı Mesajı */}
            {resetEmailSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
              >
                Şifre sıfırlama emaili gönderildi! Lütfen email kutunuzu kontrol edin.
              </motion.div>
            )}

            {/* Email Doğrulama Mesajı */}
            {verificationEmailSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm"
              >
                Kayıt başarılı! Email doğrulama linki gönderildi. Lütfen email kutunuzu kontrol edin ve doğrulama linkine tıklayın. Ardından giriş yapabilirsiniz.
              </motion.div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                "Lütfen bekleyin..."
              ) : (
                <>
                  {isLogin ? "Giriş Yap" : "Kayıt Ol"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-gray-400">veya</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-gray-800/50 border border-gray-700/50 text-white py-3 rounded-lg font-medium hover:bg-gray-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 backdrop-blur-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google ile Devam Et
          </button>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {isLogin ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setResetEmailSent(false);
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                {isLogin ? "Kayıt Ol" : "Giriş Yap"}
              </button>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-6 text-center text-xs text-gray-500">
            Hesap oluşturarak{" "}
            <Link href="/terms" className="text-blue-400 hover:underline">
              Kullanım Şartları
            </Link>{" "}
            ve{" "}
            <Link href="/privacy" className="text-blue-400 hover:underline">
              Gizlilik Politikası
            </Link>
            'nı kabul etmiş olursunuz.
          </div>
        </motion.div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 items-center justify-center p-12 relative overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl"
          >
            {/* Logo/Image */}
            <div className="mb-8 flex justify-center">
              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <img
                  src="/landing-Photoroom.png"
                  alt="GDG Illustration"
                  className="w-48 h-48 object-contain drop-shadow-2xl"
                />
              </motion.div>
            </div>

            {/* Text Content */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-4xl font-bold text-white mb-4 text-center"
            >
              GDG On Campus Trakya'ya Hoş Geldiniz
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-white/90 text-lg text-center leading-relaxed"
            >
              Teknoloji ve inovasyonun buluşma noktası. Etkinlikler, projeler ve daha fazlası için hemen üye olun!
            </motion.p>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-8">
              <div className="w-8 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white/50 rounded-full"></div>
              <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            </div>
          </motion.div>

          {/* Floating Elements */}
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm"
          />
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-10 right-10 w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm"
          />
        </div>
      </div>
    </div>
  );
}
