"use client"
import Footer from "@/components/Footer";
import Navbar from "../components/Navbar";
import "./globals.css";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect } from "react";

export default function RootLayout({ children }) {
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    const createUserDocument = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // Create a new user document
          await setDoc(userRef, {
            name: user.displayName || "New User",
            email: user.email,
            wantsToGetEmails: true, // Default value
            createdAt: new Date(),
          });
        }
      }
    };

    if (!loading) {
      createUserDocument();
    }
  }, [user, loading]);

  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
