# Design: Onboarding Test & Assessment

## Context & Technical Approach
The user wants to replace the current fixed 8-step tutorial onboarding with a diagnostic placement test.
The test should:
1. Assess the child's academic level.
2. Include 8 questions in total.
3. Feature medium/easy questions overall, but insert two moderate challenge questions at positions 4 and 8.
4. Encourage and motivate the child using the chosen mascot and text-to-speech feedback.
5. Provide a personalized learning plan at the end showing progress stats, academic rating, and recommendation.

### Technical Steps:
- Add a list of 8 test questions in `src/App.jsx`.
- Implement `OnboardingTest` and `AssessmentReport` components in `src/App.jsx`.
- Update `OnboardingView` in `src/App.jsx` to render the welcome page, then `OnboardingTest`, then the `AssessmentReport`.
- Modify `getLearningPlan` in `src/utils.js` to recommend the `startingRecommendation` lesson when the user has not completed any lessons yet.
- Style the test, questions, options, and assessment report inside `src/App.css`.

---

## Proposed Changes

### Logic & Helpers

#### [utils.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/utils.js)
- Modify `getLearningPlan` to read `progress.profile.startingRecommendation` (e.g. `"lesson-1"`, `"lesson-11"`, `"lesson-27"`).
- If `startingRecommendation` is set and the user has completed 0 lessons, set the recommended primary lesson to that recommended lesson instead of defaulting to index 0 (`lesson-1`).

---

### UI Components

#### [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
- Declare `ONBOARDING_TEST_QUESTIONS`:
  - An array of 8 objects, each containing: `id`, `text`, `options` (array of strings), `correctIndex`, `difficulty` ('easy' | 'medium' | 'hard'), `skill` (string).
- Replace `OnboardingView` and `OnboardingLesson` with:
  - `OnboardingTest` component:
    - Displays current question index (0 to 7), a progress bar, a mascot bubble reading the question text using Web Speech API, and multiple-choice buttons.
    - If answer is selected: clicking "Kiểm tra" checks correctness, plays 'correct'/'wrong' sound effect, speaks encouragement, and shows the mascot comment.
    - Clicking "Tiếp theo" advances to the next question.
    - A "Bỏ qua" button allows skipping the test, defaulting the profile to Starter level.
  - `AssessmentReport` component:
    - Renders the "Hồ Sơ Năng Lực Toán Học" card.
    - Displays the chosen mascot wearing a detective hat (using a custom styled card).
    - Lists calculated results: Academic tier (Khởi động vững chắc / Bứt phá tư duy / Thử thách siêu cấp), XP rewarded (+100 XP), and 3 progress bars showing skills proficiency.
    - A big CTA button to exit onboarding and enter the home screen.

---

### Styling

#### [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
- Add classes for:
  - `.onboarding-test-card`, `.test-progress-bar`, `.question-text`, `.test-options-grid`.
  - `.assessment-container`, `.assessment-card`, `.certificate-title`, `.skills-grid`, `.skill-bar-wrapper`, `.skill-bar-fill`.
  - Mascot dialogue animations and hover effects on option select cards.

---

## Verification

### Automated Tests
- Run `node scripts/test-gate.js` with `BypassSandbox: true` to check linting and existing tests.
- Add test coverage for custom recommendation logic in `src/utils.test.js`.

### Manual Verification
- Walk through the test: verify that the results match the expected thresholds (0-3 correct: Starter; 4-6 correct: Intermediate; 7-8 correct: Advanced).
- Verify TTS works, playing speech for questions and correct/incorrect mascot dialogs.
