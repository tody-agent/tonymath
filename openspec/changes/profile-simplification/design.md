# Design: Đơn giản hóa và Tối ưu hóa Trang Hồ sơ Học sinh (Profile Redesign)

## Context & Technical Approach

Currently, the profile panel in TonyMath is a long bottom sheet displaying student avatar selection, class level settings, reminders, challenge options, and reset buttons in a flat list. This mixed interface creates cognitive overload for kids and introduces the risk of children accidentally resetting their progress or changing their grade.

We will redesign this page into a dual-persona workspace:
1. **Kid Profile View (Default)**: Displays level status (XP progress bar), daily learning streaks (flame icon), mascot companions with speech bubble interaction, and a badge collection drawer.
2. **Parent & Teacher Settings (Protected)**: Securely separated behind a dynamic math verification gate (e.g. `Mẹ tính giúp con: 7 x 8 = ?`), preventing child tampering. It holds curricular selectors, study speed configs, alarms, and reset/dev tools.

---

## Proposed Changes

### UI Styles

#### [MODIFY] [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
Add classes for:
* `.profile-tab-header` and `.profile-tab-btn` (Tab navigation)
* `.profile-kid-header`, `.profile-level-badge`, `.profile-xp-bar`, `.profile-xp-fill` (Kid stats)
* `.profile-streak-box`, `.profile-streak-fire` (Flame streak container)
* `.profile-mascot-speech` (Mascot dialogue box)
* `.profile-badges-grid`, `.profile-badge-card`, `.profile-badge-popover` (Huy hiệu)
* `.math-gate-panel`, `.math-gate-num-pad`, `.math-gate-shake` (Math Gate UI)

### Application Logic

#### [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
* Add react states: `profileTab` (`'kid'`), `showMathGate` (`false`), `mathGateQuestion` (`null`), `mathGateInput` (`''`), `mathGateError` (`''`), `selectedBadgeInfo` (`null`), `mascotSpeechBubble` (`''`).
* Implement a math-gate generator logic: choose random single-digits $a, b \in [2..9]$ and calculate the product $a \times b$. If verification succeeds, set active tab to `'parent'`.
* Bind the interactive companion mascot cards to speak their personalized lines using Speech Synthesis, and display the speech bubble on-screen for 5 seconds.
* Map `ACHIEVEMENT_DEFINITIONS` to render a grid of badges. Gray out locked badges. Bind click events on badges to display target/current metrics and custom advice from the active mascot.

---

## Verification

### Automated Tests
* Run `npm run test` or `vitest` to verify no breaking syntax issues.

### Manual Verification
* Click profile avatar 👦. Verify child information cards (XP progress, Level, Streak) display correctly.
* Choose robot companion 🤖. Confirm voice synthesized speech sounds like a robot, and text box dialogue displays.
* Open "Góc Phụ huynh". Try inputting wrong answer to verify shake animation and warning. Input right answer to verify transition to parent settings.
* Test toggling grades, reminders, and back navigating to kid tab. Verify state updates.
