# Design: Mascot-Driven Speech & Dialogue Variety

## Context & Technical Approach
Currently, the application speaks static success and error prompts (`Chính xác! ...` and `Thử lại nhé! ...`) which quickly become repetitive and boring. To solve this, we will introduce a **Mascot Persona Dialogue Engine**.
Each mascot (`robot`, `turtle`, `owl`) will have unique dialogue lines (Vietnamese), voice speed, and voice pitch:
- **Robot (🤖 Rô Bốt)**: High-energy, game/tech vocabulary, higher pitch (`1.25`), slightly faster rate (`1.05` multiplier).
- **Turtle (🐢 Rùa Con)**: Patient, warm, comforting vocabulary, lower pitch (`0.85`), slower rate (`0.88` multiplier).
- **Owl (🦉 Cú Ú)**: Logical, analytical, calm vocabulary, default pitch (`1.0`), standard rate (`0.95` multiplier).

We will add a profile select element to the settings sidebar, allowing kids to switch their learning buddy anytime.

## Proposed Changes

### 1. New Mascot Dialogue Configuration
#### [NEW] [mascotDialogs.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/mascotDialogs.js)
- Contains detailed vocabularies: `praiseExclamations`, `praiseTemplates`, `encourageExclamations`, `encourageTemplates` for each mascot.
- Exports a helper `getMascotSpeech(mascot, isCorrect, originalMessage)` that dynamically picks one exclamation and one template, concatenating them with the core message.
- Exports `MASCOT_PROFILES` with speed and pitch attributes for each mascot.

### 2. Audio Service Update
#### [MODIFY] [audio.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/audio.js)
- Accept `pitch` as an optional fifth parameter in `speakText(text, rate, onStart, onEnd, pitch)`:
  ```js
  export function speakText(text, rate = 0.95, onStart = null, onEnd = null, pitch = 1.0) {
    ...
    utterance.pitch = pitch;
    ...
  }
  ```

### 3. Application State & UI
#### [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
- Import `getMascotSpeech` and `MASCOT_PROFILES` from `./mascotDialogs.js`.
- In `markAttempt`, replace the hardcoded feedback text assignment with a call to `getMascotSpeech(mascot, isCorrect, message)`.
- In the feedback speech `useEffect`, dynamically read the mascot's configuration:
  ```js
  const mascot = progress.profile?.mascot || 'owl';
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const baseRate = resolveSpeechRate(audioSettings.speed);
  const rate = baseRate * (profile.rateOffset || 1.0);
  const pitch = profile.pitch || 1.0;
  speakText(feedback.message, rate, null, null, pitch);
  ```
- In the settings sidebar panel, replace the static text `Cố vấn: Rô Bốt/Rùa Con/Cú Ú` with an interactive `<select>` element so kids can change their companion.

### 4. Tests
#### [MODIFY] [utils.test.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/utils.test.js)
- Add tests to ensure `getMascotSpeech` returns a non-empty string and resolves options for all three mascots.

## Verification
- Run local unit tests: `node src/utils.test.js` or `npm test`.
- Manually run Vite dev server, change companion in settings, verify speech rate, pitch, and vocab differences.
