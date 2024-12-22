"use client";
// profile/page.js
import React, { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import UserInfo from "../../components/UserInfo";
import EventList from "../../components/EventList";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const formatDate = (date) => {
  const d = new Date(date);
  const month = d.toLocaleString("tr-TR", { month: "long" });
  const year = d.getFullYear();
  return `${month} ${year}`;
};

const Profile = () => {
  const [user, loadingAuth, errorAuth] = useAuthState(auth);
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState(null);

  const router = useRouter();
  const profileRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoadingData(false);
        return;
      }

      try {
        const registrationsRef = collection(db, "registrations");
        const registrationsQuery = query(
          registrationsRef,
          where("userId", "==", user.uid)
        );
        const registrationsSnapshot = await getDocs(registrationsQuery);
        const registrationsData = registrationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRegistrations(registrationsData);

        const eventIds = registrationsData.map((reg) => reg.eventId);
        const uniqueEventIds = [...new Set(eventIds)];

        if (uniqueEventIds.length === 0) {
          setEvents([]);
          setLoadingData(false);
          return;
        }

        const eventsData = [];
        for (const id of uniqueEventIds) {
          const eventQuery = query(
            collection(db, "events"),
            where("id", "==", id)
          );
          const eventSnapshot = await getDocs(eventQuery);
          eventSnapshot.forEach((doc) => {
            eventsData.push({ id: doc.id, ...doc.data() });
          });
        }
        setEvents(eventsData);
        setLoadingData(false);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setErrorData("Failed to load profile data. Please try again later.");
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push("/");
    }
  }, [loadingAuth, user, router]);

  // Function to remove a registration
  const removeRegistration = async (registrationId) => {
    try {
      await deleteDoc(doc(db, "registrations", registrationId));

      setRegistrations((prevRegistrations) =>
        prevRegistrations.filter((reg) => reg.id !== registrationId)
      );

      const updatedRegistrations = registrations.filter(
        (reg) => reg.id !== registrationId
      );
      const remainingEventIds = updatedRegistrations.map((reg) => reg.eventId);
      const uniqueRemainingEventIds = [...new Set(remainingEventIds)];

      setEvents((prevEvents) =>
        prevEvents.filter((event) => uniqueRemainingEventIds.includes(event.id))
      );

      toast.success("Kayıt başarıyla silindi.");
    } catch (error) {
      console.error("Error removing registration:", error);
      toast.error("Kayıt silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  if (loadingAuth || loadingData) {
    return (
      <div className="flex items-center justify-center p-10 text-lg text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (errorAuth) {
    return (
      <div className="flex items-center justify-center p-10 text-lg text-red-500">
        <p>Error: {errorAuth.message}</p>
      </div>
    );
  }

  if (errorData) {
    return (
      <div className="flex items-center justify-center p-10 text-lg text-red-500">
        <p>Error: {errorData}</p>
      </div>
    );
  }

  return (
    <div
      ref={profileRef}
      className="p-10 bg-gray-900 min-h-screen text-white font-sans"
    >
      <h1 className="text-center text-4xl mb-10">Profiliniz</h1>

      {/* User Information */}
      {user && <UserInfo user={user} />}

      {/* Registered Events */}
      <div className="mt-10">
        <h2 className="text-2xl border-b-2 border-blue-400 pb-2 mb-5 inline-block">
          Kayıt Olunmuş Etkinlikler
        </h2>
        <EventList
          registrations={registrations}
          events={events}
          removeRegistration={removeRegistration}
        />
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Profile;
