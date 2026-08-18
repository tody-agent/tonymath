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

let activeAudio = null;
let keepAliveTimer = null;

// Bảng map các câu thoại đã được sinh trước bằng OmniVoice chất lượng cao (0ms latency, zero-server)
const PRE_RENDERED_AUDIO_MAP = [
  { match: /Chào bạn nhỏ! Hôm nay là một ngày tuyệt vời/i, src: '/audio/mascot/robot_welcome.wav' },
  { match: /Tuyệt vời! Bạn nhỏ đã hoàn thành toàn bộ bài học/i, src: '/audio/mascot/robot_done.wav' },
  { match: /Có bài.*cần chúng mình ôn tập lại/i, src: '/audio/mascot/robot_review.wav' },
  { match: /chinh phục bài (học )?mới/i, src: '/audio/mascot/robot_new_lesson.wav' },
  { match: /Chậm mà chắc.*kiên trì học toán/i, src: '/audio/mascot/turtle_welcome.wav' },
  { match: /nhà thông thái nhỏ.*khám phá/i, src: '/audio/mascot/owl_welcome.wav' },
  { match: /^Chính xác!? Con giỏi quá!?/i, src: '/audio/mascot/praise_correct_1.wav' },
  { match: /^Xuất sắc!?/i, src: '/audio/mascot/praise_correct_2.wav' },
  { match: /^Tuyệt đỉnh!?/i, src: '/audio/mascot/praise_correct_3.wav' },
  { match: /^Chưa chính xác rồi/i, src: '/audio/mascot/encourage_wrong_1.wav' },
  { match: /^Không sao cả.*bình tĩnh/i, src: '/audio/mascot/encourage_wrong_2.wav' },
  { match: /chuỗi trả lời đúng liên tiếp/i, src: '/audio/mascot/streak_praise.wav' }
];

/**
 * Chuẩn hóa ký hiệu toán học và dấu ngắt câu để giọng đọc tiếng Việt mượt mà, tự nhiên.
 * @param {string} text 
 * @returns {string}
 */
export function normalizeMathSpeech(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 phần $2')
    .replace(/(\d+)\s*[:÷]\s*(\d+)/g, '$1 chia $2')
    .replace(/(\d+)\s*\+\s*(\d+)/g, '$1 cộng $2')
    .replace(/(\d+)\s*-\s*(\d+)/g, '$1 trừ $2')
    .replace(/(\d+)\s*[xX*×]\s*(\d+)/g, '$1 nhân $2')
    .replace(/(\d+)\s*=\s*(\d+)/g, '$1 bằng $2')
    .replace(/\+/g, ' cộng ')
    .replace(/-/g, ' trừ ')
    .replace(/[xX*×]/g, ' nhân ')
    .replace(/[:÷]/g, ' chia ')
    .replace(/=/g, ' bằng ')
    .replace(/\?/g, ' bao nhiêu?')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chọn giọng tiếng Việt chất lượng tốt nhất trong danh sách voice của hệ thống.
 * Né các giọng nén Compact chất lượng kém trên macOS.
 */
export function selectBestVietnameseVoice(voices) {
  if (!voices || voices.length === 0) return null;
  const viVoices = voices.filter(v => v.lang === 'vi-VN' || v.lang.startsWith('vi'));
  if (viVoices.length === 0) return null;

  // 1. Ưu tiên giọng Enhanced / Natural / Google / Premium (chất lượng cao)
  const premiumVoice = viVoices.find(v =>
    !v.name.includes('Compact') &&
    (v.name.includes('Enhanced') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))
  );
  if (premiumVoice) return premiumVoice;

  // 2. Ưu tiên giọng không có nhãn Compact
  const normalVoice = viVoices.find(v => !v.name.includes('Compact'));
  if (normalVoice) return normalVoice;

  // 3. Fallback
  return viVoices[0];
}

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
    if (synth && synth.speaking && !synth.paused) {
      synth.pause();
      synth.resume();
    }
  }, KEEP_ALIVE_INTERVAL_MS);
}

/**
 * Cancels any ongoing text-to-speech rendering immediately.
 */
export function cancelSpeech() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore abort errors
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  stopKeepAlive();
}

/**
 * Speaks the given text.
 * Tầng 1: Kiểm tra xem có file audio OmniVoice sinh sẵn không (0ms delay, chất lượng cao).
 * Tầng 2: Nếu câu động -> Chuẩn hóa toán học & dùng SpeechSynthesis với voice tiếng Việt tốt nhất.
 * 
 * @param {string} text - Nội dung tiếng Việt cần phát
 * @param {number} rate - Tốc độ đọc
 * @param {function} onStart - Callback khi bắt đầu phát
 * @param {function} onEnd - Callback khi kết thúc
 * @param {number} pitch - Cao độ giọng
 */
export function speakText(text, rate = 0.95, onStart = null, onEnd = null, pitch = 1.05) {
  cancelSpeech();

  if (!text || typeof text !== 'string') {
    if (onEnd) onEnd();
    return;
  }

  const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  // Tầng 1: Kiểm tra khớp file audio OmniVoice sinh sẵn
  const matchedPreRendered = PRE_RENDERED_AUDIO_MAP.find(entry => entry.match.test(cleanText));
  if (matchedPreRendered) {
    try {
      const audio = new Audio(matchedPreRendered.src);
      activeAudio = audio;
      audio.onplay = () => {
        if (onStart) onStart();
      };
      audio.onended = () => {
        activeAudio = null;
        if (onEnd) onEnd();
      };
      audio.onerror = () => {
        activeAudio = null;
        // Fallback sang SpeechSynthesis nếu không load được file
        speakViaSpeechSynthesis(cleanText, rate, onStart, onEnd, pitch);
      };
      audio.play().catch(() => {
        // Trình duyệt chặn autoplay -> fallback
        speakViaSpeechSynthesis(cleanText, rate, onStart, onEnd, pitch);
      });
      return;
    } catch (e) {
      console.warn('Pre-rendered audio playback failed, falling back to Web Speech:', e);
    }
  }

  // Tầng 2: Fallback qua Web Speech Synthesis thông minh
  speakViaSpeechSynthesis(cleanText, rate, onStart, onEnd, pitch);
}

/**
 * Fallback đọc qua SpeechSynthesis với chuẩn hóa ký hiệu toán học
 */
function speakViaSpeechSynthesis(text, rate = 0.95, onStart = null, onEnd = null, pitch = 1.05) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  const normalizedText = normalizeMathSpeech(text);
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(normalizedText);
  utterance.lang = 'vi-VN';
  utterance.rate = rate;
  utterance.pitch = pitch;

  const voices = synth.getVoices();
  const selectedVoice = selectBestVietnameseVoice(voices);
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
    if (event.error === 'canceled' || event.error === 'interrupted') return;
    console.warn('Speech synthesis failed:', event);
    if (onEnd) onEnd();
  };

  synth.speak(utterance);
}

