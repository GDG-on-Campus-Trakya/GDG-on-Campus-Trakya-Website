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
  writeBatch,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import UserInfo from "../../components/UserInfo";
import EventList from "../../components/EventList";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QRCode from "qrcode";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);

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
                // Use the same QR code format as stored in the database
                const qrCodeData = qrCodeSnap.data().code;

                // Generate QR code with the code from the database
                const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
                  errorCorrectionLevel: "H",
                  margin: 2,
                  width: 400,
                  color: {
                    dark: "#000000",
                    light: "#ffffff",
                  },
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

      // Create a batch
      const batch = writeBatch(db);

      // Add registration document to batch delete
      batch.delete(registrationRef);

      // Add QR code document to batch delete if it exists
      if (qrCodeId) {
        const qrCodeRef = doc(db, "qrCodes", qrCodeId);
        batch.delete(qrCodeRef);
      }

      // Commit the batch
      await batch.commit();

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
      await setDoc(
        userRef,
        { wantsToGetEmails: newPreference },
        { merge: true }
      );
      setUserWantsEmails(newPreference);
      toast.success("Email preference updated successfully.");
    } catch (error) {
      console.error("Error updating email preference:", error);
      toast.error("Failed to update email preference.");
    } finally {
      setIsEmailUpdateLoading(false);
    }
  };

  const handleDeleteClick = (registration) => {
    setRegistrationToDelete(registration);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (registrationToDelete) {
      try {
        await removeRegistration(registrationToDelete.id);
        toast.success("Etkinlik kaydı silindi");
      } catch (error) {
        toast.error("Bir hata oluştu");
      }
    }
    setIsDeleteDialogOpen(false);
    setRegistrationToDelete(null);
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      ref={profileRef}
      className="p-10 bg-gray-900 min-h-screen text-white font-sans"
    >
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center text-4xl mb-10"
      >
        Profiliniz
      </motion.h1>

      {/* User Information */}
      {user && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <UserInfo user={user} />
        </motion.div>
      )}

      {/* Email Preferences */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10"
      >
        <h2 className="text-2xl border-b-2 border-blue-400 pb-2 mb-5 inline-block">
          Email Tercihleri
        </h2>
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="flex flex-row items-center justify-between space-x-4 rounded-lg border p-4"
        >
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
        </motion.div>
        {isEmailUpdateLoading && (
          <p className="mt-2 text-sm text-gray-500">Güncelleniyor...</p>
        )}
      </motion.div>

      {/* Registered Events */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10"
      >
        <h2 className="text-2xl border-b-2 border-blue-400 pb-2 mb-5 inline-block">
          Kayıt Olunmuş Etkinlikler
        </h2>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <EventList
            registrations={registrations}
            events={events}
            removeRegistration={handleDeleteClick}
            qrCodes={qrCodes}
            downloadQRCode={downloadQRCode}
          />
        </motion.div>
      </motion.div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Etkinlik kaydınızı silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-gray-700 hover:bg-gray-600 text-white border-0"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              onClick={handleConfirmDelete}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastContainer />
    </motion.div>
  );
};

export default Profile;
