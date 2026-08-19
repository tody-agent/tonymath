/**
 * Persistent IndexedDB Audio Cache for Học Toán Vui TTS
 * Caches synthesized audio blobs locally to enable 0ms latency and offline playback.
 */

const DB_NAME = 'hoctoanvui_tts_cache_v1';
const STORE_NAME = 'audio_cache';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

/**
 * Generate a cache key from text and voice.
 */
export function getAudioCacheKey(text, voice = 'vi-VN-HoaiMyNeural') {
  const clean = (text || '').trim().toLowerCase();
  return `${voice}::${clean}`;
}

/**
 * Get cached audio blob from IndexedDB.
 * @param {string} text 
 * @param {string} voice 
 * @returns {Promise<Blob|null>}
 */
export async function getCachedAudio(text, voice = 'vi-VN-HoaiMyNeural') {
  try {
    const db = await getDB();
    const key = getAudioCacheKey(text, voice);
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Save an audio blob to IndexedDB.
 * @param {string} text 
 * @param {string} voice 
 * @param {Blob} blob 
 * @returns {Promise<boolean>}
 */
export async function saveAudioToCache(text, voice = 'vi-VN-HoaiMyNeural', blob) {
  try {
    if (!blob) return false;
    const db = await getDB();
    const key = getAudioCacheKey(text, voice);
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        key,
        blob,
        createdAt: Date.now(),
        size: blob.size
      });
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
