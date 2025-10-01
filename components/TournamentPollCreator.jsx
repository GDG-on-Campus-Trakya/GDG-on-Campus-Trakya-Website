"use client";
import { useState } from "react";
import { toast } from "react-toastify";
import { createTournamentPoll, uploadPollImages } from "../utils/pollUtils";
import { compressImage, validateImageFile } from "../utils/imageCompression";

export default function TournamentPollCreator({ user, onSuccess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length < 2) {
      toast.error("En az 2 resim yüklemelisiniz!");
      return;
    }

    if (files.length > 32) {
      toast.error("En fazla 32 resim yükleyebilirsiniz!");
      return;
    }

    // Validate files
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    setCompressing(true);
    toast.info("Resimler sıkıştırılıyor...");

    try {
      // Compress images
      const compressedImages = await Promise.all(
        files.map(async (file) => {
          try {
            const compressed = await compressImage(file, 200); // 200KB max
            // Convert blob back to File with original name
            return new File([compressed], file.name, { type: 'image/jpeg' });
          } catch (error) {
            console.error(`Error compressing ${file.name}:`, error);
            toast.error(`${file.name} sıkıştırılamadı!`);
            return file; // Use original if compression fails
          }
        })
      );

      setImages(compressedImages);

      // Create preview URLs
      const previews = compressedImages.map(file => ({
        url: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, "")
      }));
      setPreviewUrls(previews);

      toast.success("Resimler sıkıştırıldı!");
    } catch (error) {
      console.error("Error processing images:", error);
      toast.error("Resimler işlenirken hata oluştu!");
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);

    // Revoke old URL
    URL.revokeObjectURL(previewUrls[index].url);

    setImages(newImages);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Başlık gerekli!");
      return;
    }

    if (images.length < 2) {
      toast.error("En az 2 resim gerekli!");
      return;
    }

    try {
      setUploading(true);

      // Generate temporary poll ID for upload
      const tempPollId = `temp_${Date.now()}`;

      // Upload images
      toast.info("Resimler yükleniyor...");
      const uploadedImages = await uploadPollImages(images, tempPollId);

      // Create tournament poll
      toast.info("Turnuva oluşturuluyor...");
      const pollId = await createTournamentPoll({
        title: title.trim(),
        description: description.trim(),
        items: uploadedImages,
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
        createdByEmail: user.email
      });

      toast.success("Turnuva başarıyla oluşturuldu!");

      // Reset form
      setTitle("");
      setDescription("");
      setImages([]);
      previewUrls.forEach(p => URL.revokeObjectURL(p.url));
      setPreviewUrls([]);

      // Callback
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast.error("Turnuva oluşturulurken hata: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Turnuva Başlığı *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: En İyi Yemek Yarışması"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Açıklama
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Turnuva hakkında açıklama (opsiyonel)"
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Resimler * (En az 2, en fazla 32)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={compressing}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Dosya adı öğe ismi olarak kullanılacak (örn: "pizza.jpg" → "pizza")
        </p>
        <p className="text-xs text-blue-600 mt-1">
          🔧 Resimler otomatik olarak 200KB altına sıkıştırılacak
        </p>
      </div>

      {/* Image Previews */}
      {previewUrls.length > 0 && (
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">
              Yüklenen Resimler ({previewUrls.length})
            </h3>
            <span className="text-sm text-gray-600">
              Turnuva: {Math.ceil(Math.log2(previewUrls.length))} tur
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {previewUrls.map((preview, index) => (
              <div
                key={index}
                className="relative group bg-white rounded-lg p-2 border border-gray-200 hover:border-purple-500 transition-colors"
              >
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="w-full h-24 object-cover rounded"
                />
                <p className="text-xs text-center mt-1 truncate font-medium text-gray-700">
                  {preview.name}
                </p>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || compressing || images.length < 2}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all font-semibold disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {compressing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Sıkıştırılıyor...
          </>
        ) : uploading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Yükleniyor...
          </>
        ) : (
          <>
            🏆 Turnuva Oluştur
          </>
        )}
      </button>
    </form>
  );
}
