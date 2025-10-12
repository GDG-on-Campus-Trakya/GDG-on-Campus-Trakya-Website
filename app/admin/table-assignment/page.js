"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Trash2,
  RefreshCw,
  UserPlus,
  ArrowLeft,
  Table,
  CheckCircle,
  XCircle,
  Shuffle
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole, ROLES } from "../../../utils/roleUtils";

export default function TableAssignmentPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [tables, setTables] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [unassignedParticipants, setUnassignedParticipants] = useState([]);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const router = useRouter();

  // Check admin privileges
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;

      const role = await checkUserRole(user.email);
      if (!role) {
        router.push("/");
        return;
      }

      setUserRole(role);
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  // Initialize sample data for testing
  useEffect(() => {
    if (userRole) {
      // Sample tables
      setTables([
        { id: 1, name: "Masa 1", capacity: 6, participants: [], isActive: true },
        { id: 2, name: "Masa 2", capacity: 6, participants: [], isActive: true },
      ]);
    }
  }, [userRole]);

  const handleAddTable = (tableName, capacity) => {
    const newTable = {
      id: Date.now(),
      name: tableName,
      capacity: parseInt(capacity),
      participants: [],
      isActive: true,
    };
    setTables([...tables, newTable]);
    setShowAddTableModal(false);
    toast.success(`${tableName} eklendi!`);
  };

  const handleRemoveTable = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table.participants.length > 0) {
      if (!confirm("Bu masada katılımcılar var. Masayı kaldırırsanız, katılımcılar atanmamış listesine geri dönecek. Devam etmek istiyor musunuz?")) {
        return;
      }
      // Move participants back to unassigned
      setUnassignedParticipants([...unassignedParticipants, ...table.participants]);
    }
    setTables(tables.filter(t => t.id !== tableId));
    toast.info(`${table.name} kaldırıldı`);
  };

  const handleToggleTableActive = (tableId) => {
    setTables(tables.map(t =>
      t.id === tableId ? { ...t, isActive: !t.isActive } : t
    ));
    const table = tables.find(t => t.id === tableId);
    if (table.isActive) {
      toast.info(`${table.name} dolu olarak işaretlendi`);
    } else {
      toast.success(`${table.name} tekrar aktif`);
    }
  };

  const handleAddParticipant = (participantNames) => {
    // Split by newlines and filter empty lines
    const names = participantNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) {
      toast.error("En az bir katılımcı adı girin!");
      return;
    }

    const newParticipants = names.map((name, index) => ({
      id: Date.now() + index,
      name: name,
      assignedTable: null,
    }));

    setUnassignedParticipants([...unassignedParticipants, ...newParticipants]);
    setShowAddParticipantModal(false);

    if (names.length === 1) {
      toast.success(`${names[0]} eklendi!`);
    } else {
      toast.success(`${names.length} katılımcı eklendi!`);
    }
  };

  const handleRandomAssignment = () => {
    if (unassignedParticipants.length === 0) {
      toast.warning("Atanacak katılımcı yok!");
      return;
    }

    const activeTables = tables.filter(t => t.isActive);
    if (activeTables.length === 0) {
      toast.error("Aktif masa yok! Lütfen önce masa ekleyin veya masaları aktif yapın.");
      return;
    }

    // Check if there's enough capacity
    const totalCapacity = activeTables.reduce((sum, t) => sum + (t.capacity - t.participants.length), 0);
    if (totalCapacity < unassignedParticipants.length) {
      toast.warning("Tüm katılımcılar için yeterli kapasite yok!");
    }

    // Shuffle unassigned participants
    const shuffled = [...unassignedParticipants].sort(() => Math.random() - 0.5);
    const updatedTables = [...tables];
    const remaining = [];

    shuffled.forEach(participant => {
      // Find a table with available capacity
      const availableTable = updatedTables.find(
        t => t.isActive && t.participants.length < t.capacity
      );

      if (availableTable) {
        availableTable.participants.push(participant);
      } else {
        remaining.push(participant);
      }
    });

    setTables(updatedTables);
    setUnassignedParticipants(remaining);

    toast.success(`${shuffled.length - remaining.length} katılımcı rastgele atandı!`);
  };


  const handleRemoveParticipantFromTable = (tableId, participantId) => {
    const table = tables.find(t => t.id === tableId);
    const participant = table.participants.find(p => p.id === participantId);

    const updatedTables = tables.map(t =>
      t.id === tableId
        ? { ...t, participants: t.participants.filter(p => p.id !== participantId) }
        : t
    );

    setTables(updatedTables);
    setUnassignedParticipants([...unassignedParticipants, participant]);
    toast.info(`${participant.name} masadan çıkarıldı`);
  };

  const handleRemoveUnassignedParticipant = (participantId) => {
    const participant = unassignedParticipants.find(p => p.id === participantId);
    if (!confirm(`${participant.name} katılımcısını silmek istediğinizden emin misiniz?`)) {
      return;
    }
    setUnassignedParticipants(unassignedParticipants.filter(p => p.id !== participantId));
    toast.info(`${participant.name} silindi`);
  };

  const handleQuickAddToTable = (tableId, participantName) => {
    if (!participantName.trim()) return;

    const table = tables.find(t => t.id === tableId);

    if (table.participants.length >= table.capacity) {
      toast.error(`${table.name} dolu!`);
      return;
    }

    if (!table.isActive) {
      toast.error(`${table.name} aktif değil!`);
      return;
    }

    const newParticipant = {
      id: Date.now(),
      name: participantName,
      assignedTable: tableId,
    };

    const updatedTables = tables.map(t =>
      t.id === tableId
        ? { ...t, participants: [...t.participants, newParticipant] }
        : t
    );

    setTables(updatedTables);
    toast.success(`${participantName} ${table.name}'e eklendi!`);
  };

  const handleClickToAssign = (participantId, tableId) => {
    const participant = unassignedParticipants.find(p => p.id === participantId);
    const table = tables.find(t => t.id === tableId);

    if (!participant || !table) return;

    if (table.participants.length >= table.capacity) {
      toast.error(`${table.name} dolu!`);
      return;
    }

    if (!table.isActive) {
      toast.error(`${table.name} aktif değil!`);
      return;
    }

    const updatedTables = tables.map(t =>
      t.id === tableId
        ? { ...t, participants: [...t.participants, participant] }
        : t
    );

    setTables(updatedTables);
    setUnassignedParticipants(unassignedParticipants.filter(p => p.id !== participantId));
    toast.success(`${participant.name} ${table.name}'e atandı!`);
  };

  const handleReset = () => {
    if (!confirm("Tüm atamaları sıfırlamak istediğinizden emin misiniz?")) return;

    // Collect all participants from tables
    const allParticipants = tables.reduce((acc, table) => {
      return [...acc, ...table.participants];
    }, []);

    // Clear all tables
    const clearedTables = tables.map(t => ({ ...t, participants: [] }));

    setTables(clearedTables);
    setUnassignedParticipants([...unassignedParticipants, ...allParticipants]);
    toast.success("Tüm atamalar sıfırlandı!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-gray-200">Yükleniyor...</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">Erişim Reddedildi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center space-x-2 text-gray-400 hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Admin Panel</span>
            </button>
            <div className="border-l border-gray-500 h-8"></div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Masa Yerleştirme Çarkı
              </h1>
              <p className="text-gray-300">
                Katılımcıları masalara rastgele veya manuel yerleştirin
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/70 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center">
              <Table className="w-8 h-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Toplam Masa</p>
                <p className="text-2xl font-bold text-gray-100">{tables.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/70 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Aktif Masa</p>
                <p className="text-2xl font-bold text-gray-100">
                  {tables.filter(t => t.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/70 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Atanan</p>
                <p className="text-2xl font-bold text-gray-100">
                  {tables.reduce((sum, t) => sum + t.participants.length, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/70 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center">
              <UserPlus className="w-8 h-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Bekleyen</p>
                <p className="text-2xl font-bold text-gray-100">
                  {unassignedParticipants.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setShowAddTableModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Masa Ekle</span>
          </button>

          <button
            onClick={() => setShowAddParticipantModal(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>Katılımcı Ekle</span>
          </button>

          <button
            onClick={handleRandomAssignment}
            disabled={unassignedParticipants.length === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              unassignedParticipants.length === 0
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            <Shuffle className="w-5 h-5" />
            <span>Rastgele Ata</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Sıfırla</span>
          </button>
        </div>

        {/* Unassigned Participants */}
        {unassignedParticipants.length > 0 && (
          <div className="bg-yellow-900/30 backdrop-blur-lg rounded-xl p-6 border border-yellow-600/50 mb-8">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Atanmamış Katılımcılar ({unassignedParticipants.length})
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Masalara yerleştirmek için "Hızlı Ekle" alanını kullanın veya "Rastgele Ata" butonuna tıklayın
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedParticipants.map(participant => (
                <div
                  key={participant.id}
                  className="bg-gray-800/70 px-3 py-2 rounded-lg text-gray-200 border border-gray-700 flex items-center gap-2 group"
                >
                  <span>{participant.name}</span>
                  <button
                    onClick={() => handleRemoveUnassignedParticipant(participant.id)}
                    className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              onRemove={handleRemoveTable}
              onToggleActive={handleToggleTableActive}
              onRemoveParticipant={handleRemoveParticipantFromTable}
              onQuickAdd={handleQuickAddToTable}
            />
          ))}

          {tables.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="bg-gray-800/70 backdrop-blur-lg rounded-xl p-8 border border-gray-700/50">
                <Table className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-100 mb-2">
                  Henüz masa yok
                </h3>
                <p className="text-gray-400 mb-4">
                  İlk masayı ekleyin ve katılımcıları yerleştirmeye başlayın!
                </p>
                <button
                  onClick={() => setShowAddTableModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Masa Ekle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {showAddTableModal && (
          <AddTableModal
            onClose={() => setShowAddTableModal(false)}
            onAdd={handleAddTable}
          />
        )}

        {showAddParticipantModal && (
          <AddParticipantModal
            onClose={() => setShowAddParticipantModal(false)}
            onAdd={handleAddParticipant}
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
          theme="dark"
        />
      </div>
    </div>
  );
}

// Table Card Component
function TableCard({ table, onRemove, onToggleActive, onRemoveParticipant, onQuickAdd }) {
  const [quickAddName, setQuickAddName] = useState("");
  const fillPercentage = (table.participants.length / table.capacity) * 100;
  const isFull = table.participants.length >= table.capacity;

  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!quickAddName.trim()) return;
    onQuickAdd(table.id, quickAddName);
    setQuickAddName("");
  };

  return (
    <div className={`bg-gray-800/70 backdrop-blur-lg rounded-xl p-6 border ${
      table.isActive ? 'border-gray-700/50' : 'border-red-500/50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">{table.name}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleActive(table.id)}
            className={`p-2 rounded-lg transition-colors ${
              table.isActive
                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
            }`}
            title={table.isActive ? "Dolu olarak işaretle" : "Aktif yap"}
          >
            {table.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onRemove(table.id)}
            className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Doluluk</span>
          <span>{table.participants.length}/{table.capacity}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isFull ? 'bg-red-500' : fillPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </div>

      {/* Quick Add Input */}
      {table.isActive && !isFull && (
        <form onSubmit={handleQuickAddSubmit} className="mb-3">
          <input
            type="text"
            value={quickAddName}
            onChange={(e) => setQuickAddName(e.target.value)}
            placeholder="İsim yazıp Enter'a bas..."
            className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>
      )}

      <div className="space-y-2">
        {table.participants.length > 0 ? (
          table.participants.map(participant => (
            <div
              key={participant.id}
              className="flex items-center justify-between bg-gray-900/50 px-3 py-2 rounded-lg"
            >
              <span className="text-gray-200">{participant.name}</span>
              <button
                onClick={() => onRemoveParticipant(table.id, participant.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">Henüz kimse yok</p>
        )}
      </div>
    </div>
  );
}

// Add Table Modal
function AddTableModal({ onClose, onAdd }) {
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState("6");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tableName.trim()) {
      toast.error("Masa adı gerekli!");
      return;
    }
    if (!capacity || parseInt(capacity) < 1) {
      toast.error("Geçerli bir kapasite girin!");
      return;
    }
    onAdd(tableName, capacity);
    setTableName("");
    setCapacity("6");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-100 mb-4">Yeni Masa Ekle</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Masa Adı
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Örn: Masa 3"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Kapasite
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Participant Modal
function AddParticipantModal({ onClose, onAdd }) {
  const [participantNames, setParticipantNames] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!participantNames.trim()) {
      toast.error("En az bir katılımcı adı girin!");
      return;
    }
    onAdd(participantNames);
    setParticipantNames("");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-100 mb-4">Katılımcı Ekle</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Katılımcı İsimleri
            </label>
            <textarea
              value={participantNames}
              onChange={(e) => setParticipantNames(e.target.value)}
              placeholder="Her satıra bir isim yazın:&#10;Ahmet Yılmaz&#10;Ayşe Demir&#10;Mehmet Kaya"
              rows={6}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Her satıra bir isim yazın. Birden fazla katılımcı ekleyebilirsiniz.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

