"use client";
import { useState, useRef } from 'react';
import { uploadImage } from '../utils/storageUtils';
import { toast } from 'react-toastify';

const ImageUpload = ({ 
  onImageUpload, 
  currentImageUrl = '', 
  folder = 'images', 
  prefix = '',
  className = '',
  placeholder = 'Resim Yükle'
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);
      
      const result = await uploadImage(file, folder, prefix);
      
      setPreviewUrl(result.url);
      onImageUpload(result);
      
      toast.success('Resim başarıyla yüklendi!');
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      toast.error(error.message || 'Resim yüklenirken hata oluştu');
      setPreviewUrl(currentImageUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onImageUpload({ url: '', path: '', fileName: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
        >
          {uploading ? 'Yükleniyor...' : placeholder}
        </button>
        
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            Kaldır
          </button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {previewUrl && (
        <div className="mt-2">
          <img
            src={previewUrl}
            alt="Önizleme"
            className="w-32 h-32 object-cover rounded-md border border-gray-300"
          />
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        JPEG, PNG, WebP, HEIC formatları desteklenir. Maksimum 10MB.
      </p>
    </div>
  );
};

export default ImageUpload;