/**
 * Compress image to under 100KB
 * @param {File} file - Image file
 * @param {number} maxSizeKB - Maximum size in KB (default 100)
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = async (file, maxSizeKB = 100) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let quality = 0.9;
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');

        // Calculate new dimensions (max 1200px width)
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try to compress until size is under maxSizeKB
        const tryCompress = (currentQuality) => {
          canvas.toBlob(
            (blob) => {
              const sizeKB = blob.size / 1024;

              if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
                // Success or minimum quality reached
                resolve(blob);
              } else {
                // Try again with lower quality
                tryCompress(currentQuality - 0.1);
              }
            },
            'image/jpeg',
            currentQuality
          );
        };

        tryCompress(quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload compressed image to Firebase Storage
 * @param {Blob} blob - Compressed image blob
 * @param {string} path - Storage path
 * @returns {Promise<string>} Download URL
 */
export const uploadCompressedImage = async (blob, path) => {
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
  const { storage } = await import('../firebase');

  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};

/**
 * Validate image file
 * @param {File} file - Image file
 * @returns {Object} Validation result
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSizeMB = 10; // Original file max size before compression

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Sadece JPG, PNG veya WebP formatları desteklenir.'
    };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `Dosya boyutu ${maxSizeMB}MB'den küçük olmalıdır.`
    };
  }

  return { valid: true };
};
