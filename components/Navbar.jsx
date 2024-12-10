"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const [user, loading] = useAuthState(auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
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
    <nav
      className={`flex items-center justify-between px-8 h-16 ${
        isLandingPage
          ? "bg-gradient-to-b from-gray-900 via-black to-gray-800"
          : "bg-black/70 backdrop-blur-md"
      } text-white sticky top-0 z-50 shadow-lg`}
    >
      {/* Left Side - New Button */}
      <div className="flex items-center">
        <Link href="/">
          <img
            src="/landing-Photoroom.png"
            alt="Home"
            className="w-16 h-16 cursor-pointer"
          />
        </Link>
      </div>

      {/* Middle Links */}
      <div className="flex gap-5 text-sm font-medium">
        <Link href="/about" className="hover:text-blue-400 transition">
          Hakkımızda
        </Link>
        <Link href="/events" className="hover:text-blue-400 transition">
          Etkinlikler
        </Link>
      </div>

      {/* Right Side - User Menu */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative">
            <img
              src={user.photoURL || "/default-profile.png"}
              alt="Profile"
              className="w-8 h-8 rounded-full shadow cursor-pointer"
              onClick={toggleMenu}
            />
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute top-12 right-0 bg-gradient-to-t from-gray-800 to-gray-700 text-white rounded-lg shadow-lg py-2 w-48 z-50"
              >
                <div className="px-4 py-2">
                  <strong>{user.displayName || "User"}</strong>
                  <br />
                  <small className="text-gray-400">{user.email}</small>
                </div>
                <div className="border-t border-gray-700 my-1"></div>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700"
                  onClick={handleProfileClick}
                >
                  Profili Görüntüle
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-700"
                  onClick={handleSignOut}
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Giriş Yap
          </button>
        )}
      </div>
    </nav>
  );
}
