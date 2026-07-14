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

/**
 * Synthesizes sound effects using browser Web Audio API oscillators.
 * Keeps the application fast, zero-dependency, and offline-capable.
 * 
 * @param {string} type - SFX type: 'click', 'correct', 'wrong', 'complete'
 * @param {boolean} muted - If true, skips playback
 */
export function playSfx(type, muted = false) {
  if (muted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'correct') {
      // Ascending major chime (C5, E5, G5)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, index) => {
        const time = now + index * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.18);
      });
    } else if (type === 'wrong') {
      // Buzzing frequency sweep down (sawtooth wave filtered)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.25);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'complete') {
      // Victory Fanfare (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        const time = now + index * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.35);
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
  }, 10000);
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
export function speakText(text, rate = 0.95, onStart = null, onEnd = null) {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any active speech first
  cancelSpeech();

  const synth = window.speechSynthesis;
  
  // Clean text from HTML if any, and collapse multiple spaces/newlines
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
  utterance.pitch = 1.0;

  // Voice Selection logic
  const voices = synth.getVoices();
  let selectedVoice = null;

  if (voices && voices.length > 0) {
    // 1. Seek Vietnamese local voice first (offline capability & speed)
    selectedVoice = voices.find(v => v.lang === 'vi-VN' && v.localService);
    // 2. Fallback to any Vietnamese voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === 'vi-VN' || v.lang.startsWith('vi'));
    }
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

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
    // 'canceled' and 'interrupted' error states are normal when calling cancel()
    if (event.error === 'canceled' || event.error === 'interrupted') return;
    console.warn('Speech synthesis failed:', event);
    if (onEnd) onEnd();
  };

  synth.speak(utterance);
}
