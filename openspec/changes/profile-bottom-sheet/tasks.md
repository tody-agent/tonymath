# Implementation Checklist

## Redesign CSS Styles
- [x] 1.1 Add styles for bottom sheet backdrop and layout panel in `src/App.css`
- [x] 1.2 Add responsive styles (bottom sheet on mobile, centered modal on desktop)
- [x] 1.3 Add custom styling for mascot selection cards and grade/subject select pills
- [x] 1.4 Add slide-up transition animations and active/focus state glow effects

## Update React Component UI
- [x] 2.1 Refactor the toggle wrapper of `menuOpen` to render bottom sheet overlay and panel in `src/App.jsx`
- [x] 2.2 Add top drag-bar design and close button logic in `src/App.jsx`
- [x] 2.3 Redesign name settings component with inline editor
- [x] 2.4 Implement card-grid for mascot selector
- [x] 2.5 Implement pill selection layouts for grade, subject, and study mode
- [x] 2.6 Implement backdrop and Esc click handler for light dismiss

## Verification & Testing
- [x] 3.1 Verify UI rendering behaves responsively across mobile and desktop sizes
- [x] 3.2 Verify select actions and save name functionality updates React states and triggers sound effects
