"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminEventStatsPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [eventStats, setEventStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState({});
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

  // Fetch event statistics
  useEffect(() => {
    const fetchEventStats = async () => {
      if (!isAdmin) return;

      try {
        setIsLoading(true);

        // Fetch all events
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const events = eventsSnapshot.docs.map((doc) => ({
          id: doc.data().id,
          firestoreId: doc.id,
          ...doc.data(),
        }));

        // Fetch all registrations
        const registrationsSnapshot = await getDocs(
          collection(db, "registrations")
        );
        const registrations = registrationsSnapshot.docs.map((doc) => ({
          firestoreId: doc.id,
          ...doc.data(),
        }));

        // Calculate stats for each event
        const stats = await Promise.all(
          events.map(async (event) => {
            const eventRegistrations = registrations.filter(
              (reg) => reg.eventId === event.id
            );
            const verifiedAttendees = eventRegistrations.filter(
              (reg) => reg.didJoinEvent
            );

            // Get user details for all registrants
            const userIds = [
              ...new Set(eventRegistrations.map((reg) => reg.userId)),
            ];
            const usersData = {};

            if (userIds.length > 0) {
              const batchSize = 10;
              for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                const usersQuery = query(
                  collection(db, "users"),
                  where("__name__", "in", batch)
                );
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach((doc) => {
                  usersData[doc.id] = { id: doc.id, ...doc.data() };
                });
              }
            }

            // Combine registration data with user data
            const registrantsDetails = eventRegistrations.map((reg) => ({
              ...reg,
              user: usersData[reg.userId] || {
                id: reg.userId,
                name: "Unknown",
                email: "Unknown",
              },
            }));

            return {
              ...event,
              totalRegistrations: eventRegistrations.length,
              verifiedAttendees: verifiedAttendees.length,
              attendanceRate:
                eventRegistrations.length > 0
                  ? (
                      (verifiedAttendees.length / eventRegistrations.length) *
                      100
                    ).toFixed(1)
                  : 0,
              registrants: registrantsDetails,
            };
          })
        );

        setEventStats(stats);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching event stats:", error);
        setIsLoading(false);
      }
    };

    fetchEventStats();
  }, [isAdmin]);

  const toggleEvent = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  if (loading || isLoading) {
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
        Etkinlik İstatistikleri
      </h1>

      <div className="grid gap-4">
        {eventStats.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <button
              onClick={() => toggleEvent(event.id)}
              className="w-full p-4 sm:p-6 text-left border-b border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-xl sm:text-2xl font-semibold text-gray-800">
                    {event.name}
                  </span>
                  <span
                    className="text-2xl transform transition-transform duration-200"
                    style={{
                      transform: expandedEvents[event.id]
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </div>
                <div className="mt-2 sm:mt-0 text-sm sm:text-base text-gray-600">
                  <span className="font-medium">Tarih:</span>{" "}
                  {new Date(event.date).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {event.time && (
                    <span className="ml-2">
                      <span className="font-medium">Saat:</span> {event.time}
                    </span>
                  )}
                </div>
              </div>
            </button>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedEvents[event.id]
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1">Toplam Kayıt</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {event.totalRegistrations}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 mb-1">
                      Katılım Sağlayan
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {event.verifiedAttendees}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 mb-1">
                      Katılım Oranı
                    </p>
                    <p className="text-2xl font-bold text-purple-700">
                      {event.attendanceRate}%
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Katılımcı
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kayıt Tarihi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Katılım Tarihi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Onaylayan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {event.registrants.map((registrant) => (
                        <tr key={registrant.firestoreId}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {registrant.user.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {registrant.user.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                registrant.didJoinEvent
                                  ? "bg-green-100 text-green-800"
                                  : new Date(event.date) < new Date()
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {registrant.didJoinEvent
                                ? "Katıldı"
                                : new Date(event.date) < new Date()
                                ? "Katılmadı"
                                : "Kayıtlı"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              registrant.signedUpAt?.seconds * 1000
                            ).toLocaleString("tr-TR")}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {registrant.didJoinEvent
                              ? new Date(
                                  registrant.verifiedAt?.seconds * 1000
                                ).toLocaleString("tr-TR")
                              : "-"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {registrant.didJoinEvent
                              ? registrant.verifiedBy || "-"
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
