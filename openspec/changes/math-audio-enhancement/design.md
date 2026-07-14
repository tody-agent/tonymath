# Design: Browser-Based Sound Effects and Text-to-Speech

## Context & Technical Approach
The application is a Vietnamese math learning tool for young children ("Học Toán Vui"). Since young kids are still developing their reading skills, having the option to listen to word problems, instructions, and feedback is vital. Additionally, playful audio feedback (success chimes, failure buzzes, click responses) significantly increases gamification and child engagement.

To keep the application lightweight, offline-ready, and fast, we will:
1. Use the **Web Audio API** to synthetically generate sound effects (clicks, correct/incorrect tones, and a victory fanfare). This completely avoids loading or hosting external MP3 files.
2. Utilize the native browser **SpeechSynthesis API** to build a configurable Vietnamese TTS reader.
3. Save user speech preferences (muted, auto-read, speed) to `localStorage` so parents can adjust settings once and persist them.

---

## Proposed Changes

### 1. Audio Engine and Utility

#### [NEW] [audio.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/audio.js)
This file will contain the standalone audio synthesis and text-to-speech engine.

- **`playSfx(type)`**:
  - Lazily initializes `AudioContext` on first call (requires user action like button click to prevent browser autoplay warnings).
  - Synthesizes sound waves dynamically:
    - `click`: Short pitch drop using a sine oscillator (duration ~0.08s, start frequency 1000Hz down to 200Hz).
    - `correct`: Ascending arpeggio chime (e.g. notes C5, E5, G5, C6 played sequentially with smooth envelope decay).
    - `wrong`: A buzzer effect using a sawtooth wave (duration ~0.25s, start frequency 150Hz down to 80Hz, coupled with a lowpass filter).
    - `complete`: A cheerful short fanfare (e.g., C5 -> E5 -> G5 -> C6 melody with slightly longer decay).
- **`speakText(text, rate, onStart, onEnd)`**:
  - Wraps browser `window.speechSynthesis`.
  - Automatically cancels any ongoing speech (`window.speechSynthesis.cancel()`).
  - Queries `speechSynthesis.getVoices()`. Filters for voices matching Vietnamese (`vi-VN` or `vi`).
    - Prefers local system voices (fastest/works offline).
    - Falls back to cloud voices (e.g. Google Vietnamese) or default voice.
  - Sets the utterance rate (`rate`), pitch (`1.0`), and language (`vi-VN`).
  - Implements the Chrome keep-alive bugfix: runs a recurring `10` second interval that calls `pause()` and `resume()` to prevent Chrome from silently cutting off speech after 15s.
  - Exposes `cancelSpeech()` to immediately cancel speech synthesis.

### 2. Main Interface and State Configuration

#### [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
- **Settings State**:
  - Introduce state `audioSettings` initialized from `localStorage` (`hoc-toan-vui-audio-settings-v1`).
  - Default settings: `{ autoRead: true, rate: 0.95, muted: false }`.
- **Settings Panel UI**:
  - Add an Audio Controls Dropdown/Menu inside the Topbar (`top-stats` section).
  - Include:
    - Checkbox/Toggle for "Tự động đọc bài" (Auto-Read).
    - Rate Selector buttons: "Chậm" (rate = 0.75), "Vừa" (rate = 0.95), "Nhanh" (rate = 1.15).
    - Mute Toggle button (speaker icon with cross line).
- **Integrate Sound Effects**:
  - Connect option selectors, step navigation buttons, and tab controls to `playSfx('click')`.
  - Play `playSfx('correct')` or `playSfx('wrong')` in the step validation handler (`validateStep()`).
  - Play `playSfx('complete')` inside the `CompleteView` component mount hook or transition state.
- **Integrate Auto-Read TTS**:
  - Use `useEffect` triggered by `step` transitions. If `autoRead` is enabled and not `muted`, construct clean Vietnamese text to read out for the step and invoke `speakText`.
  - When `feedback` is updated, read the feedback message ("Chính xác! [message]" or "Thử lại nhé! [message]") to immediately reinforce learning.
- **Integrate Manual Play Buttons (`🔊`)**:
  - Add speaker icon buttons next to:
    - Step instruction titles.
    - Options (so kids can listen to each answer before selecting).
    - Facts (reads each fact text).
    - Hints (reads the text inside the hint panel).
    - Feedback messages.

### 3. Styles

#### [MODIFY] [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
- Style the sound settings trigger button and popover overlay (clean borders, modern layout, matching the primary rounded design language).
- Style the inline speaker buttons (`🔊`) to be small, round, child-friendly, and placed neatly next to questions or options without breaking layouts (e.g. `display: inline-flex; align-items: center; justify-content: center;`).

---

## Verification

### Manual UI/Audio Test
- Verify correct sounds play on:
  - Correct answer (chime).
  - Incorrect answer (buzz).
  - Button click (pop click).
  - Success screen (fanfare).
- Verify TTS behaves correctly:
  - Automatically speaks when starting/advancing steps.
  - Manual `🔊` buttons cancel current speech and start new speech immediately.
  - Modifying rate selector (Chậm / Vừa / Nhanh) directly impacts the speech rate.
  - Toggling auto-read off disables autoplay but keeps manual speakers active.
  - Mute toggles off all sounds.
