import { ref, set, get, update, remove, onValue, off, push } from "firebase/database";
import { realtimeDb, storage } from "../firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Create a new dataset
 * @param {Object} datasetData - Dataset configuration
 * @returns {Promise<string>} Dataset ID
 */
export const createDataset = async (datasetData) => {
  const datasetId = `dataset_${Date.now()}`;
  const datasetRef = ref(realtimeDb, `datasets/${datasetId}`);

  const dataset = {
    ...datasetData,
    id: datasetId,
    createdAt: Date.now(),
    items: []
  };

  await set(datasetRef, dataset);
  return datasetId;
};

/**
 * Get all datasets
 * @returns {Promise<Array>} Array of datasets
 */
export const getAllDatasets = async () => {
  const datasetsRef = ref(realtimeDb, 'datasets');
  const snapshot = await get(datasetsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const datasets = snapshot.val();
  return Object.entries(datasets).map(([id, data]) => ({
    id,
    ...data
  })).sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Get a specific dataset
 * @param {string} datasetId - Dataset ID
 * @returns {Promise<Object>} Dataset data
 */
export const getDataset = async (datasetId) => {
  const datasetRef = ref(realtimeDb, `datasets/${datasetId}`);
  const snapshot = await get(datasetRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { id: datasetId, ...snapshot.val() };
};

/**
 * Delete a dataset
 * @param {string} datasetId - Dataset ID
 */
export const deleteDataset = async (datasetId) => {
  const datasetRef = ref(realtimeDb, `datasets/${datasetId}`);
  await remove(datasetRef);
};

/**
 * Upload item image to Firebase Storage
 * @param {File} file - Image file
 * @param {string} datasetId - Dataset ID
 * @param {string} itemName - Item name for file naming
 * @returns {Promise<string>} Image URL
 */
export const uploadItemImage = async (file, datasetId, itemName) => {
  const fileName = `${Date.now()}_${itemName.replace(/\s+/g, '_')}`;
  const imageRef = storageRef(storage, `datasets/${datasetId}/${fileName}`);

  await uploadBytes(imageRef, file);
  const imageUrl = await getDownloadURL(imageRef);

  return imageUrl;
};

/**
 * Add item to dataset
 * @param {string} datasetId - Dataset ID
 * @param {Object} itemData - Item data with name and imageUrl
 * @returns {Promise<boolean>} Success status
 */
export const addItemToDataset = async (datasetId, itemData) => {
  const datasetRef = ref(realtimeDb, `datasets/${datasetId}`);
  const snapshot = await get(datasetRef);

  if (!snapshot.exists()) {
    throw new Error("Dataset not found");
  }

  const dataset = snapshot.val();
  const items = dataset.items || [];

  items.push({
    id: `item_${Date.now()}`,
    ...itemData,
    addedAt: Date.now()
  });

  await update(datasetRef, { items });
  return true;
};

/**
 * Remove item from dataset
 * @param {string} datasetId - Dataset ID
 * @param {string} itemId - Item ID
 * @returns {Promise<boolean>} Success status
 */
export const removeItemFromDataset = async (datasetId, itemId) => {
  const datasetRef = ref(realtimeDb, `datasets/${datasetId}`);
  const snapshot = await get(datasetRef);

  if (!snapshot.exists()) {
    throw new Error("Dataset not found");
  }

  const dataset = snapshot.val();
  const items = dataset.items || [];

  const updatedItems = items.filter(item => item.id !== itemId);

  await update(datasetRef, { items: updatedItems });
  return true;
};

/**
 * Subscribe to datasets updates
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDatasets = (callback) => {
  const datasetsRef = ref(realtimeDb, 'datasets');

  onValue(datasetsRef, (snapshot) => {
    if (snapshot.exists()) {
      const datasets = snapshot.val();
      const datasetArray = Object.entries(datasets).map(([id, data]) => ({
        id,
        ...data
      })).sort((a, b) => b.createdAt - a.createdAt);
      callback(datasetArray);
    } else {
      callback([]);
    }
  });

  return () => off(datasetsRef);
};

/**
 * Get random items from dataset
 * @param {string} datasetId - Dataset ID
 * @param {number} count - Number of items to select (8, 16, 32, or 64)
 * @returns {Promise<Array>} Array of random items
 */
export const getRandomItemsFromDataset = async (datasetId, count) => {
  const dataset = await getDataset(datasetId);

  if (!dataset || !dataset.items || dataset.items.length === 0) {
    throw new Error("Dataset is empty");
  }

  if (dataset.items.length < count) {
    throw new Error(`Dataset has only ${dataset.items.length} items, need ${count}`);
  }

  // Shuffle array and take first 'count' items
  const shuffled = [...dataset.items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
