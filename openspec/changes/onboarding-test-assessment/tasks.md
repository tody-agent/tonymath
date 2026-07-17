# Implementation Checklist

- [ ] **1. Setup and Helpers**
  - [ ] 1.1 Modify `getLearningPlan` in `src/utils.js` to respect `startingRecommendation` for fresh users.
  - [ ] 1.2 Add unit test cases in `src/utils.test.js` verifying the custom `startingRecommendation` placement.
- [ ] **2. Data Layer**
  - [ ] 2.1 Define `ONBOARDING_TEST_QUESTIONS` constant inside `src/App.jsx` with 8 diagnostic word problems (checkpoint challenges at questions 4 and 8).
- [ ] **3. UI Components**
  - [ ] 3.1 Implement `OnboardingTest` state management, multiple-choice rendering, and mascot feedback.
  - [ ] 3.2 Add text-to-speech voicing for test questions and mascot encouragement lines.
  - [ ] 3.3 Implement `AssessmentReport` view displaying the evaluated academic tier, certificate style, and skill proficiency bars.
  - [ ] 3.4 Integrate `OnboardingTest` and `AssessmentReport` into `OnboardingView`.
- [ ] **4. Styling**
  - [ ] 4.1 Write styles in `src/App.css` for onboarding test questions, hover effects, and transitions.
  - [ ] 4.2 Add premium styles for the Assessment Report certificate card and animated skill bars.
- [ ] **5. Verification**
  - [ ] 5.1 Run all tests locally and run linter using the gate script.
  - [ ] 5.2 Manually verify different scoring levels (Starter, Intermediate, Advanced) and correct recommendations in browser.
