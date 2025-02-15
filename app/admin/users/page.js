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
  Timestamp
} from "firebase/firestore";
import Link from "next/link";

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
              createdAt: data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate().toLocaleString()
                : data.createdAt
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
      setUsersList((prev) => [...prev, { 
        firestoreId: docRef.id, 
        ...newUser,
        createdAt: newUser.createdAt.toDate().toLocaleString() // Convert for display
      }]);
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
        ...((!userFormData.createdAt || userFormData.createdAt === '') && {
          createdAt: Timestamp.now()
        })
      };
      
      await setDoc(userRef, updateData, { merge: true });

      setUsersList((prev) =>
        prev.map((usr) =>
          usr.firestoreId === userFormData.firestoreId
            ? { 
                ...usr, 
                ...updateData,
                createdAt: updateData.createdAt instanceof Timestamp 
                  ? updateData.createdAt.toDate().toLocaleString()
                  : usr.createdAt
              }
            : usr
        )
      );
      resetUserForm();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Delete user
  const handleDeleteUser = async (firestoreId) => {
    try {
      await deleteDoc(doc(db, "users", firestoreId));
      setUsersList((prev) =>
        prev.filter((user) => user.firestoreId !== firestoreId)
      );
    } catch (error) {
      console.error("Error deleting user:", error);
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
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Back to Admin Panel Button */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ← Back to Admin Panel
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Admin Panel - Users
      </h1>

      {/* Add / Edit User Form */}
      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          {isEditing ? "Edit User" : "Add User"}
        </h2>
        <form
          onSubmit={isEditing ? handleUpdateUser : handleAddUser}
          className="space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="User Name"
            value={userFormData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="email"
            name="email"
            placeholder="User Email"
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
              Wants to get emails
            </label>
          </div>

          <button
            type="submit"
            className={`w-full ${
              isEditing ? "bg-yellow-500" : "bg-green-500"
            } text-white py-2 rounded-md`}
          >
            {isEditing ? "Update User" : "Add User"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetUserForm}
              className="w-full mt-2 bg-gray-500 text-white py-2 rounded-md"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </section>

      {/* Display / Manage Users */}
      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Manage Users
        </h2>
        {usersList.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <ul className="space-y-4">
            {usersList.map((usr) => (
              <li
                key={usr.firestoreId}
                className="flex justify-between items-center bg-gray-50 p-4 rounded-md shadow-sm"
              >
                <div>
                  <p className="text-lg font-medium text-gray-800">
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditUser(usr)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(usr.firestoreId)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
