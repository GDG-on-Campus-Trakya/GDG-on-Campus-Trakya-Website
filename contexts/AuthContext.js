'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// Helper function to create user document
const createUserDocument = async (user) => {
  try {
    const { uid, email, displayName } = user;
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: email,
        createdAt: new Date().toISOString(),
        name: displayName,
        wantsToGetEmails: true,
      });
      console.log('✅ User document created');
    }
  } catch (error) {
    console.error('❌ Error creating user document:', error);
  }
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Step 1: Check for redirect result FIRST (as per Firebase best practices)
        console.log('🔍 Checking for redirect result...');
        const result = await getRedirectResult(auth);

        if (result?.user && isMounted) {
          console.log('✅ Redirect login successful:', result.user.email);
          await createUserDocument(result.user);
          setUser(result.user);
          setLoading(false);
          return; // Exit early - we got our user from redirect
        }

        // Step 2: Set up auth state listener AFTER checking redirect
        console.log('👂 Setting up auth state listener...');
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
          if (!isMounted) return;

          console.log('🔥 Auth state changed:', authUser?.email || 'None');

          if (authUser) {
            await createUserDocument(authUser);
          }

          setUser(authUser);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const unsubscribePromise = initializeAuth();

    return () => {
      isMounted = false;
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, []);

  const value = {
    user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}