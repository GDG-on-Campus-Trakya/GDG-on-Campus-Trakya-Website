"use client";
// admin/events/page.js
import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminEventsPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);

  // Events & Sponsors
  const [events, setEvents] = useState([]);
  const [sponsors, setSponsors] = useState([]);

  // Event form management
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "", // TODO: bunu sonra revize etmeliyiz ama çok da gerek yok
    name: "",
    description: "",
    date: "",
    time: "",
    imageUrl: "",
    location: "",
    sponsors: [],
    category: "Konferans",
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

  // Fetch events & sponsors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsSnapshot = await getDocs(collection(db, "events"));
        const sponsorSnapshot = await getDocs(collection(db, "sponsors"));

        setEvents(
          eventsSnapshot.docs.map((doc) => ({
            firestoreId: doc.id,
            ...doc.data(),
          }))
        );

        setSponsors(
          sponsorSnapshot.docs.map((doc) => ({
            firestoreId: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const newEvent = {
        ...formData,
        id: uuidv4(),
      };
      await addDoc(collection(db, "events"), newEvent);
      toast.success("Etkinlik başarıyla oluşturuldu!");
      resetForm();
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Etkinlik oluşturulurken bir hata oluştu!");
    }
  };

  // Edit event
  const handleEditEvent = (event) => {
    setIsEditing(true);
    setFormData(event);
  };

  // Update event
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      const eventRef = doc(db, "events", String(formData.firestoreId));
      await setDoc(eventRef, { ...formData }, { merge: true });
      toast.success("Etkinlik başarıyla güncellendi!");
      setEvents((prev) =>
        prev.map((event) =>
          event.firestoreId === formData.firestoreId ? formData : event
        )
      );
      resetForm();
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Etkinlik güncellenirken bir hata oluştu!");
    }
  };

  // Delete event
  const handleDeleteEvent = async (firestoreId) => {
    try {
      await deleteDoc(doc(db, "events", firestoreId));
      toast.success("Etkinlik başarıyla silindi!");
      setEvents((prev) =>
        prev.filter((event) => event.firestoreId !== firestoreId)
      );
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Etkinlik silinirken bir hata oluştu!");
    }
  };

  // Reset form
  const resetForm = () => {
    setIsEditing(false);
    setFormData({
      id: "",
      name: "",
      description: "",
      date: "",
      time: "",
      imageUrl: "",
      location: "",
      sponsors: [],
      category: "Konferans",
    });
  };

  // Update this function in your AdminEventsPage component
  const handleSendEmailToRegisteredUsers = async (eventId) => {
    try {
      // Fetch registrations for the event
      const registrationsRef = collection(db, "registrations");
      const registrationsQuery = query(
        registrationsRef,
        where("eventId", "==", eventId)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const registeredUserIds = registrationsSnapshot.docs.map(
        (doc) => doc.data().userId
      );

      if (registeredUserIds.length === 0) {
        alert("No users registered for this event.");
        return;
      }

      // Fetch user emails in batches and filter by wantsToGetEmails
      const usersCollectionRef = collection(db, "users");
      let userEmails = [];
      const batchSize = 10;

      for (let i = 0; i < registeredUserIds.length; i += batchSize) {
        const batch = registeredUserIds.slice(i, i + batchSize);
        const usersQuery = query(
          usersCollectionRef,
          where("__name__", "in", batch),
          where("wantsToGetEmails", "==", true) // Filter users who want to receive emails
        );
        const usersSnapshot = await getDocs(usersQuery);

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.email) {
            userEmails.push(userData.email);
          }
        });
      }

      const event = events.find((e) => e.id === eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Use the correct API route path
      const response = await fetch("/api/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: userEmails,
          subject: `Update: ${event.name}`,
          text: `Dear participant,\n\nThis is an update regarding the event "${event.name}" scheduled for ${event.date} at ${event.time}.\n\nLocation: ${event.location}\n\nThank you for your registration!\n\nBest regards,\nGDG Trakya Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Event Update: ${event.name}</h2>
              <p>Dear participant,</p>
              <p>This is an update regarding the event you registered for:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Location:</strong> ${event.location}</p>
              </div>
              <p>Thank you for your registration!</p>
              <p>Best regards,<br>GDG Trakya Team</p>
            </div>
          `,
          adminEmail: user.email, // Pass admin's email for verification
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send emails");
      }

      alert("Emails sent successfully!");
    } catch (error) {
      console.error("Error sending emails:", error);
      alert(error.message || "Error sending emails. Please try again later.");
    }
  };

  // Function to generate QR code
  const handleGenerateQRCode = async (eventId) => {
    try {
      // Check if a QR code already exists for the event
      const qrCodesRef = collection(db, "eventQrCodes");
      const qrCodeQuery = query(qrCodesRef, where("eventId", "==", eventId));
      const qrCodeSnapshot = await getDocs(qrCodeQuery);

      if (!qrCodeSnapshot.empty) {
        // QR code exists, display it
        const existingQRCodeData = qrCodeSnapshot.docs[0].data();
        const qrCodeId = qrCodeSnapshot.docs[0].id;
        const qrCodeDataURL = await QRCode.toDataURL(existingQRCodeData.code);

        setCurrentQRCodeDataURL(qrCodeDataURL);
        setCurrentQRCodeId(qrCodeId);
        setQRCodeModalOpen(true);
        return;
      }

      // Fetch the event details
      const event = events.find((e) => e.id === eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Call the API route to generate QR code
      const response = await fetch("/api/qrCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: eventId,
          adminEmail: user.email, // Pass admin's email for verification
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to generate QR code");
      }

      const { qrCodeDataURL, qrCodeId } = await response.json();

      // Display the QR code to the admin (you can use a modal or a new page)
      setCurrentQRCodeDataURL(qrCodeDataURL);
      setCurrentQRCodeId(qrCodeId);
      setQRCodeModalOpen(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert(
        error.message || "Error generating QR code. Please try again later."
      );
    }
  };

  const [qrCodeModalOpen, setQRCodeModalOpen] = useState(false);
  const [currentQRCodeDataURL, setCurrentQRCodeDataURL] = useState("");
  const [currentQRCodeId, setCurrentQRCodeId] = useState("");

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
        Admin Paneli - Etkinlikler
      </h1>

      {/* Add / Edit Event Form */}
      <section className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          {isEditing ? "Etkinlik Düzenle" : "Etkinlik Ekle"}
        </h2>
        <form
          onSubmit={isEditing ? handleUpdateEvent : handleAddEvent}
          className="space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Etkinlik Adı"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="description"
            placeholder="Etkinlik Açıklaması"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            name="date"
            placeholder="Etkinlik Tarihi"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="time"
            name="time"
            placeholder="Etkinlik Saati"
            value={formData.time}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="url"
            name="imageUrl"
            placeholder="Resim URL'si"
            value={formData.imageUrl}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="location"
            placeholder="Konum"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Category Dropdown */}
          <div>
            <label htmlFor="category" className="block text-gray-700 mb-2">
              Kategori
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Konferans">Konferans</option>
              <option value="DevFest">DevFest</option>
              <option value="Gezi">Gezi</option>
              <option value="Eğitim">Eğitim</option>
            </select>
          </div>

          {/* Sponsors Dropdown */}
          <div>
            <label htmlFor="sponsors" className="block text-gray-700 mb-2">
              Sponsorlar
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-left"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                Sponsor Seç
              </button>
              {isDropdownOpen && (
                <ul className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 w-full overflow-auto">
                  {sponsors.map((sponsor) => (
                    <li
                      key={sponsor.firestoreId}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        if (!formData.sponsors.includes(sponsor.firestoreId)) {
                          setFormData((prev) => ({
                            ...prev,
                            sponsors: [...prev.sponsors, sponsor.firestoreId],
                          }));
                        }
                        setIsDropdownOpen(false);
                      }}
                    >
                      {sponsor.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Display selected sponsors */}
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.sponsors.map((sponsorId, index) => {
                const sponsor = sponsors.find(
                  (s) => s.firestoreId === sponsorId
                );
                return (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-gray-200 text-sm rounded-md"
                  >
                    {sponsor?.name || "Unknown Sponsor"}
                    <button
                      type="button"
                      className="ml-2 text-red-500"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          sponsors: prev.sponsors.filter(
                            (id) => id !== sponsorId
                          ),
                        }))
                      }
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className={`w-full ${
              isEditing ? "bg-yellow-500" : "bg-green-500"
            } text-white py-2 rounded-md hover:bg-${
              isEditing ? "yellow-600" : "green-600"
            } transition-colors`}
          >
            {isEditing ? "Etkinlik Güncelle" : "Etkinlik Ekle"}
          </button>
        </form>
      </section>

      {/* Manage Events */}
      <section className="bg-white shadow-md rounded-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
          Etkinlikleri Yönet
        </h2>
        {events.length === 0 ? (
          <p className="text-gray-500">Etkinlik bulunamadı.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li
                key={event.firestoreId}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-md shadow-sm gap-4 sm:gap-2"
              >
                <div className="w-full sm:w-auto">
                  <p className="text-lg font-medium text-gray-800">
                    {event.name}
                  </p>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="flex-1 sm:flex-none bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors text-sm"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.firestoreId)}
                    className="flex-1 sm:flex-none bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    Sil
                  </button>
                  <button
                    onClick={() => handleSendEmailToRegisteredUsers(event.id)}
                    className="flex-1 sm:flex-none bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors text-sm"
                  >
                    Email Gönder
                  </button>
                  <button
                    onClick={() => handleGenerateQRCode(event.id)}
                    className="flex-1 sm:flex-none bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors text-sm"
                  >
                    QR Kodu Oluştur
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* QR Code Modal */}
      {qrCodeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-4">QR Kodu</h2>
            <img src={currentQRCodeDataURL} alt="QR Kodu" className="w-full" />
            <p className="mt-4 text-gray-600">QR Kodu ID: {currentQRCodeId}</p>
            <button
              onClick={() => setQRCodeModalOpen(false)}
              className="mt-6 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      <ToastContainer theme="dark" />
    </div>
  );
}
