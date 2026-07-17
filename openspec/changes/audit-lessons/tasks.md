# Implementation Checklist - Audit Lessons

- [ ] 1.1 Create automated lesson audit validator script `scripts/audit-lessons.js`
- [ ] 1.2 Integrate `scripts/audit-lessons.js` as Gate 3 in `scripts/test-gate.js`
- [ ] 2.1 Update stepper step transition in `src/App.jsx` (`nextStep`) to skip Step 5 for logic/non-calculation lessons
- [ ] 2.2 Update step completion validation in `src/App.jsx` (`isStepAnswered`, `validateStep`) for skipped step 5
- [ ] 3.1 Verify logic changes using interactive/manual testing or logic verification
- [ ] 3.2 Run full gated release pipeline `npm run test:gate` to verify compliance
