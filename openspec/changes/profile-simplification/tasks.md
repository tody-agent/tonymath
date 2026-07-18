# Implementation Checklist: Profile Redesign

- [ ] **1. CSS Styling Setup**
  - [ ] 1.1 Add tab headers and transition animations in `App.css`.
  - [ ] 1.2 Add kid metrics layout classes (level, XP progression bar, streak fire).
  - [ ] 1.3 Add mascot choice grids, voice preview bubble wrappers, and badge collection grids (including locked state styling).
  - [ ] 1.4 Add Math Gate panel and verification shake keyframes.

- [ ] **2. State & Logic Integration**
  - [ ] 2.1 Define states for `profileTab`, `showMathGate`, `mathGateQuestion`, `mathGateInput`, `mathGateError`, `selectedBadgeInfo`, and `mascotSpeechBubble` in `App.jsx`.
  - [ ] 2.2 Implement `generateMathQuestion()` and `handleVerifyMathGate()` actions.
  - [ ] 2.3 Set up a Mascot TTS speaker hook or function that triggers Web Speech Synthesis, using mascot profile pitches/rates, alongside a 5-second disappearing speech bubble state.

- [ ] **3. UI Rendering & Structuring**
  - [ ] 3.1 Restructure `menuOpen` Bottom Sheet layout using tab toggling.
  - [ ] 3.2 Implement `profileTab === 'kid'` panel with level stats, streak badge, speech-bubble-interactive mascots, badge gallery, and "Góc Phụ huynh" button.
  - [ ] 3.3 Implement `profileTab === 'parent'` panel displaying curricular, alarm, challenge switches, and dev/reset settings behind a parent gate dialog wrapper.
  - [ ] 3.4 Wire badge click detail overlays and math verification panel displays.

- [ ] **4. Verification**
  - [ ] 4.1 Verify styling layouts are responsive across mobile & desktop dimensions.
  - [ ] 4.2 Validate Math Gate triggers, failure warnings, and successful unlocks.
  - [ ] 4.3 Test Mascot selections, dialog bubble appearance, and speech speech synthesis audio.
  - [ ] 4.4 Run unit tests (`npm run test`) to confirm no regressions.
