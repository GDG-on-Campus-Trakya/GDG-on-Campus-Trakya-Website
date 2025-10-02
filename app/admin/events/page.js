"use client";
// admin/events/page.js
import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase";
import ImageUpload from "../../../components/ImageUpload";
import { StoragePaths } from "../../../utils/storageUtils";
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

  // Auto-refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // Event form management
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("current"); // 'current' or 'archive'
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
    file_url: "",
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

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, refreshKey]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  // Helper functions for event categorization
  const isEventArchived = (eventDate) => {
    if (!eventDate) return false;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(eventDate) < oneWeekAgo;
  };

  const getCurrentEvents = () => {
    return events.filter((event) => !isEventArchived(event.date));
  };

  const getArchivedEvents = () => {
    return events.filter((event) => isEventArchived(event.date));
  };

  // Form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image upload
  const handleImageUpload = (imageData) => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: imageData.url,
      imagePath: imageData.path,
    }));
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
    if (
      !confirm(
        "Bu etkinliği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      )
    )
      return;

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
      file_url: "",
    });
  };

  // Update this function in your AdminEventsPage component
  const handleSendEmailToRegisteredUsers = async (eventId) => {
    try {
      // Rate limiting: Check last email sent time for this event
      const emailLogRef = doc(db, "emailLogs", eventId);
      const emailLogSnap = await getDoc(emailLogRef);

      if (emailLogSnap.exists()) {
        const lastSentAt = emailLogSnap.data().lastSentAt.toDate();
        const now = new Date();
        const timeDiff = now - lastSentAt;
        const hoursSinceLastSent = timeDiff / (1000 * 60 * 60); // Convert to hours

        // Minimum 1 hour between email sends for same event
        if (hoursSinceLastSent < 1) {
          const remainingMinutes = Math.ceil((60 - (hoursSinceLastSent * 60)));
          toast.error(`Bu etkinlik için son email gönderiminden ${remainingMinutes} dakika sonra tekrar email gönderebilirsiniz.`);
          return;
        }
      }
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

      // Log successful email send with timestamp
      await setDoc(emailLogRef, {
        eventId: eventId,
        lastSentAt: new Date(),
        sentBy: user.email,
        recipientCount: userEmails.length,
      });

      toast.success("Email'ler başarıyla gönderildi!");
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

      // Get Firebase ID token for secure authentication
      const idToken = await user.getIdToken();

      // Call the API route to generate QR code
      const response = await fetch("/api/qrCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`, // Secure authentication
        },
        body: JSON.stringify({
          eventId: eventId,
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

  // Modal scroll lock effect
  useEffect(() => {
    if (qrCodeModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [qrCodeModalOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-200">Loading...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      {/* Back to Admin Panel Button */}
      <div className="mb-6 sm:mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center px-4 py-3 text-sm sm:text-base bg-gray-800/70 backdrop-blur-lg text-gray-200 rounded-2xl hover:bg-gray-700/90 transition-all duration-300 border border-gray-700/50 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Admin Paneline Geri Dön
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Etkinlik Yönetimi
          </h1>
          <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 rounded-full"></div>
        </div>
        <p className="text-gray-300 mt-4 text-lg">
          Tüm etkinlikleri görüntüleyin ve yönetin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">
                Aktif Etkinlik
              </p>
              <p className="text-3xl font-bold text-blue-400">
                {getCurrentEvents().length}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Arşivlenen</p>
              <p className="text-3xl font-bold text-orange-400">
                {getArchivedEvents().length}
              </p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8l6 6m0 0l6-6m-6 6V3"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Sponsorlu</p>
              <p className="text-3xl font-bold text-purple-400">
                {
                  getCurrentEvents().filter(
                    (e) => e.sponsors && e.sponsors.length > 0
                  ).length
                }
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l5.5-3.5L16 21z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Kategoriler</p>
              <p className="text-3xl font-bold text-cyan-400">
                {new Set(getCurrentEvents().map((e) => e.category)).size}
              </p>
            </div>
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <svg
                className="w-6 h-6 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-2 mb-8 border border-gray-700/50 shadow-xl">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "current"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105"
                : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            Aktif Etkinlikler ({getCurrentEvents().length})
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "archive"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105"
                : "text-gray-300 hover:bg-gray-700/50"
            }`}
          >
            Arşiv ({getArchivedEvents().length})
          </button>
        </div>
      </div>

      {/* Add / Edit Event Form */}
      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 mb-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mr-3">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
            {isEditing ? "Etkinlik Düzenle" : "Yeni Etkinlik Ekle"}
          </h2>
        </div>
        <form
          onSubmit={isEditing ? handleUpdateEvent : handleAddEvent}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Etkinlik Adı *
              </label>
              <input
                type="text"
                name="name"
                placeholder="Etkinlik adını girin..."
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Kategori *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200"
              >
                <option value="Konferans">Konferans</option>
                <option value="DevFest">DevFest</option>
                <option value="Gezi">Gezi</option>
                <option value="Eğitim">Eğitim</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Açıklama *
            </label>
            <textarea
              name="description"
              placeholder="Etkinlik açıklamasını girin..."
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200 placeholder-gray-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Tarih *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Saat *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Konum *
              </label>
              <input
                type="text"
                name="location"
                placeholder="Etkinlik konumunu girin..."
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Etkinlik Resmi
            </label>
            <div className="bg-gray-700/40 rounded-xl p-4">
              <ImageUpload
                onImageUpload={handleImageUpload}
                currentImageUrl={formData.imageUrl}
                folder={StoragePaths.EVENTS}
                prefix="event_"
                placeholder="Etkinlik Resmi Yükle"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Doküman URL'si
            </label>
            <input
              type="url"
              name="file_url"
              placeholder="https://example.com/document.pdf"
              value={formData.file_url}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-gray-700/80 transition-all duration-300 text-gray-200 placeholder-gray-500"
            />
          </div>

          {/* Sponsors Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Sponsorlar
            </label>
            <div className="bg-gray-700/40 rounded-xl p-4">
              <div className="relative">
                <button
                  type="button"
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border-2 border-transparent rounded-2xl text-left text-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-300"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {formData.sponsors.length > 0
                    ? `${formData.sponsors.length} sponsor seçildi`
                    : "Sponsor seçin"}
                  <svg
                    className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute z-20 mt-2 bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl max-h-60 w-full overflow-auto">
                    {sponsors.map((sponsor) => (
                      <div
                        key={sponsor.firestoreId}
                        className="px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors duration-200"
                        onClick={() => {
                          if (
                            !formData.sponsors.includes(sponsor.firestoreId)
                          ) {
                            setFormData((prev) => ({
                              ...prev,
                              sponsors: [...prev.sponsors, sponsor.firestoreId],
                            }));
                          }
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={sponsor.img_url}
                            alt={sponsor.name}
                            className="w-8 h-8 object-contain rounded-lg"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                          <span className="font-medium text-gray-200">{sponsor.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Display selected sponsors */}
              {formData.sponsors.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {formData.sponsors.map((sponsorId, index) => {
                    const sponsor = sponsors.find(
                      (s) => s.firestoreId === sponsorId
                    );
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-2 bg-blue-500/20 text-blue-800 text-sm rounded-xl font-medium"
                      >
                        {sponsor?.name || "Bilinmeyen Sponsor"}
                        <button
                          type="button"
                          className="ml-2 text-blue-400 hover:text-blue-800 font-bold"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              sponsors: prev.sponsors.filter(
                                (id) => id !== sponsorId
                              ),
                            }))
                          }
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                isEditing
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
                  : "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600"
              }`}
            >
              {isEditing ? "Etkinlik Güncelle" : "Etkinlik Ekle"}
            </button>
          </div>
        </form>
      </section>

      {/* Manage Events */}
      <section className="bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-700/50 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-100">
              Tüm Etkinlikler ({events.length})
            </h2>
          </div>
        </div>

        {(() => {
          const displayEvents =
            activeTab === "current" ? getCurrentEvents() : getArchivedEvents();

          if (displayEvents.length === 0) {
            return (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-900 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-gray-400 mb-2">
                  {activeTab === "current"
                    ? "Henüz aktif etkinlik bulunmuyor"
                    : "Arşivlenmiş etkinlik bulunmuyor"}
                </p>
                <p className="text-sm text-gray-400">
                  {activeTab === "current"
                    ? "İlk etkinliği eklemek için yukarıdaki formu kullanın"
                    : "1 haftadan eski etkinlikler burada görünür"}
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {displayEvents.map((event) => {
                const isArchived = isEventArchived(event.date);
                return (
                  <div
                    key={event.firestoreId}
                    className="bg-gray-700/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/30 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Event Info */}
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          {event.imageUrl && (
                            <img
                              src={event.imageUrl}
                              alt={event.name}
                              className="w-16 h-16 rounded-xl object-cover border border-gray-600"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                              <h3 className="text-xl font-bold text-gray-100 mb-1">
                                {event.name}
                              </h3>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  event.category === "DevFest"
                                    ? "bg-purple-500/20 text-purple-800"
                                    : event.category === "Konferans"
                                    ? "bg-blue-500/20 text-blue-800"
                                    : event.category === "Gezi"
                                    ? "bg-green-500/20 text-green-800"
                                    : "bg-yellow-500/20 text-yellow-800"
                                }`}
                              >
                                {event.category}
                              </span>
                            </div>
                            <p className="text-gray-300 mb-3 line-clamp-2">
                              {event.description}
                            </p>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1 text-blue-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {event.date} - {event.time}
                              </div>
                              <div className="flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                {event.location}
                              </div>
                              {event.sponsors && event.sponsors.length > 0 && (
                                <div className="flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-1 text-purple-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l5.5-3.5L16 21z"
                                    />
                                  </svg>
                                  {event.sponsors.length} sponsor
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48">
                        <button
                          onClick={() => handleEditEvent(event)}
                          disabled={isArchived}
                          className={`flex-1 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 shadow-md hover:shadow-lg ${
                            isArchived
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105"
                          }`}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.firestoreId)}
                          className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg font-medium text-sm"
                        >
                          Sil
                        </button>
                        <button
                          onClick={() =>
                            handleSendEmailToRegisteredUsers(event.id)
                          }
                          disabled={isArchived}
                          className={`flex-1 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 shadow-md ${
                            isArchived
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 hover:shadow-lg"
                          }`}
                          title={
                            isArchived
                              ? "Arşivlenen etkinlikler için email gönderilemez"
                              : ""
                          }
                        >
                          Email Gönder
                        </button>
                        <button
                          onClick={() => handleGenerateQRCode(event.id)}
                          disabled={isArchived}
                          className={`flex-1 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 shadow-md ${
                            isArchived
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600 transform hover:scale-105 hover:shadow-lg"
                          }`}
                          title={
                            isArchived
                              ? "Arşivlenen etkinlikler için QR kod oluşturulamaz"
                              : ""
                          }
                        >
                          QR Kodu
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* QR Code Modal */}
      {qrCodeModalOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          style={{ overscrollBehavior: 'contain' }}
          onClick={() => setQRCodeModalOpen(false)}
        >
          <div 
            className="bg-gray-700/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-700/50"
            style={{ overscrollBehavior: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mr-3">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-100">QR Kodu</h2>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6 mb-6 shadow-inner border border-gray-100">
                <img
                  src={currentQRCodeDataURL}
                  alt="QR Kodu"
                  className="w-full max-w-xs mx-auto rounded-xl shadow-lg"
                />
              </div>

              <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl p-4 mb-6">
                <p className="text-sm text-gray-300 font-medium">QR Kodu ID:</p>
                <p className="text-lg font-bold text-gray-100 font-mono">
                  {currentQRCodeId}
                </p>
              </div>

              <button
                onClick={() => setQRCodeModalOpen(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-2xl hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer theme="dark" />
    </div>
  );
}
