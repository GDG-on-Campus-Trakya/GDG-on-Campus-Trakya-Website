"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Calendar, ImageIcon } from "lucide-react";
import { socialUtils } from "../utils/socialUtils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { logger } from "@/utils/logger";

export default function PostUpload({ onUploadComplete, onCancel }) {
  const [user] = useAuthState(auth);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [activeEvents, setActiveEvents] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadActiveEvents();
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserProfileData(userDoc.data());
      }
    } catch (error) {
      logger.error("Error loading user profile:", error);
    }
  };

  const loadActiveEvents = async () => {
    const result = await socialUtils.getActiveEventsForPosting();
    if (result.success) {
      setActiveEvents(result.events);
    }
  };

  const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir resim dosyası seçin!");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resim boyutu 5MB'dan küçük olmalıdır!");
      return;
    }

    try {
      // Compress the image
      const compressedBlob = await compressImage(file);
      
      // Convert blob to file with original name
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      setSelectedImage(compressedFile);
      
      // Create preview with error handling
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        toast.success("Resim yüklendi!");
      };
      reader.onerror = () => {
        toast.error("Resim yüklenirken hata oluştu!");
        setSelectedImage(null);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast.error("Resim sıkıştırılırken hata oluştu!");
      logger.error("Compression error:", error);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Simulate file input change
      const fakeEvent = { target: { files: [file] } };
      handleImageSelect(fakeEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Giriş yapmanız gerekiyor!");
      return;
    }

    if (!selectedImage) {
      toast.error("Lütfen bir resim seçin!");
      return;
    }

    if (!selectedEvent) {
      toast.error("Lütfen bir etkinlik seçin!");
      return;
    }

    setIsUploading(true);

    try {
      // Upload image first
      const uploadResult = await socialUtils.uploadPostImage(selectedImage, user.uid);
      
      if (!uploadResult.success) {
        toast.error("Resim yüklenirken hata oluştu!");
        setIsUploading(false);
        return;
      }

      // Prepare post data - Always event post now
      const eventData = activeEvents.find(event => event.id === selectedEvent);
      const postData = {
        userId: user.uid,
        userEmail: user.email,
        userName: userProfileData?.name || user.displayName || user.email,
        userPhoto: userProfileData?.photoURL || user.photoURL || null,
        imageUrl: uploadResult.url,
        description: description.trim(),
        eventId: selectedEvent,
        eventName: eventData?.name,
      };

      // Create post
      const postResult = await socialUtils.createPost(postData);
      
      if (!postResult.success) {
        toast.error("Post oluşturulurken hata oluştu!");
        setIsUploading(false);
        return;
      }

      // Add to raffle - all posts are event posts now
      await socialUtils.addToRaffle(selectedEvent, user.uid, postResult.id);

      toast.success("Post başarıyla paylaşıldı!");
      
      // Reset form
      setSelectedImage(null);
      setImagePreview(null);
      setDescription("");
      setSelectedEvent("");
      
      // Call completion callback
      onUploadComplete && onUploadComplete();
      
    } catch (error) {
      logger.error("Upload error:", error);
      toast.error("Beklenmeyen bir hata oluştu!");
    }
    
    setIsUploading(false);
  };

  return (
    <div className="relative mx-auto rounded-xl bg-gray-800/50 backdrop-blur-sm p-6 max-w-lg shadow-xl border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Yeni Post</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload Area */}
        <div className="space-y-4">
          {!imagePreview ? (
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-[#d1d1e0] text-lg mb-2">Resim seç veya sürükle</p>
              <p className="text-gray-400 text-sm">JPG, PNG, HEIC (Max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/heic,image/heif"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <Image
                src={imagePreview}
                alt="Preview"
                width={400}
                height={300}
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Event Selection - Required */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Etkinlik Seçimi *
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Etkinlik seçin</option>
            {activeEvents.map((event) => (
              <option key={event.id} value={event.id} disabled={!event.canPost}>
                {event.name} {!event.canPost && "(Süresi dolmuş)"}
              </option>
            ))}
          </select>
          {selectedEvent && (
            <p className="text-green-400 text-xs mt-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Bu post çekilişe otomatik katılacak!
            </p>
          )}
          {activeEvents.length === 0 && (
            <p className="text-yellow-400 text-xs mt-1">
              Şu anda fotoğraf paylaşabileceğiniz aktif etkinlik yok.
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Açıklama (İsteğe Bağlı)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Postunuz hakkında bir şeyler yazın..."
            rows={3}
            maxLength={500}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-gray-400 text-xs mt-1">
            {description.length}/500 karakter
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedImage || isUploading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Paylaşılıyor...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Paylaş</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}