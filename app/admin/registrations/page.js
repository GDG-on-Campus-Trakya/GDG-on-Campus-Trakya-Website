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
  const [expandedEvents, setExpandedEvents] = useState({});

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

  // Add this function to toggle event expansion
  const toggleEventExpansion = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
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
        Admin Paneli - Etkinlik Kayıtları
      </h1>

      <section className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
          Etkinlik Kayıtlarını Yönet
        </h2>
        {events.length === 0 ? (
          <p className="text-gray-500">Etkinlik bulunamadı.</p>
        ) : (
          <ul className="space-y-4 sm:space-y-6">
            {events.map((event) => {
              const registeredUsers = registrations.filter(
                (reg) => reg.eventId === event.id
              );
              const registrationCount = registeredUsers.length;

              return (
                <li
                  key={event.firestoreId}
                  className="bg-gray-50 rounded-md shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleEventExpansion(event.firestoreId)}
                    className="w-full p-3 sm:p-4 flex justify-between items-start gap-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 break-words w-full">
                        {event.name}
                      </h3>
                      <span className="text-sm text-gray-500 mt-1">
                        {registrationCount} {registrationCount === 1 ? 'registration' : 'registrations'}
                      </span>
                    </div>
                    <span className="text-xl font-medium text-gray-500 w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {expandedEvents[event.firestoreId] ? '−' : '+'}
                    </span>
                  </button>

                  {expandedEvents[event.firestoreId] && (
                    <div className="border-t border-gray-200 p-3 sm:p-4">
                      <ul className="space-y-2 sm:space-y-3">
                        {registrationCount === 0 ? (
                          <p className="text-sm sm:text-base text-gray-500">
                            Bu etkinlik için kayıtlı kullanıcı bulunamadı.
                          </p>
                        ) : (
                          registeredUsers.map((reg) => {
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
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded-md gap-3 sm:gap-0 border border-gray-100"
                              >
                                <div className="w-full sm:w-auto">
                                  <p className="text-sm sm:text-base text-gray-700">
                                    {userData ? `Name: ${userData.name}` : `User ID: ${reg.userId}`}
                                  </p>
                                  <p className="text-sm sm:text-base text-gray-700">
                                    {userData ? `Email: ${userData.email}` : ""}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500">
                                    Kayıt Tarihi: {signedUpDate}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveRegistration(reg.firestoreId)}
                                  className="w-full sm:w-auto bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm"
                                >
                                  Sil
                                </button>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <ToastContainer />
    </div>
  );
}
