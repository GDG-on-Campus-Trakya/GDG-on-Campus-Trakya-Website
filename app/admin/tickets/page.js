"use client";
import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminTicketsPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const checkAdminPrivileges = async () => {
      if (!user) return;
      try {
        const adminRef = doc(db, "admins", user.email);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          setIsAdmin(true);
          fetchTickets();
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

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
      const { db } = await import("../../../firebase");
      
      const ticketsCollection = collection(db, "tickets");
      
      const snapshot = await getDocs(ticketsCollection);
      const ticketsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
          closedAt: data.closedAt || null // Keep Firestore timestamp for proper display
        };
      });
      
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

  const handleResponse = async (e) => {
    e.preventDefault();
    if (!responseMessage.trim() || !selectedTicket) return;

    setIsSubmitting(true);
    try {
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("../../../firebase");
      
      const newResponse = {
        message: responseMessage,
        adminEmail: user.email,
        createdAt: new Date().toISOString()
      };
      
      const ticketRef = doc(db, "tickets", selectedTicket.id);
      await updateDoc(ticketRef, {
        responses: [...(selectedTicket.responses || []), newResponse],
        updatedAt: serverTimestamp()
      });

      toast.success("Yanıt başarıyla gönderildi!");
      setResponseMessage("");
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      console.error("Error sending response:", error);
      toast.error("Yanıt gönderilirken bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId, action) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("../../../firebase");
      
      const updateData = {
        status: action === 'close' ? 'closed' : 'open',
        updatedAt: serverTimestamp()
      };
      
      // Add closure date when closing
      if (action === 'close') {
        updateData.closedAt = serverTimestamp();
        updateData.closedBy = user.email;
      }
      
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, updateData);

      toast.success(`Bilet başarıyla ${action === 'close' ? 'kapatıldı' : 'açıldı'}!`);
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Durum güncellenirken bir hata oluştu");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm("Bu bileti kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return;
    }

    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../../../firebase");
      
      const ticketRef = doc(db, "tickets", ticketId);
      await deleteDoc(ticketRef);

      toast.success("Bilet başarıyla silindi!");
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Bilet silinirken bir hata oluştu");
    }
  };

  const handlePriorityChange = async (ticketId, newPriority) => {
    try {
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("../../../firebase");
      
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, {
        priority: newPriority,
        updatedAt: serverTimestamp()
      });

      toast.success("Öncelik başarıyla güncellendi!");
      fetchTickets();
    } catch (error) {
      console.error("Error updating priority:", error);
      toast.error("Öncelik güncellenirken bir hata oluştu");
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-900/50 text-red-300 border border-red-700";
      case "medium":
        return "bg-yellow-900/50 text-yellow-300 border border-yellow-700";
      case "low":
        return "bg-green-900/50 text-green-300 border border-green-700";
      default:
        return "bg-gray-700/50 text-gray-300 border border-gray-600";
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case "high":
        return "Yüksek";
      case "medium":
        return "Orta";
      case "low":
        return "Düşük";
      default:
        return "Bilinmiyor";
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = filterStatus === "all" || ticket.status === filterStatus;
    const categoryMatch = filterCategory === "all" || ticket.category === filterCategory;
    return statusMatch && categoryMatch;
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] flex items-center justify-center">
        <div className="text-white text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#000000] flex items-center justify-center">
        <p className="text-lg text-red-400">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <div className="inline-block">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#DB4437] via-[#F4B400] to-[#0F9D58] animate-gradient-x mb-2">
            Bilet Yönetimi
          </h1>
        </div>
        <p className="text-gray-300 mt-4 text-lg">Kullanıcı şikayetleri ve önerilerini yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">Toplam Bilet</p>
            <p className="text-3xl font-bold text-blue-400">{tickets.length}</p>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">Açık Biletler</p>
            <p className="text-3xl font-bold text-yellow-400">
              {tickets.filter(t => t.status === 'open').length}
            </p>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">Kapalı Biletler</p>
            <p className="text-3xl font-bold text-green-400">
              {tickets.filter(t => t.status === 'closed').length}
            </p>
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-300">Şikayetler</p>
            <p className="text-3xl font-bold text-red-400">
              {tickets.filter(t => t.category === 'complaint').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Durum Filtresi
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="open">Açık</option>
              <option value="closed">Kapalı</option>
              <option value="in_progress">İnceleniyor</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Kategori Filtresi
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="complaint">Şikayet</option>
              <option value="suggestion">Öneri</option>
              <option value="technical">Teknik Destek</option>
              <option value="other">Diğer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-8 text-center">
            <p className="text-gray-300 text-lg">Filtrelerinize uygun bilet bulunamadı.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {ticket.subject}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                      {getCategoryText(ticket.category)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority || 'medium')}`}>
                      {getPriorityText(ticket.priority || 'medium')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    <strong>Kullanıcı:</strong> {ticket.userName}
                  </p>
                  <p className="text-sm text-gray-400 mb-1">
                    <strong>Oluşturulma:</strong> {new Date(ticket.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {ticket.status === 'closed' && ticket.closedAt && (
                    <p className="text-sm text-green-400 mb-1">
                      <strong>Kapatılma:</strong> {ticket.closedAt.toDate ? 
                        new Date(ticket.closedAt.toDate()).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        new Date(ticket.closedAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      } {ticket.closedBy && `(${ticket.closedBy})`}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-gray-300 mb-4 text-sm">{ticket.message}</p>

              {/* Responses */}
              {ticket.responses && ticket.responses.length > 0 && (
                <div className="border-t border-gray-700 pt-4 mb-4">
                  <h4 className="font-semibold text-white mb-2 text-sm">Yanıtlar:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {ticket.responses.map((response, index) => (
                      <div
                        key={index}
                        className="bg-blue-900/30 rounded-lg p-3 border-l-4 border-blue-500"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-blue-300 text-sm">
                            Admin
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(response.createdAt).toLocaleDateString('tr-TR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{response.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Yanıtla
                </button>
                {ticket.status === "open" ? (
                  <button
                    onClick={() => handleStatusChange(ticket.id, "close")}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    Kapat
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(ticket.id, "reopen")}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                  >
                    Tekrar Aç
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTicket(ticket.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  title="Bileti kalıcı olarak sil"
                >
                  Sil
                </button>
              </div>

              {/* Priority Selection */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-medium">Öncelik:</span>
                <select
                  value={ticket.priority || 'medium'}
                  onChange={(e) => handlePriorityChange(ticket.id, e.target.value)}
                  className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Bilete Yanıt Ver</h2>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
              <h3 className="font-semibold text-white mb-2">{selectedTicket.subject}</h3>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Kullanıcı:</strong> {selectedTicket.userName}
              </p>
              <p className="text-gray-300">{selectedTicket.message}</p>
            </div>

            <form onSubmit={handleResponse}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Yanıtınız
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-400 resize-none"
                  placeholder="Kullanıcıya yanıt yazın..."
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !responseMessage.trim()}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Gönderiliyor..." : "Yanıt Gönder"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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