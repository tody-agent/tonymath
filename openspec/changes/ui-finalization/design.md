# Design: TonyMath Mobile UI Finalization & Gamification Align

## Context & Technical Approach
We want to finalize the UI/UX design of TonyMath's React frontend, bringing it to parity with the look-and-feel and structures demonstrated in the [tonymath-mobile-prototype.html](file:///Volumes/Data/Kids/hoc-toan-vui/tonymath-mobile-prototype.html) file.

The high-fidelity changes cover:
1. **Visual Learning Path (Zigzag Map)**:
   - Alternating padding/alignment columns for lesson nodes.
   - Pure CSS line path background connecting nodes.
   - Gold stars indicators for nodes.
2. **Mascot Lesson Intro Screen**:
   - Outlines facts (Known / Unknown) dynamically loaded from the active lesson object (`lesson.facts` and `lesson.factRoles`).
   - Friendly guide list summarizing the active study steps.
3. **Daily Quests Calendar**:
   - Interactive quest status.
   - Dynamic quest checker using current date and study progress.
   - Weekly calendar showing active/freeze days.
4. **Dedicated Mistake Review Screen**:
   - Clean view display under Profile or as a transition from Home.
   - Shows mistakes and allows re-taking lessons.

## Proposed Changes

### Styling Modifications
#### [MODIFY] [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
- Add CSS classes for `.path-line`, `.path-node`, `.node-btn` states (`done`, `current`, `locked`, `chest`, `boss`), and `.node-label`.
- Include CSS styles for `.intro-wrap`, `.fact`, `.fact.known`, `.fact.ask` for the preparation screen.
- Port styling for `.quest-item` and toggle buttons `.switch`.

### Main Application Logic
#### [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
- **State Additions**:
  - `view` transitions support: `view === 'intro'` and `view === 'review-list'`.
  - Mascot speech integration for the Intro Screen.
- **Component Additions**:
  - `IntroView` component to render before exercise starts.
  - `LearningPath` rendering dynamic nodes on `Home` screen.
  - `DailyQuests` list rendering dynamic metrics on `Home` screen.
  - `ReviewListView` component for viewing and retrying mistakes.

## Verification
- Lint check using `npm run lint`.
- Build verification using `npm run build`.
- Local browser test verification: clicking nodes, intro screen skip/play, daily quest checks, and mistake lists.
