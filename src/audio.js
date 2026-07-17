let audioCtx = null;

/**
 * Lazily gets or initializes the AudioContext.
 * @returns {AudioContext} The active AudioContext
 */
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function tone(ctx, { freq, type = 'sine', start, dur = 0.15, peak = 0.14, slideTo = null }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + dur);
  }
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/**
 * Synthesizes sound effects using Web Audio API (offline-friendly, zero assets).
 *
 * Types:
 *  click | correct | wrong | soft_wrong | complete | perfect |
 *  encourage | praise | welcome | streak | levelup | sparkle
 *
 * @param {string} type
 * @param {boolean} muted
 */
export function playSfx(type, muted = false) {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'click') {
      tone(ctx, { freq: 880, start: now, dur: 0.07, peak: 0.1, slideTo: 220, type: 'sine' });
    } else if (type === 'correct' || type === 'praise') {
      // Bright major arpeggio
      ;[523.25, 659.25, 783.99].forEach((freq, i) => {
        tone(ctx, { freq, start: now + i * 0.07, dur: 0.16, peak: 0.14, type: 'sine' });
      });
      if (type === 'praise') {
        tone(ctx, { freq: 1046.5, start: now + 0.24, dur: 0.22, peak: 0.12, type: 'triangle' });
      }
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.22);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'soft_wrong') {
      // Gentle “hmm” — less harsh for kids
      tone(ctx, { freq: 320, start: now, dur: 0.12, peak: 0.08, slideTo: 240, type: 'triangle' });
      tone(ctx, { freq: 280, start: now + 0.1, dur: 0.14, peak: 0.06, slideTo: 200, type: 'sine' });
    } else if (type === 'complete') {
      ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        tone(ctx, { freq, start: now + i * 0.09, dur: 0.28, peak: 0.13, type: 'triangle' });
      });
    } else if (type === 'perfect') {
      // Sparkly fanfare + high shimmer
      const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      fanfare.forEach((freq, i) => {
        tone(ctx, { freq, start: now + i * 0.08, dur: 0.3, peak: 0.13, type: i > 2 ? 'sine' : 'triangle' });
      });
      // Soft shimmer
      ;[1568, 2093].forEach((freq, i) => {
        tone(ctx, { freq, start: now + 0.45 + i * 0.06, dur: 0.2, peak: 0.06, type: 'sine' });
      });
    } else if (type === 'encourage') {
      // Warm rising third — “you can do it”
      tone(ctx, { freq: 392, start: now, dur: 0.18, peak: 0.11, type: 'triangle' });
      tone(ctx, { freq: 493.88, start: now + 0.14, dur: 0.22, peak: 0.12, type: 'triangle' });
      tone(ctx, { freq: 587.33, start: now + 0.3, dur: 0.28, peak: 0.1, type: 'sine' });
    } else if (type === 'welcome') {
      ;[440, 554.37, 659.25].forEach((freq, i) => {
        tone(ctx, { freq, start: now + i * 0.11, dur: 0.25, peak: 0.11, type: 'sine' });
      });
    } else if (type === 'streak') {
      ;[523.25, 523.25, 783.99].forEach((freq, i) => {
        tone(ctx, { freq, start: now + i * 0.1, dur: 0.14, peak: 0.12, type: 'square' });
      });
    } else if (type === 'levelup') {
      ;[392, 523.25, 659.25, 784, 1046.5].forEach((freq, i) => {
        tone(ctx, { freq, start: now + i * 0.07, dur: 0.2, peak: 0.12, type: 'triangle' });
      });
    } else if (type === 'sparkle') {
      ;[1174.7, 1396.9, 1568].forEach((freq, i) => {
        tone(ctx, { freq, start: now + i * 0.05, dur: 0.12, peak: 0.07, type: 'sine' });
      });
    }
  } catch (error) {
    console.warn('Failed to play SFX:', error);
  }
}

let keepAliveTimer = null;

/**
 * Stops the keep-alive loop.
 */
function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

const KEEP_ALIVE_INTERVAL_MS = 10000;

/**
 * Keeps SpeechSynthesis alive on Chrome by triggering brief pause/resume every 10s.
 */
function startKeepAlive() {
  stopKeepAlive();
  const synth = window.speechSynthesis;
  keepAliveTimer = setInterval(() => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      synth.resume();
    }
  }, KEEP_ALIVE_INTERVAL_MS);
}

/**
 * Cancels any ongoing text-to-speech rendering immediately.
 */
export function cancelSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  stopKeepAlive();
}

/**
 * Speaks the given text using browser SpeechSynthesis API.
 * Handles language matching, voice caching, keep-alive, and overlaps.
 * 
 * @param {string} text - Vietnamese content to be spoken
 * @param {number} rate - Speed rate (0.1 to 10)
 * @param {function} onStart - Callback when speech starts
 * @param {function} onEnd - Callback when speech ends or fails
 */
export function speakText(text, rate = 0.95, onStart = null, onEnd = null, pitch = 1.05) {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  cancelSpeech();

  const synth = window.speechSynthesis;
  const cleanText = text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'vi-VN';
  utterance.rate = rate;
  utterance.pitch = pitch;

  const voices = synth.getVoices();
  let selectedVoice = null;
  if (voices && voices.length > 0) {
    selectedVoice = voices.find((v) => v.lang === 'vi-VN' && v.localService);
    if (!selectedVoice) {
      selectedVoice = voices.find((v) => v.lang === 'vi-VN' || v.lang.startsWith('vi'));
    }
  }
  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.onstart = () => {
    startKeepAlive();
    if (onStart) onStart();
  };
  utterance.onend = () => {
    stopKeepAlive();
    if (onEnd) onEnd();
  };
  utterance.onerror = (event) => {
    stopKeepAlive();
    if (event.error === 'canceled' || event.error === 'interrupted') return;
    console.warn('Speech synthesis failed:', event);
    if (onEnd) onEnd();
  };

  synth.speak(utterance);
}
