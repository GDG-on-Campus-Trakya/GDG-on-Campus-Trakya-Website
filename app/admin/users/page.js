"use client";
// admin/users/page.js
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../firebase";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  updateDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminUsersPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // Users array
  const [usersList, setUsersList] = useState([]);

  // User form state
  const [userFormData, setUserFormData] = useState({
    firestoreId: "",
    name: "",
    email: "",
    wantsToGetEmails: false,
    createdAt: "",
  });

  const router = useRouter();

  // Check if user is admin
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsersList(
          usersSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              firestoreId: doc.id,
              ...data,
              // Convert Timestamp to string when displaying
              createdAt:
                data.createdAt instanceof Timestamp
                  ? data.createdAt.toDate().toLocaleString()
                  : data.createdAt,
            };
          })
        );
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const isEditing = !!userFormData.firestoreId;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setUserFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setUserFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Reset the form
  const resetUserForm = () => {
    setUserFormData({
      firestoreId: "",
      name: "",
      email: "",
      wantsToGetEmails: false,
      createdAt: "",
    });
  };

  // Create a new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        name: userFormData.name,
        email: userFormData.email,
        wantsToGetEmails: userFormData.wantsToGetEmails,
        createdAt: Timestamp.now(), // Use Timestamp instead of ISO string
      };
      const docRef = await addDoc(collection(db, "users"), newUser);
      setUsersList((prev) => [
        ...prev,
        {
          firestoreId: docRef.id,
          ...newUser,
          createdAt: newUser.createdAt.toDate().toLocaleString(), // Convert for display
        },
      ]);
      resetUserForm();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  // Populate form for editing
  const handleEditUser = (userDoc) => {
    setUserFormData(userDoc);
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, "users", userFormData.firestoreId);
      const updateData = {
        name: userFormData.name,
        email: userFormData.email,
        wantsToGetEmails: userFormData.wantsToGetEmails,
        // Only update createdAt if it's empty or invalid
        ...((!userFormData.createdAt || userFormData.createdAt === "") && {
          createdAt: Timestamp.now(),
        }),
      };

      await setDoc(userRef, updateData, { merge: true });

      setUsersList((prev) =>
        prev.map((usr) =>
          usr.firestoreId === userFormData.firestoreId
            ? {
                ...usr,
                ...updateData,
                createdAt:
                  updateData.createdAt instanceof Timestamp
                    ? updateData.createdAt.toDate().toLocaleString()
                    : usr.createdAt,
              }
            : usr
        )
      );
      resetUserForm();
      toast.success("Kullanıcı başarıyla güncellendi!");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Kullanıcı güncellenirken bir hata oluştu!");
    }
  };

  // Delete user
  const handleDeleteUser = async (firestoreId) => {
    try {
      // First, get all registrations for this user
      const registrationsRef = collection(db, "registrations");
      const registrationsQuery = query(
        registrationsRef,
        where("userId", "==", firestoreId)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);

      // Delete all registrations in a batch
      const batch = writeBatch(db);

      // Add user document to batch delete
      batch.delete(doc(db, "users", firestoreId));

      // Add all registrations to batch delete
      registrationsSnapshot.docs.forEach((registration) => {
        batch.delete(doc(db, "registrations", registration.id));
      });

      // Commit the batch
      await batch.commit();

      setUsersList((prev) =>
        prev.filter((user) => user.firestoreId !== firestoreId)
      );
      toast.success("Kullanıcı ve ilgili kayıtları başarıyla silindi!");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Kullanıcı silinirken bir hata oluştu!");
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
      {/* Back to Admin Panel Button */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ← Admin Paneline Geri Dön
        </Link>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
        Admin Paneli - Kullanıcılar
      </h1>

      {/* Add / Edit User Form */}
      <section className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
          {isEditing ? "Kullanıcı Düzenle" : "Kullanıcı Ekle"}
        </h2>
        <form
          onSubmit={isEditing ? handleUpdateUser : handleAddUser}
          className="space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Kullanıcı Adı"
            value={userFormData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="email"
            name="email"
            placeholder="Kullanıcı Email'i"
            value={userFormData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="wantsToGetEmails"
              checked={userFormData.wantsToGetEmails}
              onChange={handleChange}
              id="wantsEmails"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label
              htmlFor="wantsEmails"
              className="text-gray-700 select-none cursor-pointer"
            >
              Email almak istiyor mu?
            </label>
          </div>

          <button
            type="submit"
            className={`w-full ${
              isEditing ? "bg-yellow-500" : "bg-green-500"
            } text-white py-2 rounded-md`}
          >
            {isEditing ? "Kullanıcı Güncelle" : "Kullanıcı Ekle"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetUserForm}
              className="w-full mt-2 bg-gray-500 text-white py-2 rounded-md"
            >
              İptal Et
            </button>
          )}
        </form>
      </section>

      {/* Display / Manage Users */}
      <section className="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
          Kullanıcıları Yönet
        </h2>
        {usersList.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-500">
            Kullanıcı bulunamadı.
          </p>
        ) : (
          <ul className="space-y-4">
            {usersList.map((usr) => (
              <li
                key={usr.firestoreId}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-md shadow-sm gap-3 sm:gap-0"
              >
                <div className="w-full sm:w-auto">
                  <p className="text-base sm:text-lg font-medium text-gray-800">
                    {usr.name}
                  </p>
                  <p className="text-sm text-gray-600">{usr.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {usr.createdAt}
                  </p>
                  <p className="text-xs">
                    Wants Emails:{" "}
                    <span className="font-semibold">
                      {usr.wantsToGetEmails ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleEditUser(usr)}
                    className="flex-1 sm:flex-none bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors text-sm"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteUser(usr.firestoreId)}
                    className="flex-1 sm:flex-none bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ToastContainer theme="dark" />
    </div>
  );
}
