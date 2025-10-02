"use client";
// components/Navbar.jsx
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { checkUserRole } from "../utils/roleUtils";

function NavbarContent() {
  const [user, loading] = useAuthState(auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userProfilePhoto, setUserProfilePhoto] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  const loginWithGoogle = async () => {
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      // SADECE POPUP KULLAN - HIZLI VE SMOOTH
      const result = await signInWithPopup(auth, googleProvider);

      // Kullanıcı dokümanını oluştur
      if (result?.user) {
        const { uid, email, displayName } = result.user;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: email,
            createdAt: new Date().toISOString(),
            name: displayName,
            wantsToGetEmails: true,
          });
        }
      }
    } catch (error) {
      console.error("Error during sign-in:", error);

      // Kullanıcı dostu hata mesajları
      if (error.code === 'auth/popup-blocked') {
        alert('Popup engellendi! Lütfen tarayıcınızda popup engellemesini kapatın ve tekrar deneyin.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        // Kullanıcı pencereyi kapattı, sessizce işle
        console.log('Kullanıcı popup\'ı kapattı');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Başka bir popup zaten açık
        console.log('Başka bir giriş işlemi devam ediyor');
      } else {
        alert('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Refresh page and redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  };

  const handleProfileClick = () => {
    setProfileMenuOpen(false);
    router.push("/profile");
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
    if (!profileMenuOpen) {
      setMenuOpen(false);
    }
  };
  const isLandingPage = pathname === "/";

  const handleOutsideClick = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
    if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
      setProfileMenuOpen(false);
    }
  };

  // Not needed anymore - using popup only!

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfilePhoto(userData.photoURL || user.photoURL || "/default-profile.png");
          } else {
            setUserProfilePhoto(user.photoURL || "/default-profile.png");
          }

          // Check user role
          const role = await checkUserRole(user.email);
          setUserRole(role);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserProfilePhoto(user.photoURL || "/default-profile.png");
          setUserRole(null);
        }
      } else {
        setUserProfilePhoto(null);
        setUserRole(null);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (menuOpen || profileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen, profileMenuOpen]);

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`${
        isLandingPage
          ? "bg-gradient-to-b from-gray-900 to-gray-900"
          : "bg-black/70 backdrop-blur-md"
      } sticky top-0 z-50 transition-all duration-300`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 md:h-20 text-white">

      {/* Left Side - Mobile Menu Button on small screens, Logo on larger screens */}
      <div className="flex items-center">
        {/* Mobile Menu Button - Visible only on small screens for ALL users */}
        <div className="md:hidden">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMenu}
            onTouchEnd={(e) => {
              e.preventDefault();
              toggleMenu();
            }}
            className="p-2 text-white focus:outline-none touch-manipulation select-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </motion.button>
        </div>

        {/* Logo - Hidden on small screens */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="hidden md:flex items-center"
        >
          <Link href="/">
            <img
              src="/landing-Photoroom.png"
              alt="Home"
              className="w-16 h-16 lg:w-20 lg:h-20 cursor-pointer"
            />
          </Link>
        </motion.div>
      </div>

      {/* Middle Links - Hidden on small screens */}
      <div className="hidden md:flex gap-8 text-base font-medium flex-1 justify-center">
        <Link href="/about">
          <motion.span
            whileHover={{ scale: 1.1, color: "#60A5FA" }}
            className="hover:text-blue-400 transition cursor-pointer"
          >
            Hakkımızda
          </motion.span>
        </Link>
        <Link href="/events">
          <motion.span
            whileHover={{ scale: 1.1, color: "#60A5FA" }}
            className="hover:text-blue-400 transition cursor-pointer"
          >
            Etkinlikler
          </motion.span>
        </Link>
        <Link href="/projects">
          <motion.span
            whileHover={{ scale: 1.1, color: "#60A5FA" }}
            className="hover:text-blue-400 transition cursor-pointer"
          >
            Projeler
          </motion.span>
        </Link>
        {user && (
          <Link href="/game">
            <motion.span
              whileHover={{ scale: 1.1, color: "#A78BFA" }}
              className="hover:text-purple-400 transition cursor-pointer"
            >
              Oyuna Katıl
            </motion.span>
          </Link>
        )}
        {user && (
          <Link href="/social">
            <motion.span
              whileHover={{ scale: 1.1, color: "#F59E0B" }}
              className="hover:text-yellow-400 transition cursor-pointer"
            >
              Sosyal
            </motion.span>
          </Link>
        )}
        {user && (
          <Link href="/tickets">
            <motion.span
              whileHover={{ scale: 1.1, color: "#EF4444" }}
              className="hover:text-red-400 transition cursor-pointer"
            >
              Şikayetler/Öneriler
            </motion.span>
          </Link>
        )}
        {userRole && (
          <Link href="/admin">
            <motion.span
              whileHover={{ scale: 1.1, color: "#10B981" }}
              className="hover:text-green-400 transition cursor-pointer font-semibold"
            >
              Admin Paneli
            </motion.span>
          </Link>
        )}
      </div>

      {/* Right Side - User Menu */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative">
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={userProfilePhoto || "/default-profile.png"}
              alt="Profile"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow cursor-pointer border-2 border-blue-500 touch-manipulation select-none"
              onClick={toggleProfileMenu}
              onTouchEnd={(e) => {
                e.preventDefault();
                toggleProfileMenu();
              }}
            />
            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  ref={profileMenuRef}
                  className="absolute top-10 sm:top-12 right-0 bg-gradient-to-b from-gray-800 to-gray-900 text-white rounded-lg shadow-lg py-2 w-48 sm:w-56 z-[9999] border border-gray-700"
                >
                  <div className="px-3 sm:px-4 py-2 border-b border-gray-700">
                    <p className="font-bold text-blue-400 text-sm sm:text-base truncate">{user.displayName || "User"}</p>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{user.email}</p>
                  </div>
                  
                  <motion.button
                    whileHover={{ backgroundColor: "#374151" }}
                    className="block w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-700 transition-colors text-sm touch-manipulation"
                    onClick={handleProfileClick}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleProfileClick();
                    }}
                  >
                    Profili Görüntüle
                  </motion.button>
                  {userRole && (
                    <motion.button
                      whileHover={{ backgroundColor: "#374151" }}
                      className="block w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-700 transition-colors text-sm touch-manipulation font-semibold text-green-400"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        router.push('/admin');
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        setProfileMenuOpen(false);
                        router.push('/admin');
                      }}
                    >
                      Admin Paneli
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ backgroundColor: "#374151" }}
                    className="block w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-700 transition-colors text-sm touch-manipulation"
                    onClick={handleSignOut}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleSignOut();
                    }}
                  >
                    Çıkış Yap
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loginWithGoogle}
            onTouchEnd={(e) => {
              e.preventDefault();
              loginWithGoogle();
            }}
            className="px-3 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg text-white font-semibold transition duration-300 text-sm sm:text-base touch-manipulation select-none"
          >
            Giriş Yap
          </motion.button>
        )}
      </div>

      {/* Mobile Menu Overlay for all users */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            ref={menuRef}
            className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg z-[9999] border-t border-gray-700"
          >
            <div className="px-4 py-4 space-y-2">
              <motion.div
                whileHover={{ backgroundColor: "#374151" }}
                className="block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation"
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/about');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  router.push('/about');
                }}
              >
                Hakkımızda
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: "#374151" }}
                className="block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation"
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/events');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  router.push('/events');
                }}
              >
                Etkinlikler
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: "#374151" }}
                className="block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation"
                onClick={() => {
                  setMenuOpen(false);
                  router.push('/projects');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  router.push('/projects');
                }}
              >
                Projeler
              </motion.div>
              {user && (
                <motion.div
                  whileHover={{ backgroundColor: "#374151" }}
                  className="block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/game');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    router.push('/game');
                  }}
                >
                  Oyuna Katıl
                </motion.div>
              )}
              {user && (
                <motion.div
                  whileHover={{ backgroundColor: "#374151" }}
                  className="block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/social');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    router.push('/social');
                  }}
                >
                  Sosyal
                </motion.div>
              )}
              {user && (
                <motion.div
                  whileHover={{ backgroundColor: "#374151" }}
                  className="block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/tickets');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    router.push('/tickets');
                  }}
                >
                  Şikayetler/Öneriler
                </motion.div>
              )}
              {userRole && (
                <motion.div
                  whileHover={{ backgroundColor: "#374151" }}
                  className="block w-full text-left py-3 px-4 hover:bg-gray-700 transition-colors rounded touch-manipulation font-semibold text-green-400"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/admin');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setMenuOpen(false);
                    router.push('/admin');
                  }}
                >
                  Admin Paneli
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>
    </motion.div>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div>Loading navigation...</div>}>
      <NavbarContent />
    </Suspense>
  );
}
