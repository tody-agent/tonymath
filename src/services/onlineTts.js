/**
 * Online TTS Service with Local IndexedDB Caching
 * Provides studio-quality Microsoft Edge Neural Voice (vi-VN-HoaiMyNeural) across the entire app.
 */

import { getCachedAudio, saveAudioToCache } from './ttsCache.js';

let activeOnlineAudio = null;

/**
 * Stops any currently playing online TTS audio immediately.
 */
export function cancelOnlineSpeech() {
  if (activeOnlineAudio) {
    try {
      activeOnlineAudio.pause();
      activeOnlineAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    activeOnlineAudio = null;
  }
}

/**
 * Fetch TTS Audio Blob with multi-tier strategy:
 * 1. Check IndexedDB local cache (0ms, offline)
 * 2. Fetch from local Vite/Cloudflare API endpoint (/api/tts)
 * 3. Fallback to Google Translate TTS API if online
 * 
 * @param {string} text - Cleaned Vietnamese text
 * @param {string} voice - Default: 'vi-VN-HoaiMyNeural'
 * @returns {Promise<Blob|null>}
 */
export async function fetchTtsAudioBlob(text, voice = 'vi-VN-HoaiMyNeural') {
  if (!text || !text.trim()) return null;

  // Tầng 1: Kiểm tra IndexedDB
  const cachedBlob = await getCachedAudio(text, voice);
  if (cachedBlob) {
    return cachedBlob;
  }

  // Tầng 2: Gọi endpoint /api/tts
  try {
    const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`;
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 200) {
        // Lưu vào IndexedDB cho các lần sau
        saveAudioToCache(text, voice, blob);
        return blob;
      }
    }
  } catch (err) {
    console.warn('API /api/tts fetch failed, trying fallback:', err);
  }

  // Tầng 3: Fallback Google Translate TTS
  try {
    const gUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(text)}`;
    const gRes = await fetch(gUrl);
    if (gRes.ok) {
      const gBlob = await gRes.blob();
      if (gBlob && gBlob.size > 200) {
        saveAudioToCache(text, voice, gBlob);
        return gBlob;
      }
    }
  } catch {
    // Fallback silent
  }

  return null;
}

/**
 * Play text using Online TTS (Edge-TTS HoaiMyNeural) + IndexedDB Cache.
 * 
 * @param {string} text 
 * @param {object} options
 * @param {string} [options.voice] - 'vi-VN-HoaiMyNeural' | 'vi-VN-NamMinhNeural'
 * @param {function} [options.onStart]
 * @param {function} [options.onEnd]
 * @param {function} [options.onFallback] - Called if online TTS is completely unavailable
 */
export async function playOnlineSpeech(text, {
  voice = 'vi-VN-HoaiMyNeural',
  onStart = null,
  onEnd = null,
  onFallback = null
} = {}) {
  cancelOnlineSpeech();

  const cleanText = (text || '').trim();
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  try {
    const blob = await fetchTtsAudioBlob(cleanText, voice);
    if (!blob) {
      if (onFallback) onFallback();
      else if (onEnd) onEnd();
      return;
    }

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    activeOnlineAudio = audio;

    audio.onplay = () => {
      if (onStart) onStart();
    };
    audio.onended = () => {
      activeOnlineAudio = null;
      URL.revokeObjectURL(audioUrl);
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      activeOnlineAudio = null;
      URL.revokeObjectURL(audioUrl);
      if (onFallback) onFallback();
      else if (onEnd) onEnd();
    };

    audio.play().catch(() => {
      activeOnlineAudio = null;
      URL.revokeObjectURL(audioUrl);
      if (onFallback) onFallback();
      else if (onEnd) onEnd();
    });
  } catch (e) {
    console.warn('playOnlineSpeech failed:', e);
    if (onFallback) onFallback();
    else if (onEnd) onEnd();
  }
}
