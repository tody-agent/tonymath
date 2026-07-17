# Design: Personalization & Layout Redesign

## Context & Technical Approach
We are separating the Trang chủ (Home) view from the Bài học (Lessons Menu) view, and enhancing the personalization display for the 60 math lessons.

1. **View Separation**:
   - `view === 'home'`: Displays the Personalized Dashboard (Mascot advice, Next lesson card, Recently studied lesson card, Review recommendations card, and the Quest Board).
   - `view === 'lessons-menu'`: Displays the full list of 60 lessons with Class/Subject selectors, progress counters, and unlocked/completed status.

2. **Personalization Logic**:
   - **Next Recommended**: Handled by `learningPlan.primary`.
   - **Recently Studied**: Found by checking the most recent `lastPlayedAt` in `progress.attempts` across the lessons of the current grade/subject.
   - **Recommended Reviews**: List of lessons needing review from `learningPlan.reviews` (e.g. low stars or high mistakes).

## Proposed Changes

### [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
- Update NavButtons in desktop sidebar and mobile bottom nav to point "Bài học" to `setView('lessons-menu')` instead of `home`.
- Redesign the `Home` view to show the personalized dashboard:
  - Big mascot companion guidance card.
  - Three-column "Personalized Learning Plan" (Lịch học cá nhân hóa):
    - **Bài học tiếp theo**: Highlighted card with mascot speech advice, CTA "Học tiếp".
    - **Bài vừa học**: Details of recently studied card, CTA "Học lại".
    - **Bài cần ôn tập**: Top review lesson from `learningPlan.reviews`, CTA "Ôn tập".
  - Quest Board:
    - Main Journey card redirects to `lessons-menu` instead of changing tab.
- Implement the `LessonsMenu` component:
  - Class/Subject selectors at the top.
  - Progress counters.
  - Full grid of 60 lessons.
- Register `lessons-menu` view in App shell rendering.

### [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
- Style the new personalized learning cards on Trang chủ.
- Add grid/flex styles for dashboard layout.

## Verification
- Validate code compilation and run oxlint linter.
- Run unit tests to verify no regressions in state transitions.
- Verify in browser that the navigation button "Bài học" goes to full menu, and "Trang chủ" shows personalized suggestions.
