/**
 * Audio Engine: Smart Audio & Voice Dispatcher for TonyMath
 * 
 * Features:
 * - Zero-server & 0ms latency pre-rendered voice playback
 * - Anti-repetition selection (sliding history window)
 * - Behavior-based reaction categories (careless/rushing, deep-thinking, streak, encourage)
 * - Smart Vietnamese math phonetic normalizer
 * - Fallback to enhanced Web Speech Synthesis
 */

import { cancelSpeech, speakText, normalizeMathSpeech, selectBestVietnameseVoice } from './audio.js';

// Kho file âm thanh đã sinh bằng OmniVoice
export const MASCOT_AUDIO_CATALOG = {
  robot: {
    welcome: ['robot_welcome_1', 'robot_welcome_2'],
    correct_quick: ['robot_correct_quick', 'gen_praise_1', 'gen_praise_4'],
    correct_logic: ['robot_correct_logic', 'gen_praise_2', 'gen_praise_3'],
    correct_streak: ['robot_correct_streak', 'streak_praise'],
    wrong_careless: ['robot_wrong_careless'],
    wrong_encourage: ['robot_wrong_encourage', 'gen_encourage_1', 'gen_encourage_2'],
    complete: ['lesson_done_fanfare', 'robot_done'],
    hint: ['hint_help_prompt']
  },
  turtle: {
    welcome: ['turtle_welcome_1', 'turtle_welcome_2'],
    correct_quick: ['turtle_correct_1', 'gen_praise_1'],
    correct_logic: ['turtle_correct_logic', 'gen_praise_2', 'gen_praise_3'],
    correct_streak: ['turtle_correct_streak', 'streak_praise'],
    wrong_careless: ['turtle_wrong_careless'],
    wrong_encourage: ['turtle_wrong_encourage', 'gen_encourage_1', 'gen_encourage_3'],
    complete: ['lesson_done_fanfare'],
    hint: ['hint_help_prompt']
  },
  owl: {
    welcome: ['owl_welcome_1', 'owl_welcome_2'],
    correct_quick: ['owl_correct_1', 'gen_praise_1'],
    correct_logic: ['owl_correct_logic', 'gen_praise_2', 'gen_praise_3'],
    correct_streak: ['owl_correct_streak', 'streak_praise'],
    wrong_careless: ['owl_wrong_careless'],
    wrong_encourage: ['owl_wrong_encourage', 'gen_encourage_1', 'gen_encourage_2'],
    complete: ['lesson_done_fanfare'],
    hint: ['hint_help_prompt']
  },
  shark: {
    welcome: ['shark_welcome_1'],
    correct_quick: ['shark_correct_1', 'gen_praise_1'],
    correct_logic: ['shark_correct_1', 'gen_praise_2'],
    correct_streak: ['shark_correct_streak', 'streak_praise'],
    wrong_careless: ['shark_wrong_careless'],
    wrong_encourage: ['shark_wrong_encourage', 'gen_encourage_3'],
    complete: ['lesson_done_fanfare'],
    hint: ['hint_help_prompt']
  },
  general: {
    correct: ['gen_praise_1', 'gen_praise_2', 'gen_praise_3', 'gen_praise_4'],
    encourage: ['gen_encourage_1', 'gen_encourage_2', 'gen_encourage_3'],
    complete: ['lesson_done_fanfare'],
    hint: ['hint_help_prompt']
  }
};

// Lịch sử phát gần nhất để chống lặp lại
const recentPlayedIds = [];
const MAX_RECENT_HISTORY = 6;

/**
 * Chọn 1 audio ID từ danh sách ứng viên, tránh trùng lặp với các câu vừa phát.
 * @param {string[]} candidates 
 * @returns {string|null}
 */
export function pickNonRepeatingAudioId(candidates) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Lọc các item chưa phát gần đây
  const freshItems = candidates.filter(id => !recentPlayedIds.includes(id));
  const pool = freshItems.length > 0 ? freshItems : candidates;
  
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  // Cập nhật history
  recentPlayedIds.push(chosen);
  if (recentPlayedIds.length > MAX_RECENT_HISTORY) {
    recentPlayedIds.shift();
  }

  return chosen;
}

let activeAudioEl = null;

/**
 * Dừng âm thanh đang phát (cả Audio element lẫn SpeechSynthesis).
 */
export function stopAllAudio() {
  if (activeAudioEl) {
    try {
      activeAudioEl.pause();
      activeAudioEl.currentTime = 0;
    } catch {
      // Ignore
    }
    activeAudioEl = null;
  }
  cancelSpeech();
}

/**
 * Phát trực tiếp 1 file audio theo ID trong public/audio/mascot/
 * @param {string} audioId 
 * @param {object} callbacks 
 * @returns {boolean} True nếu phát thành công
 */
export function playAudioById(audioId, { onStart = null, onEnd = null } = {}) {
  stopAllAudio();
  if (!audioId) return false;

  const audioPath = `/audio/mascot/${audioId}.wav`;
  try {
    const audio = new Audio(audioPath);
    activeAudioEl = audio;
    audio.onplay = () => {
      if (onStart) onStart();
    };
    audio.onended = () => {
      activeAudioEl = null;
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      activeAudioEl = null;
      if (onEnd) onEnd();
    };
    audio.play().catch(() => {
      activeAudioEl = null;
      if (onEnd) onEnd();
    });
    return true;
  } catch (err) {
    console.warn('Failed to play audio:', audioPath, err);
    return false;
  }
}

/**
 * Phát phản hồi thông minh theo Mascot và Danh mục hành vi.
 * 
 * @param {object} params
 * @param {string} params.mascotId - 'robot' | 'turtle' | 'owl' | 'shark'
 * @param {string} params.category - 'welcome' | 'correct_quick' | 'correct_logic' | 'correct_streak' | 'wrong_careless' | 'wrong_encourage' | 'complete' | 'hint'
 * @param {string} [params.fallbackText] - Văn bản thay thế nếu không tìm thấy file audio
 * @param {function} [params.onStart]
 * @param {function} [params.onEnd]
 */
export function playMascotReaction({
  mascotId = 'robot',
  category = 'welcome',
  fallbackText = '',
  onStart = null,
  onEnd = null
}) {
  const mascotBank = MASCOT_AUDIO_CATALOG[mascotId] || MASCOT_AUDIO_CATALOG.general;
  const candidates = mascotBank[category] || MASCOT_AUDIO_CATALOG.general[category] || [];

  const audioId = pickNonRepeatingAudioId(candidates);

  if (audioId) {
    const success = playAudioById(audioId, { onStart, onEnd });
    if (success) return;
  }

  // Nếu không có audio file tương ứng -> Fallback sang SpeechSynthesis
  if (fallbackText) {
    speakText(fallbackText, 0.95, onStart, onEnd);
  } else if (onEnd) {
    onEnd();
  }
}

export { normalizeMathSpeech, selectBestVietnameseVoice };
