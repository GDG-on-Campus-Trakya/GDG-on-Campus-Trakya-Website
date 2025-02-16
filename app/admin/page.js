"use client";
// admin/page.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admins
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const router = useRouter();

  // Check if the current user is admin
  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setIsAdmin(true);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking admin privileges:", error);
        router.push("/");
      }
    };

    if (!loading && user) {
      checkAdminPrivileges();
    }
  }, [user, loading, router]);

  // Fetch existing admins
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const adminSnapshot = await getDocs(collection(db, "admins"));
        setAdmins(
          adminSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error("Error fetching admins:", error);
      }
    };

    if (isAdmin) {
      fetchAdmins();
    }
  }, [isAdmin]);

  // Add a new admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    try {
      const adminRef = doc(db, "admins", newAdminEmail);
      await setDoc(adminRef, { email: newAdminEmail });
      setAdmins((prev) => [
        ...prev,
        { id: newAdminEmail, email: newAdminEmail },
      ]);
      setNewAdminEmail("");
    } catch (error) {
      console.error("Error adding admin:", error);
    }
  };

  // Remove an admin
  const handleRemoveAdmin = async (id) => {
    try {
      await deleteDoc(doc(db, "admins", id));
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
    } catch (error) {
      console.error("Error removing admin:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-500">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
        Admin Paneli
      </h1>

      {/* Manage Admins */}
      <section className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
          Adminleri Yönet
        </h2>
        <form onSubmit={handleAddAdmin} className="space-y-4 mb-6">
          <input
            type="email"
            placeholder="Admin Email'i"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Admin Ekle
          </button>
        </form>
        <ul className="space-y-4">
          {admins.map((admin) => (
            <li
              key={admin.id}
              className="flex justify-between items-center bg-gray-50 p-4 rounded-md shadow-sm"
            >
              <div>
                <p className="text-lg font-medium text-gray-800">
                  {admin.email}
                </p>
              </div>
              <button
                onClick={() => handleRemoveAdmin(admin.id)}
                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
              >
                Admin Sil
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Links to other Admin Pages */}
      <section className="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
          Diğer Admin Panelleri
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Link
            href="/admin/events"
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-center hover:bg-blue-600 transition-colors"
          >
            Etkinlikleri Yönet
          </Link>
          <Link
            href="/admin/sponsors"
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-center hover:bg-blue-600 transition-colors"
          >
            Sponsorları Yönet
          </Link>
          <Link
            href="/admin/registrations"
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-center hover:bg-blue-600 transition-colors"
          >
            Etkinlik Kayıtlarını Yönet
          </Link>
          <Link
            href="/admin/users"
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-center hover:bg-blue-600 transition-colors"
          >
            Kullanıcıları Yönet
          </Link>
          <Link
            href="/admin/qr-verification"
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-center hover:bg-blue-600 transition-colors"
          >
            QR Kod Doğrulama
          </Link>
        </div>
      </section>
    </div>
  );
}
