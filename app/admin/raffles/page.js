"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { raffleUtils } from "../../../utils/raffleUtils";
import { 
  Trophy, 
  Users, 
  Calendar, 
  Plus, 
  Play, 
  Pause, 
  Award, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminRafflesPage() {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [raffles, setRaffles] = useState([]);
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check admin privileges
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

  // Load data
  useEffect(() => {
    if (isAdmin) {
      loadRaffles();
      loadEvents();
      loadStats();
    }
  }, [isAdmin]);

  const loadRaffles = async () => {
    setIsLoading(true);
    const result = await raffleUtils.getRaffles();
    if (result.success) {
      setRaffles(result.raffles);
    } else {
      toast.error("Çekilişler yüklenirken hata oluştu!");
    }
    setIsLoading(false);
  };

  const loadEvents = async () => {
    try {
      const eventsQuery = query(collection(db, "events"), orderBy("startDate", "desc"));
      const querySnapshot = await getDocs(eventsQuery);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const loadStats = async () => {
    const result = await raffleUtils.getRaffleStats();
    if (result.success) {
      setStats(result.stats);
    }
  };

  const loadParticipants = async (raffleId) => {
    const result = await raffleUtils.getRaffleParticipants(raffleId);
    if (result.success) {
      setParticipants(result.participants);
    }
  };

  const handleCreateRaffle = async (formData) => {
    const selectedEvent = events.find(e => e.id === formData.eventId);
    
    const raffleData = {
      eventId: formData.eventId,
      eventName: selectedEvent?.title || "Bilinmeyen Etkinlik",
      title: formData.title,
      description: formData.description,
      prize: formData.prize,
      startDate: selectedEvent?.startDate || new Date(),
      endDate: new Date(selectedEvent?.startDate?.toDate?.() || selectedEvent?.startDate || new Date()),
      createdBy: user.uid,
    };

    // Set end date to 3 days after event start
    if (raffleData.startDate.toDate) {
      raffleData.endDate = new Date(raffleData.startDate.toDate().getTime() + (3 * 24 * 60 * 60 * 1000));
    } else {
      raffleData.endDate = new Date(raffleData.startDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    }

    const result = await raffleUtils.createRaffle(raffleData);
    if (result.success) {
      toast.success("Çekiliş başarıyla oluşturuldu!");
      loadRaffles();
      setShowCreateModal(false);
    } else {
      toast.error("Çekiliş oluşturulurken hata oluştu!");
    }
  };

  const handleDrawWinner = async (raffleId) => {
    if (!confirm("Çekilişi sonlandırıp kazananı belirlemek istediğinizden emin misiniz?")) return;

    const result = await raffleUtils.drawWinner(raffleId);
    if (result.success) {
      toast.success(`Kazanan: ${result.winner.userEmail}`);
      loadRaffles();
    } else {
      toast.error(result.error || "Kazanan seçilirken hata oluştu!");
    }
  };

  const handleEndRaffle = async (raffleId) => {
    if (!confirm("Çekilişi kazanan seçmeden sonlandırmak istediğinizden emin misiniz?")) return;

    const result = await raffleUtils.endRaffle(raffleId);
    if (result.success) {
      toast.success("Çekiliş sonlandırıldı!");
      loadRaffles();
    } else {
      toast.error("Çekiliş sonlandırılırken hata oluştu!");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-red-500">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Çekiliş Yönetimi
            </h1>
            <p className="text-gray-600">
              Etkinlik çekilişlerini oluşturun ve yönetin
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Çekiliş</span>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Trophy className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Çekiliş</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRaffles}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Aktif Çekiliş</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeRaffles}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedRaffles}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Katılım</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Raffles List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {raffles.length > 0 ? (
              raffles.map((raffle) => (
                <RaffleCard
                  key={raffle.id}
                  raffle={raffle}
                  onDrawWinner={() => handleDrawWinner(raffle.id)}
                  onEndRaffle={() => handleEndRaffle(raffle.id)}
                  onViewParticipants={() => {
                    setSelectedRaffle(raffle);
                    loadParticipants(raffle.id);
                  }}
                  formatDate={formatDate}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-white rounded-lg p-8">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Henüz çekiliş yok
                  </h3>
                  <p className="text-gray-600 mb-4">
                    İlk çekilişi oluşturun ve katılımcıları bekleyin!
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Çekiliş Oluştur
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Raffle Modal */}
        {showCreateModal && (
          <CreateRaffleModal
            events={events}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateRaffle}
          />
        )}

        {/* Participants Modal */}
        {selectedRaffle && (
          <ParticipantsModal
            raffle={selectedRaffle}
            participants={participants}
            onClose={() => setSelectedRaffle(null)}
            formatDate={formatDate}
          />
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
          theme="light"
        />
      </div>
    </div>
  );
}

// Raffle Card Component
function RaffleCard({ raffle, onDrawWinner, onEndRaffle, onViewParticipants, formatDate }) {
  const getStatusColor = () => {
    if (raffle.isCompleted) return "bg-green-500";
    if (raffle.isActive) return "bg-blue-500";
    return "bg-gray-500";
  };

  const getStatusText = () => {
    if (raffle.isCompleted) return "Tamamlandı";
    if (raffle.isActive) return "Aktif";
    return "Pasif";
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{raffle.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          {raffle.eventName}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2" />
          {raffle.participants?.length || 0} katılımcı
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Award className="w-4 h-4 mr-2" />
          {raffle.prize}
        </div>
      </div>

      {raffle.description && (
        <p className="text-gray-600 text-sm mb-4">{raffle.description}</p>
      )}

      {raffle.winner && (
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
          <p className="text-green-800 font-medium">🎉 Kazanan: {raffle.winner}</p>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={onViewParticipants}
          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors text-sm"
        >
          Katılımcıları Gör
        </button>
        
        {raffle.isActive && !raffle.isCompleted && (
          <>
            <button
              onClick={onDrawWinner}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-sm"
            >
              Kazanan Seç
            </button>
            <button
              onClick={onEndRaffle}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors text-sm"
            >
              Sonlandır
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Create Raffle Modal
function CreateRaffleModal({ events, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    eventId: "",
    title: "",
    description: "",
    prize: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.eventId || !formData.title || !formData.prize) {
      toast.error("Lütfen gerekli alanları doldurun!");
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Yeni Çekiliş Oluştur</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etkinlik
            </label>
            <select
              value={formData.eventId}
              onChange={(e) => setFormData({...formData, eventId: e.target.value})}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Etkinlik seçin</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Çekiliş Başlığı
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ödül
            </label>
            <input
              type="text"
              value={formData.prize}
              onChange={(e) => setFormData({...formData, prize: e.target.value})}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama (İsteğe Bağlı)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Participants Modal
function ParticipantsModal({ raffle, participants, onClose, formatDate }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {raffle.title} - Katılımcılar ({participants.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-96">
          {participants.length > 0 ? (
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{participant.userEmail}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(participant.participatedAt)}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz katılımcı yok</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}