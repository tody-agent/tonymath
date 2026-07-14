# Implementation Checklist

## Phase 1: Core Sound and Speech Engine
- [ ] 1.1 Create `src/audio.js` containing synthesizer for sfx (`playSfx`) and SpeechSynthesis engine (`speakText`, `cancelSpeech`, Chrome keep-alive, voice detection).
- [ ] 1.2 Validate that `src/audio.js` compiles correctly and checks out syntax-wise.

## Phase 2: React State and Topbar Settings Panel
- [ ] 2.1 Add state for `audioSettings` in `src/App.jsx` and load/save configuration using `localStorage`.
- [ ] 2.2 Implement the Sound Settings Panel/Button in the header (Auto-read, Speed/Rate control, Mute toggle).
- [ ] 2.3 Style the Sound Settings panel and drop-down menu in `src/App.css`.

## Phase 3: Sound Effects Integration
- [ ] 3.1 Hook up `playSfx('click')` to common interactions (options, step changes, tabs).
- [ ] 3.2 Hook up `playSfx('correct')` and `playSfx('wrong')` to the `validateStep()` outcome.
- [ ] 3.3 Hook up `playSfx('complete')` to the mounting or transition into `CompleteView`.

## Phase 4: Text-To-Speech (TTS) Integration & Manual Controls
- [ ] 4.1 Write step-aware text generation helper and trigger auto-speech inside `useEffect` watching the `step` index.
- [ ] 4.2 Play feedback message speech automatically when checking answers.
- [ ] 4.3 Add inline speaker buttons `🔊` beside questions, options, hints, and feedback, styling them cleanly.
- [ ] 4.4 Ensure new speech actions cancel any ongoing speech cleanly.

## Phase 5: Verification & Walkthrough
- [ ] 5.1 Run Vite local build (`npm run build`) to verify bundler success.
- [ ] 5.2 Manually verify clicking sounds, correct/incorrect sound feedback, victory fanfare, auto-read triggers, speed changes, and speaker buttons.
- [ ] 5.3 Write walkthrough summary documenting implementation details.
