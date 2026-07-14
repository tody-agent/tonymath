# Implementation Checklist - Unlock Lessons

- [ ] 1. Add `isDevMode` state hook in `src/App.jsx`
- [ ] 2. Modify `isUnlocked` helper function in `src/App.jsx` to respect `isDevMode`
- [ ] 3. Update Profile Menu rendering in `src/App.jsx` to include the Developer Mode toggle button
- [ ] 4. Run `pnpm run lint` and verify no static analysis errors
- [ ] 5. Manually verify in browser:
  - Toggle Developer Mode on/off.
  - Verify all 32 lessons are clickable.
  - Complete a step to ensure functionality is unaffected.
