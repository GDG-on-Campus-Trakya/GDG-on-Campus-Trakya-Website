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
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import UserInfo from "../../components/UserInfo";
import EventList from "../../components/EventList";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QRCode from "qrcode";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [qrCodes, setQRCodes] = useState({});
  const [isEmailUpdateLoading, setIsEmailUpdateLoading] = useState(false);
  const [userWantsEmails, setUserWantsEmails] = useState(false);

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

  useEffect(() => {
    const fetchQRCodes = async () => {
      if (registrations.length > 0 && user) {
        const qrCodesData = {};
        for (const registration of registrations) {
          if (registration.qrCodeId) {
            try {
              const qrCodeRef = doc(db, "qrCodes", registration.qrCodeId);
              const qrCodeSnap = await getDoc(qrCodeRef);
              
              if (qrCodeSnap.exists()) {
                // Generate the full URL for the QR code
                const baseUrl = window.location.origin; // Gets the base URL of your website
                const eventId = registration.eventId;
                const qrCodeUrl = `${baseUrl}/events?qrCode=${registration.qrCodeId}`;
                
                // Generate QR code with the full URL
                const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl, {
                  errorCorrectionLevel: "H",
                  margin: 2,
                  width: 400,
                  color: {
                    dark: "#000000",
                    light: "#ffffff"
                  }
                });
                
                qrCodesData[registration.qrCodeId] = qrCodeDataURL;
              }
            } catch (error) {
              console.error("Error fetching QR code:", error);
            }
          }
        }
        setQRCodes(qrCodesData);
      }
    };

    if (user) {
      fetchQRCodes();
    }
  }, [registrations, user]);

  useEffect(() => {
    const fetchUserEmailPreference = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserWantsEmails(userSnap.data().wantsToGetEmails || false);
          }
        } catch (error) {
          console.error("Error fetching user email preference:", error);
        }
      }
    };

    fetchUserEmailPreference();
  }, [user]);

  // Function to remove a registration
  const removeRegistration = async (registrationId) => {
    try {
      const registrationRef = doc(db, "registrations", registrationId);
      const registrationSnap = await getDoc(registrationRef);
  
      if (!registrationSnap.exists()) {
        toast.error("Registration not found.");
        return;
      }
  
      const registrationData = registrationSnap.data();
      const qrCodeId = registrationData.qrCodeId;
  
      // Delete the registration document
      await deleteDoc(registrationRef);
  
      // Delete the associated QR code document if it exists
      if (qrCodeId) {
        await deleteDoc(doc(db, "qrCodes", qrCodeId));
      }
  
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

  // Function to download QR code
  const downloadQRCode = (qrCodeDataURL, eventName) => {
    const link = document.createElement("a");
    link.href = qrCodeDataURL;
    link.download = `${eventName}-registration-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailPreferenceChange = async (newPreference) => {
    setIsEmailUpdateLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { wantsToGetEmails: newPreference }, { merge: true });
      setUserWantsEmails(newPreference);
      toast.success("Email preference updated successfully.");
    } catch (error) {
      console.error("Error updating email preference:", error);
      toast.error("Failed to update email preference.");
    } finally {
      setIsEmailUpdateLoading(false);
    }
  };

  if (loadingAuth || loadingData) {
    return (
      <div className="flex items-center justify-center p-10 text-lg text-white">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (errorAuth) {
    return (
      <div className="flex items-center justify-center p-10 text-lg text-red-500">
        <p>Hata: {errorAuth.message}</p>
      </div>
    );
  }

  if (errorData) {
    return (
      <div className="flex items-center justify-center p-10 text-lg text-red-500">
        <p>Hata: {errorData}</p>
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

      {/* Email Preferences */}
      <div className="mt-10">
        <h2 className="text-2xl border-b-2 border-blue-400 pb-2 mb-5 inline-block">
          Email Tercihleri
        </h2>
        <div className="flex flex-row items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Bildirimleri</Label>
            <p className="text-sm text-gray-400">
              Etkinlikler ve güncellemeler hakkında email alın
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={userWantsEmails}
            onCheckedChange={handleEmailPreferenceChange}
            disabled={isEmailUpdateLoading}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>
        {isEmailUpdateLoading && (
          <p className="mt-2 text-sm text-gray-500">Güncelleniyor...</p>
        )}
      </div>

      {/* Registered Events */}
      <div className="mt-10">
        <h2 className="text-2xl border-b-2 border-blue-400 pb-2 mb-5 inline-block">
          Kayıt Olunmuş Etkinlikler
        </h2>
        <EventList
          registrations={registrations}
          events={events}
          removeRegistration={removeRegistration}
          qrCodes={qrCodes}
          downloadQRCode={downloadQRCode}
        />
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default Profile;
