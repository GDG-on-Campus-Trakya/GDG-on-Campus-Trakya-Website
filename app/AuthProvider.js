'use client'
import { useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export default function AuthProvider({ children }) {
  const [user, loading] = useAuthState(auth)

  useEffect(() => {
    const createUserDocument = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              name: user.displayName || "New User",
              email: user.email,
              wantsToGetEmails: true,
              language: "tr",
              createdAt: new Date(),
            })
          }
        } catch (error) {
          console.warn("Failed to create user document:", error)
        }
      }
    }

    if (!loading) {
      createUserDocument()
    }
  }, [user, loading])

  return children
}