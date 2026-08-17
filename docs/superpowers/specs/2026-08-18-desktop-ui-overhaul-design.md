# Specification: Desktop Pro Learning Hub UI Overhaul (TonyMath)

**Date:** 2026-08-18  
**Target:** Desktop & Tablet Landscape Viewports (>= 881px, optimized for 1440px / 1920px)  
**Framework:** React 19 + Vanilla CSS  
**Design Philosophy:** Steve Krug's "Don't Make Me Think" (SaaS Usability) & Anti-Slop High-Performance Design System  

---

## 1. Executive Summary & Goals

The goal of this overhaul is to transform the TonyMath desktop interface from a mobile-stretched single-column layout into a modern **Desktop Pro Learning Hub**. 

### Primary User Goals:
- **Kids / Learners:** Seamlessly navigate between curriculum learning, timed arena challenges, AI mascot conversations, and daily quests without endless vertical scrolling.
- **Parents:** Monitor learning analytics, skill masteries, strengths/weaknesses, and configure settings in a structured 2-pane dashboard.
- **Accessibility & Ergonomics:** Full keyboard accessibility (Enter / 1-4 keys), high legibility typography, clear information hierarchy, and zero layout overflows.

---

## 2. Information Architecture & Navigation

### 2.1 Sidebar Navigation Structure (`.sidebar`)
On desktop viewports (`min-width: 881px`), the sidebar will feature structured groups:

```
├── 📚 HỌC TẬP (Learning)
│   ├── 🏠 Trang chủ (Home - `view === 'home'`)
│   ├── 🗺️ Chủ đề bài học (Topics Menu - `view === 'lessons-menu'`)
│   ├── ⏱️ Đấu trường 60s (Arena - `view === 'arena'`)
│   └── 🦉 Bạn học Cú Ú (AI Buddy - `view === 'buddy'`)
│
├── 🏆 THÀNH TÍCH (Achievements)
│   ├── 🎯 Nhiệm vụ hàng ngày (Quests - `view === 'quests'`)
│   ├── 🥇 Bảng vàng (Leaderboard - `view === 'leaderboard'`)
│   └── 📓 Sổ tay lỗi sai (Review List - `view === 'review-list'`)
│
└── ⚙️ CÁ NHÂN (Account & Settings)
    ├── 📊 Hồ sơ & Năng lực (Progress - `view === 'progress'`)
    └── ⚙️ Cài đặt phụ huynh (Settings Modal / View)
```

- **Bottom Companion Widget (`.sidebar-companion-widget`):** Interactive Mascot card with mood speech, avatar animation, and quick "Học tiếp" CTA.

---

## 3. Screen Specifications

### 3.1 Home Dashboard (`Home`)
- **Layout:** 2-Column Split Dashboard (`grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; max-width: 1400px; margin: 0 auto;`).
- **Main Column (Left):**
  1. **Hero Welcome Banner:** Greeting with child's name, active streak flame, level badge, and mascot avatar.
  2. **Continue Learning Spotlight Card:** Clear "Tiếp tục bài học" with progress indicator, lesson title, and instant "Bắt đầu học" button.
  3. **Curriculum Roadmap (Chapter Islands):** Group 90 lessons into 3 distinct Chapters (Chương I: Khởi động, Chương II: Tăng tốc, Chương III: Chinh phục). Render lessons in a modern 4-5 column responsive grid per chapter with star ratings, lock states, and completion checkmarks.
- **Sidecar Column (Right Panel):**
  1. **🎯 Daily Quests Widget:** Progress bar (`X/3 hoàn thành`), quick quest list with live checkboxes and XP badges.
  2. **⏱️ Speed Arena Widget:** Quick CTA to start 60s math sprint with high-score showcase.
  3. **🥇 Leaderboard Mini Widget:** Top 3 students this week with avatar & XP badges.
  4. **📓 Mistake Notebook Widget:** Badge indicating weak topics needing review.

### 3.2 Topics Menu (`LessonsMenu`)
- **Layout:** Responsive 3-Column Chapter Grid.
- **Card Design:** Topic cards with thumbnail icon, chapter badge, lesson count, progress bar, and difficulty chips.
- **Grade & Chapter Filter Bar:** Sticky header with quick tabs to switch grades (Lớp 1 - Lớp 5) and chapters.

### 3.3 Interactive Lesson Workspace (`LessonView`)
- **Layout:** 2-Column Desktop Workspace (`grid-template-columns: 280px minmax(0, 1fr); gap: 24px; max-width: 1360px;`).
- **Left Column:** Sticky Stepper Panel (Steps 1 to 8: Nhìn hình, Kể lại, Đã biết/cần tìm, Chọn mô hình, Phép tính, Tự tính, Câu trả lời, Kiểm tra) with clear active/completed styling, plus AI Mascot coaching notes.
- **Right Column (Exercise Container):**
  - Story box with audio reader toggle button.
  - Visual diagram canvas (bar charts, unknown cards, ratio scales) centered with optimal sizing and vibrant tokens.
  - Interactive choices / facts cards / formula keypad in a structured grid.
  - **Integrated Action Footer:** Fixed at the bottom of the card with "Quay lại" and "Kiểm tra / Tiếp tục" buttons + Keyboard shortcut badge `[Enter ↵]`.

### 3.4 Speed Math Arena (`ArenaView`)
- **Layout:** Game Hub Cockpit on Desktop (`max-width: 960px; margin: 0 auto;`).
- **Elements:**
  - Header: Timer dial (60s countdown), Combo multiplier (`x2`, `x3`), Score & Accuracy meter.
  - Main Game Card: Big math equation display, large clean input field, number pad + full keyboard support.
  - Mascot live reactions (Cheering on streaks, encouraging on misses).

### 3.5 AI Tutor Buddy (`BuddyView`)
- **Layout:** 2-Column Split Workspace (`grid-template-columns: 1fr 1fr; max-width: 1200px;`).
- **Left Column:** Mascot Dialogue Card with speech bubble, character portrait, and voice play button.
- **Right Column:** Question Statement & Interactive Feedback buttons (`👍 Mascot đúng rồi`, `👎 Có lỗi sai nha!`) + Explanation review.

### 3.6 Progress & Insights Analytics (`InsightsView`)
- **Attribute Bars Fix:** Fix CSS flex/grid in `.hero-stats-card` so percentage labels ("100%") and level text ("Cấp 1") never clip or wrap.
- **Skill Map:** 3-Column balanced grid of math topics with chapter tags and mastery percentage badges.
- **Achievements Gallery:** 4-Column trophy grid with hover tooltips and glowing unlock effects.

### 3.7 Parent Settings Modal (`Profile & Settings`)
- **Layout:** Desktop Master-Detail Modal (`width: 860px; min-height: 540px; display: grid; grid-template-columns: 220px 1fr;`).
- **Left Pane:** Tabs (👦 Thông tin bé, 🎓 Lớp & Môn học, ⏱️ Chế độ học tập, 🔔 Nhắc nhở, 🔒 Dành cho Phụ huynh, ⚙️ Nâng cao & Dữ liệu).
- **Right Pane:** Settings controls with clear switches, sliders, grade pickers, and math security gate.

### 3.8 PWA Banner Desktop Optimization
- Positioned non-intrusively in the bottom-right corner with a sleek floating pill style that collapses when minimized and never overlays interactive modal buttons.

---

## 4. Technical Implementation & Quality Gates

- **CSS Variables & Tokens:** Rely on existing tokens (`--primary`, `--surface`, `--line`, `--radius-lg`, `--shadow-soft`, `--font`).
- **No Third-Party CSS Frameworks:** Pure Vanilla CSS adhering to the project's zero-dependency design system.
- **Verification Gates:**
  1. `npm run lint` / `oxlint` clean.
  2. `npm run test:gate` / `node scripts/test-gate.js` all 6 gates PASS.
  3. Chrome DevTools visual screenshot verification for all screens on 1440x900 desktop viewport.
