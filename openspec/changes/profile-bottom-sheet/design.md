# Design: Profile Settings Bottom Sheet Redesign

## Context & Technical Approach

The current dropdown profile menu is too small and difficult to navigate on mobile devices. Standard `<select>` elements and checkboxes are tiny and not kid-friendly. We will redesign it into a full-featured, responsive bottom sheet modal on mobile and a centered modal on desktop.

Key enhancements:
1. **Backdrop & Backdrop Blur**: A fixed fullscreen backdrop overlay that dim-blurs the background and dismisses the panel when clicked outside.
2. **Interactive Mascot Cards**: Instead of a simple dropdown, render cards for "Cú Ú", "Rô Bốt", and "Rùa Con" with their respective emojis and a selected outline/glow state.
3. **Grade and Subject Pills**: Use easy-to-tap interactive buttons/pills to select the grade (Lớp 1 to Lớp 5) and subject (Toán học, Tiếng Anh).
4. **Responsive Layout**:
   - Mobile: Slides up from the bottom with a drag handle, covers 92vh height.
   - Desktop: Centers as a modern, wide card modal dialog (540px width).
5. **Fluent Animations**: Smooth slide-in, fade-in, and card selection animations using CSS transition transforms.

## Proposed Changes

### UI Styles

#### [MODIFY] [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
- Define variables and rules for:
  - `.profile-sheet-overlay`: backdrop with blur and backdrop-filter.
  - `.profile-sheet-panel`: the modal panel itself with animations.
  - Custom selector card styles: `.mascot-select-card`, `.grade-select-pill`, `.subject-select-pill`, `.study-mode-pill`.
  - Toggle switch styles for reminders and challenge mode.
  - Animation keyframes for sliding up from the bottom.

### Application Logic

#### [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
- Adapt the menu toggle render logic.
- Replace the legacy profile dropdown element with the new bottom-sheet component.
- Integrate selection click handlers that update standard state values (`currentGrade`, `currentSubject`, mascot, studyMode, etc.) and play sfx feedback.
- Bind `esc` keyboard event listener to close the sheet.
- Implement click-outside backdrop to dismiss.

## Verification

### Manual UI Verification
- Open settings on mobile viewport (Chrome DevTools responsive mode) and verify it takes up the bottom half/majority of the viewport and has rounded top corners.
- Verify desktop viewport centers the modal.
- Verify clicking mascot cards, grade pills, subject pills, checkboxes and buttons updates local storage state immediately and triggers visual active state.
- Verify name change inputs function correctly.
