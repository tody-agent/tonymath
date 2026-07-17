# Design: Audit Math Lessons & Fix Logic UX

## Context & Technical Approach
We want to ensure that all math lesson exercises and solutions are 100% correct and mathematically sound, and that logical/comparison questions (non-calculation) do not force children to input a dummy `0` for the calculation step.

### Approach
1. **Frontend**: Adapt the step sequence in `src/App.jsx` to dynamically skip Step 5 (Tự tính) if the lesson has no numeric calculation (`lesson.skill === 'Suy luận logic' || lesson.answer === 0`).
2. **CI/CD pipeline**: Add a new verification step (`scripts/audit-lessons.js`) inside `scripts/test-gate.js` to mathematically evaluate operations and compare against the expected answers.

## Proposed Changes

### Stepper Flow

#### [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
- In `nextStep()`: If advancing to step 5, and the lesson is logical or answer is 0, skip to step 6.
- In `isStepAnswered()`: If step is 5 and the lesson is logical or answer is 0, return `true`.
- In `validateStep()`: If step is 5 and the lesson is logical or answer is 0, auto-validate and return `true`.

### Automated Verification

#### [audit-lessons.js](file:///Volumes/Data/Kids/hoc-toan-vui/scripts/audit-lessons.js) [NEW]
- Read `public/lessons/grade-4/math.json`.
- Verify field availability, array boundaries, math correctness of `operations[correctOperation]`, and visual compare data rules.

#### [test-gate.js](file:///Volumes/Data/Kids/hoc-toan-vui/scripts/test-gate.js)
- Hook `node scripts/audit-lessons.js` into Gate 3 of the release gates.

## Verification
- Run `node scripts/test-gate.js` to execute linting, unit tests, and lessons audit checks.
