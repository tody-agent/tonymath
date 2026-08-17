# Desktop Pro Learning Hub UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the TonyMath web app on Desktop viewports (>= 881px) into a modern, high-performance Desktop Pro Learning Hub with categorized sidebar navigation, 2-column home dashboard, 2-column lesson workspace, game hub arena, split buddy tutor, and 2-pane settings modal.

**Architecture:** Maintain existing React state architecture in `src/App.jsx` and styling tokens in `src/App.css`. Add modular desktop grid layouts, structured navigation groups, sidecar widget systems, and keyboard event handlers without breaking mobile responsiveness.

**Tech Stack:** React 19, Vanilla CSS (CSS Variables, Flexbox/Grid, Container Queries), Vite 8.

**Spec:** [docs/superpowers/specs/2026-08-18-desktop-ui-overhaul-design.md](file:///Volumes/Data/Kids/hoc-toan-vui/docs/superpowers/specs/2026-08-18-desktop-ui-overhaul-design.md)

## Global Constraints
- Do NOT break existing mobile layout (< 880px) and touch interactions.
- All 6 quality gates (`node scripts/test-gate.js`) must pass 100%.
- Zero lint errors (`npm run lint` / `oxlint`).
- Strictly adhere to Anti-Slop design guidelines: No generic purple glows, no clipped text, no textureless cards, high contrast and WCAG AA accessibility.

---

### Task 1: Desktop Shell, Topbar & Categorized Sidebar Navigation

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `view`, `setView`, `activeProgress`, `learningPlan`, `getMascotEmotion`
- Produces: Categorized Sidebar with navigation groups (`HỌC TẬP`, `THÀNH TÍCH`, `CÁ NHÂN`) and reactive mascot companion widget.

- [ ] **Step 1: Update App.jsx Sidebar Structure**
Organize `.sidebar nav` into 3 groups with section titles:
- `Học tập`: Home (`home`), Chủ đề (`lessons-menu`), Đấu trường (`arena`), Bạn Cú Ú (`buddy`)
- `Thành tích`: Nhiệm vụ (`quests`), Bảng vàng (`leaderboard`), Sổ tay sai (`review-list`)
- `Cá nhân`: Hồ sơ năng lực (`progress`), Cài đặt phụ huynh (`settings`)
Include badge counts on Quests (`activeQuests.length`) and Mistakes (`mistakesCount`).

- [ ] **Step 2: Update App.css for Sidebar & Topbar on Desktop**
Style `.sidebar-group`, `.sidebar-group-title`, `.nav-badge`, `.sidebar-companion-widget` for `min-width: 881px`.
Ensure `.sidebar` has clean scrollbar and sticky layout `top: 82px; height: calc(100vh - 82px)`.

- [ ] **Step 3: Run Syntax & Lint Checks**
Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 4: Commit Task 1**
```bash
git add src/App.jsx src/App.css
git commit -m "feat(desktop): add categorized sidebar navigation and pro desktop shell"
```

---

### Task 2: Home Desktop Split Dashboard (Roadmap + Right Sidecar)

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `lessons`, `progress`, `openLesson`, `plan`, `onOpenQuests`, `onOpenLeaderboard`, `onOpenArena`, `onOpenBuddy`, `onOpenReview`
- Produces: 2-Column Home Dashboard (`.home-dashboard-grid`), Chapter Island Cards, and Right Sidecar Widget Panel.

- [ ] **Step 1: Implement Desktop Chapter Island Groups in Home**
Group lessons into 3 distinct Chapter Accordions/Cards (Chương I: 1-30, Chương II: 31-60, Chương III: 61-90).
Render lessons inside each chapter in a clean 4-5 column desktop grid with star badges, lock status, and lesson names.

- [ ] **Step 2: Implement Right Sidecar Widgets on Desktop**
Create `.home-sidecar-panel` containing:
- `DailyQuestsWidget`: Quick quest completion preview with instant CTA.
- `SpeedArenaWidget`: Arena teaser card with best score and quick battle CTA.
- `LeaderboardWidget`: Top 3 rankers summary.
- `MascotCoachWidget`: Dynamic mascot advice with audio speech trigger.

- [ ] **Step 3: Add CSS for Home Split Dashboard in App.css**
Implement `.home-dashboard-layout`, `.chapter-island`, `.chapter-lessons-grid`, `.sidecar-widget`, `.widget-card`.

- [ ] **Step 4: Verify via Test Gate**
Run: `node scripts/test-gate.js`
Expected: All gates PASS.

- [ ] **Step 5: Commit Task 2**
```bash
git add src/App.jsx src/App.css
git commit -m "feat(desktop): implement 2-column home dashboard and chapter roadmap grid"
```

---

### Task 3: Desktop Topics Menu & Lesson Workspace

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `LessonView`, `StepContent`, `UnderstandStep`, `FactsStep`, `ModelStep`, `OperationStep`, `CalculationStep`
- Produces: Responsive 3-Column Topics Menu + 2-Column Lesson Workspace with integrated action buttons and keyboard support.

- [ ] **Step 1: Refactor LessonsMenu to 3-Column Topic Cards Grid**
On `min-width: 881px`, display topic categories in a responsive 3-column grid (`grid-template-columns: repeat(3, 1fr)`) with topic progress percentages and quick lesson jump chips.

- [ ] **Step 2: Refactor LessonView Desktop Workspace**
- Place Stepper list + Mascot coaching panel in sticky 280px left rail.
- Enlarge visual story diagram area (interactive bars, balance scales, unknown cards).
- Anchor `Quay lại` & `Kiểm tra / Tiếp tục` buttons inside the exercise card footer with `[Enter ↵]` shortcut support.
- Add `window.addEventListener('keydown')` for `Enter` (next/check) and `1-4` for multiple choices.

- [ ] **Step 3: Update App.css for Lesson Workspace**
Add `.lesson-workspace-desktop`, `.exercise-footer-actions`, `.key-badge`.

- [ ] **Step 4: Verify via Test Gate**
Run: `node scripts/test-gate.js`
Expected: All gates PASS.

- [ ] **Step 5: Commit Task 3**
```bash
git add src/App.jsx src/App.css
git commit -m "feat(desktop): optimize lessons menu grid and 2-column lesson workspace"
```

---

### Task 4: Speed Math Arena & AI Buddy Tutor Desktop Experiences

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `ArenaView`, `BuddyView`, `LeaderboardView`, `QuestsView`
- Produces: Cockpit Arena game hub and 2-column split Buddy tutor screen.

- [ ] **Step 1: Refactor ArenaView into Desktop Game Hub**
- Top cockpit dashboard: Circular/Card timer (60s), Streak combo multiplier meter (`x2`, `x3`, `x4 🔥`), Live score & accuracy.
- Large center problem card with prominent keypad and instant numeric keyboard focus.
- Mascot animated cheering reaction box on side.

- [ ] **Step 2: Refactor BuddyView into 2-Column Split Screen**
- Left pane: Mascot character illustration, speech bubble, and "Nghe Cú đọc" audio button.
- Right pane: Problem scenario card + Interactive assessment buttons (`👍 Mascot đúng rồi`, `👎 Có lỗi sai`) + Step-by-step reasoning reveal.

- [ ] **Step 3: Update QuestsView & LeaderboardView for Desktop**
- Replace full-width stretched cards with structured 2-column / card-deck layout on desktop.

- [ ] **Step 4: Add CSS styles in App.css**
Style `.arena-cockpit`, `.arena-hud`, `.buddy-split-layout`, `.leaderboard-desktop`.

- [ ] **Step 5: Commit Task 4**
```bash
git add src/App.jsx src/App.css
git commit -m "feat(desktop): create arena cockpit and 2-column AI buddy tutor"
```

---

### Task 5: Progress Analytics, 2-Pane Settings Modal & PWA Banner Polish

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

**Interfaces:**
- Consumes: `InsightsView`, `ProfileModal`, `ParentSettings`
- Produces: Fixed attribute bars, 3-column skill map, 4-column badge gallery, 2-pane parent settings modal, and floating non-intrusive PWA banner.

- [ ] **Step 1: Fix Hero Attribute Bars in InsightsView**
Fix flex layout so "Độ chính xác" (100%) and "Năng lượng bền bỉ" (Cấp 1) never wrap or clip.
Convert Skill Map to 3-Column responsive card grid and Achievements to 4-column trophy showcase.

- [ ] **Step 2: Refactor Settings / Profile Modal to 2-Pane Desktop Master-Detail**
On desktop (`min-width: 881px`):
- Width: 860px, height: 560px.
- Left tab bar: 👦 Thông tin bé, 🎓 Lớp & Môn học, ⏱️ Chế độ học tập, 🔔 Nhắc nhở, 🔒 Dành cho Phụ huynh, ⚙️ Dữ liệu.
- Right content pane: Smooth switching between settings panels.

- [ ] **Step 3: Relocate & Style PWA Install Banner**
Position PWA banner in bottom right as a sleek collapsible pill with a close/minimize button, preventing content obscuration.

- [ ] **Step 4: Run Gate Verification**
Run: `node scripts/test-gate.js`
Expected: All 6 gates PASS.

- [ ] **Step 5: Commit Task 5**
```bash
git add src/App.jsx src/App.css
git commit -m "feat(desktop): upgrade insights analytics, 2-pane settings modal and PWA banner"
```

---

### Task 6: Visual Screenshot Verification & End-to-End Gate Check

**Files:**
- Test scripts: `scripts/test-gate.js`
- Screenshots: `tmp/desktop-audit/*.png`

- [ ] **Step 1: Run Full Test Gate Suite**
Run: `npm run test:gate`
Verify: All 6 gates green (Lint, Logic tests, PWA manifest, Mom Test, Lesson Data, Build).

- [ ] **Step 2: Take DevTools Desktop Screenshots across All Views**
Capture 1440x900 screenshots:
- `01_home_desktop_v2.png`
- `02_lessons_menu_v2.png`
- `03_lesson_step_v2.png`
- `04_arena_v2.png`
- `05_buddy_v2.png`
- `06_progress_v2.png`
- `07_settings_modal_v2.png`
- `08_quests_v2.png`

- [ ] **Step 3: Inspect & Confirm Usability Polish**
Verify each screenshot against Steve Krug's "Don't Make Me Think" checklist and Anti-Slop criteria.
