"use client";
// admin/registrations/page.js
import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

export default function AdminRegistrationsPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // data
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  const router = useRouter();

  // check user admin
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

  // fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, "events"));
        setEvents(
          eventsSnapshot.docs.map((doc) => ({
            firestoreId: doc.id,
            ...doc.data(),
          }))
        );

        const registrationsSnapshot = await getDocs(
          collection(db, "registrations")
        );
        const registrationsData = registrationsSnapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }));
        setRegistrations(registrationsData);

        const userIds = registrationsData.map((reg) => reg.userId);
        const uniqueUserIds = [...new Set(userIds)];

        if (uniqueUserIds.length > 0) {
          const usersCollectionRef = collection(db, "users");
          let usersData = {};

          const batchSize = 10;
          for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
            const batch = uniqueUserIds.slice(i, i + batchSize);
            const usersQuery = query(
              usersCollectionRef,
              where("__name__", "in", batch)
            );
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach((doc) => {
              usersData[doc.id] = { ...doc.data() };
            });
          }

          setUsersMap(usersData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // rm a registration
  const handleRemoveRegistration = async (registrationId) => {
    try {
      await deleteDoc(doc(db, "registrations", registrationId));
      setRegistrations((prev) =>
        prev.filter(
          (registration) => registration.firestoreId !== registrationId
        )
      );
      toast.success("Kayıt başarıyla silindi.");
    } catch (error) {
      console.error("Error removing registration:", error);
      toast.error("Kayıt silinirken bir hata oluştu. Lütfen tekrar deneyin.");
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
        Admin Panel - Registrations
      </h1>

      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Manage Registrations
        </h2>
        {events.length === 0 ? (
          <p className="text-gray-500">No events found.</p>
        ) : (
          <ul className="space-y-6">
            {events.map((event) => (
              <li
                key={event.firestoreId}
                className="bg-gray-50 p-4 rounded-md shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {event.name}
                </h3>
                <ul className="space-y-2">
                  {/* Filter registrations */}
                  {registrations.filter((reg) => reg.eventId === event.id)
                    .length === 0 ? (
                    <p className="text-gray-500">
                      No registered users for this event.
                    </p>
                  ) : (
                    registrations
                      .filter((reg) => reg.eventId === event.id)
                      .map((reg) => {
                        const userData = usersMap[reg.userId];
                        const signedUpDate = reg.signedUpAt
                          ? new Date(reg.signedUpAt.seconds * 1000).toLocaleString("tr-TR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Unknown Date";

                        return (
                          <li
                            key={reg.firestoreId}
                            className="flex justify-between items-center bg-gray-100 p-3 rounded-md"
                          >
                            <div>
                              <p className="text-gray-700">
                                {userData ? `Name: ${userData.name}` : `User ID: ${reg.userId}`}
                              </p>
                              <p className="text-gray-700">
                                {userData ? `Email: ${userData.email}` : ""}
                              </p>
                              <p className="text-gray-500 text-sm">
                                Registered on: {signedUpDate}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveRegistration(reg.firestoreId)}
                              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                            >
                              Remove
                            </button>
                          </li>
                        );
                      })
                  )}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
