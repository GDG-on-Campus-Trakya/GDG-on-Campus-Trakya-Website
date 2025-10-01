"use client";
import { useEffect, useState } from "react";
import { auth } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole } from "../../../utils/roleUtils";
import {
  createDataset,
  getAllDatasets,
  deleteDataset,
  addItemToDataset,
  removeItemFromDataset,
  uploadItemImage
} from "../../../utils/datasetUtils";

export default function AdminDatasetsPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [datasetName, setDatasetName] = useState("");
  const [datasetDescription, setDatasetDescription] = useState("");

  // Selected dataset for editing
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemImage, setNewItemImage] = useState(null);
  const [newItemPreview, setNewItemPreview] = useState(null);
  const [addingItem, setAddingItem] = useState(false);

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

  useEffect(() => {
    if (userRole) {
      loadDatasets();
    }
  }, [userRole]);

  const loadDatasets = async () => {
    try {
      setLoadingDatasets(true);
      const allDatasets = await getAllDatasets();
      setDatasets(allDatasets);
    } catch (error) {
      console.error("Error loading datasets:", error);
      toast.error("Veri setleri yüklenemedi!");
    } finally {
      setLoadingDatasets(false);
    }
  };

  const handleCreateDataset = async (e) => {
    e.preventDefault();

    if (!datasetName.trim()) {
      toast.error("Lütfen bir isim girin!");
      return;
    }

    try {
      setCreating(true);
      await createDataset({
        name: datasetName.trim(),
        description: datasetDescription.trim(),
        createdBy: user.uid,
        createdByEmail: user.email
      });
      toast.success("Veri seti oluşturuldu!");
      setDatasetName("");
      setDatasetDescription("");
      setShowCreateForm(false);
      await loadDatasets();
    } catch (error) {
      console.error("Error creating dataset:", error);
      toast.error("Veri seti oluşturulamadı!");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDataset = async (datasetId) => {
    if (!confirm("Bu veri setini silmek istediğinize emin misiniz?")) return;

    try {
      await deleteDataset(datasetId);
      toast.success("Veri seti silindi!");
      await loadDatasets();
      if (selectedDataset?.id === datasetId) {
        setSelectedDataset(null);
      }
    } catch (error) {
      console.error("Error deleting dataset:", error);
      toast.error("Veri seti silinemedi!");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItemImage(file);
      setNewItemPreview(URL.createObjectURL(file));
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!newItemName.trim() || !newItemImage) {
      toast.error("İsim ve resim gerekli!");
      return;
    }

    try {
      setAddingItem(true);

      // Upload image first
      const imageUrl = await uploadItemImage(newItemImage, selectedDataset.id, newItemName);

      // Add item to dataset
      await addItemToDataset(selectedDataset.id, {
        name: newItemName.trim(),
        imageUrl
      });

      toast.success("Item eklendi!");
      setNewItemName("");
      setNewItemImage(null);
      setNewItemPreview(null);

      // Reload and update selected dataset
      await loadDatasets();
      const datasets = await getAllDatasets();
      const updated = datasets.find(d => d.id === selectedDataset.id);
      setSelectedDataset(updated);
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Item eklenemedi!");
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Bu item'ı silmek istediğinize emin misiniz?")) return;

    try {
      await removeItemFromDataset(selectedDataset.id, itemId);
      toast.success("Item silindi!");

      // Reload and update selected dataset
      await loadDatasets();
      const datasets = await getAllDatasets();
      const updated = datasets.find(d => d.id === selectedDataset.id);
      setSelectedDataset(updated);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Item silinemedi!");
    }
  };

  if (loading || loadingDatasets) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-lg text-red-400">Erişim Reddedildi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Veri Seti Yönetimi
            </h1>
            <p className="text-gray-400 mt-2">Turnuva oylamaları için veri setleri oluşturun</p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl transition-colors"
          >
            ← Geri Dön
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all font-semibold shadow-lg"
          >
            {showCreateForm ? "İptal" : "+ Yeni Veri Seti"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Dataset List & Create Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">Yeni Veri Seti Oluştur</h2>

              <form onSubmit={handleCreateDataset} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    İsim *
                  </label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="Örn: Arabalar, Yemekler, Filmler"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={datasetDescription}
                    onChange={(e) => setDatasetDescription(e.target.value)}
                    placeholder="Veri seti açıklaması (opsiyonel)"
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all font-semibold disabled:cursor-not-allowed"
                >
                  {creating ? "Oluşturuluyor..." : "Veri Seti Oluştur"}
                </button>
              </form>
            </div>
          )}

          {/* Datasets List */}
          <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Tüm Veri Setleri</h2>

            {datasets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-gray-400">Henüz veri seti yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {datasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedDataset?.id === dataset.id
                        ? "border-blue-500 bg-blue-900/30"
                        : "border-gray-700 bg-gray-900/50 hover:border-gray-600"
                    }`}
                    onClick={() => setSelectedDataset(dataset)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-white">{dataset.name}</h3>
                        {dataset.description && (
                          <p className="text-sm text-gray-400">{dataset.description}</p>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-900/50 text-blue-400 border border-blue-700">
                        {dataset.items?.length || 0} item
                      </span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDataset(dataset.id);
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - Selected Dataset Items */}
        <div className="lg:col-span-1">
          {selectedDataset ? (
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl sticky top-4">
              <h2 className="text-xl font-bold text-white mb-4">
                📦 {selectedDataset.name}
              </h2>

              {/* Add Item Form */}
              <form onSubmit={handleAddItem} className="space-y-4 mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                <h3 className="font-semibold text-white">Yeni Item Ekle</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    İsim *
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Item adı"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Resim *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {newItemPreview && (
                    <img src={newItemPreview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl border border-gray-700" />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={addingItem}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-xl transition-all font-semibold disabled:cursor-not-allowed"
                >
                  {addingItem ? "Ekleniyor..." : "+ Ekle"}
                </button>
              </form>

              {/* Items List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-white sticky top-0 bg-gray-800/90 py-2">Items ({selectedDataset.items?.length || 0})</h3>
                {!selectedDataset.items || selectedDataset.items.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Henüz item yok</p>
                ) : (
                  selectedDataset.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-3 bg-gray-900/50 rounded-xl border border-gray-700 flex items-center gap-3"
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                      )}
                      <div className="flex-1">
                        <p className="text-white font-semibold">{item.name}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-400">Detayları görmek için bir veri seti seçin</p>
            </div>
          )}
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="dark"
      />
    </div>
  );
}
