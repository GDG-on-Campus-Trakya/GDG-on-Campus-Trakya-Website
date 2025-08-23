"use client";
import { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TicketsPage() {
  const [user, loading] = useAuthState(auth);
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    category: "complaint"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }
    
    if (user) {
      fetchUserTickets();
    }
  }, [user, loading, router]);

  const fetchUserTickets = async () => {
    try {
      setIsLoading(true);
      const { collection, getDocs, query, where, orderBy } = await import("firebase/firestore");
      const { db } = await import("../../firebase");
      
      const ticketsQuery = query(
        collection(db, "tickets"),
        where("userEmail", "==", user.email)
      );
      
      const snapshot = await getDocs(ticketsQuery);
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
      }));
      
      // Sort by createdAt in descending order (newest first)
      ticketsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTickets(ticketsData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Biletler yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("../../firebase");
      
      const ticketData = {
        ...formData,
        userEmail: user.email,
        userName: user.displayName || user.email,
        status: "open",
        priority: "medium",
        responses: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "tickets"), ticketData);
      
      toast.success("Biletiniz başarıyla gönderildi!");
      setFormData({ subject: "", message: "", category: "complaint" });
      setShowForm(false);
      fetchUserTickets();
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast.error("Bilet gönderilirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "bg-yellow-900/50 text-yellow-300 border border-yellow-700";
      case "closed":
        return "bg-green-900/50 text-green-300 border border-green-700";
      case "in_progress":
        return "bg-blue-900/50 text-blue-300 border border-blue-700";
      default:
        return "bg-gray-700/50 text-gray-300 border border-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "open":
        return "Açık";
      case "closed":
        return "Kapalı";
      case "in_progress":
        return "İnceleniyor";
      default:
        return "Bilinmiyor";
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case "complaint":
        return "Şikayet";
      case "suggestion":
        return "Öneri";
      case "technical":
        return "Teknik Destek";
      case "other":
        return "Diğer";
      default:
        return "Bilinmiyor";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] flex items-center justify-center">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] flex items-center justify-center">
        <p className="text-lg text-red-400">Bu sayfaya erişim için giriş yapmanız gerekiyor</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12 pt-8 sm:pt-12">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] animate-gradient-x mb-2">
            Şikayetler & Öneriler
          </h1>
        </div>
        <p className="text-gray-300 mt-4 text-lg">Görüşlerinizi bizimle paylaşın</p>
      </div>

      {/* Create Ticket Button */}
      <div className="flex justify-center mb-8 px-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          {showForm ? "Formu Gizle" : "Yeni Bilet Oluştur"}
        </button>
      </div>

      {/* Ticket Form */}
      {showForm && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 sm:p-8 mb-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Yeni Bilet Oluştur</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                required
              >
                <option value="complaint">Şikayet</option>
                <option value="suggestion">Öneri</option>
                <option value="technical">Teknik Destek</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Konu
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
                placeholder="Bilet konusunu girin..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mesaj
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-400 resize-none"
                placeholder="Detaylı açıklama yazın..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Gönderiliyor..." : "Bilet Gönder"}
            </button>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Biletleriniz</h2>
        
        {tickets.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-8 text-center">
            <p className="text-gray-300 text-lg">Henüz hiç bilet oluşturmadınız.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {ticket.subject}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                        {getCategoryText(ticket.category)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-300">{ticket.message}</p>
                </div>

                {/* Responses */}
                {ticket.responses && ticket.responses.length > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="font-semibold text-white mb-3">Yanıtlar:</h4>
                    <div className="space-y-3">
                      {ticket.responses.map((response, index) => (
                        <div
                          key={index}
                          className="bg-blue-900/30 rounded-lg p-4 border-l-4 border-blue-500"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-blue-300">
                              Admin
                            </span>
                            <span className="text-sm text-gray-400">
                              {new Date(response.createdAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-gray-300">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}