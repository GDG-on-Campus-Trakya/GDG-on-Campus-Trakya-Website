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

function NavbarContent() {
  const [user, loading] = useAuthState(auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { uid, email, name } = result.user;

      const userRef = doc(db, "users", uid);

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: email,
          createdAt: new Date().toISOString(),
          name: name,
          wantsToGetEmails: true,
        });
        console.log("New user saved to Firestore");
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  };

  const handleProfileClick = () => {
    setMenuOpen(false);
    router.push("/profile");
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const isLandingPage = pathname === "/";

  const handleOutsideClick = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`flex items-center justify-between px-8 h-20 ${
        isLandingPage
          ? "bg-gradient-to-b from-gray-900 to-gray-900"
          : "bg-black/70 backdrop-blur-md"
      } text-white sticky top-0 z-50 transition-all duration-300`}
    >
      {/* Left Side - Logo */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="flex items-center"
      >
        <Link href="/">
          <img
            src="/landing-Photoroom.png"
            alt="Home"
            className="w-20 h-20 cursor-pointer"
          />
        </Link>
      </motion.div>

      {/* Middle Links */}
      <div className="flex gap-8 text-base font-medium">
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
      </div>

      {/* Right Side - User Menu */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative">
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={user.photoURL || "/default-profile.png"}
              alt="Profile"
              className="w-10 h-10 rounded-full shadow cursor-pointer border-2 border-blue-500"
              onClick={toggleMenu}
            />
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  ref={menuRef}
                  className="absolute top-12 right-0 bg-gradient-to-b from-gray-800 to-gray-900 text-white rounded-lg shadow-lg py-2 w-56 z-50"
                >
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="font-bold text-blue-400">{user.displayName || "User"}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  <motion.button
                    whileHover={{ backgroundColor: "#374151" }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                    onClick={handleProfileClick}
                  >
                    Profili Görüntüle
                  </motion.button>
                  <motion.button
                    whileHover={{ backgroundColor: "#374151" }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                    onClick={handleSignOut}
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
            onClick={handleGoogleSignIn}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg text-white font-semibold transition duration-300"
          >
            Giriş Yap
          </motion.button>
        )}
      </div>
    </motion.nav>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div>Loading navigation...</div>}>
      <NavbarContent />
    </Suspense>
  );
}
