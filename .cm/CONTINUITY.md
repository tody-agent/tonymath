# Continuity & Operational Learnings

## Decisions
- [Decision]: Disabled validateStep submit action if inputs are incomplete to prevent accidental score degradation (lost hearts) — scope: global
- [Decision]: Adopted pnpm for speedier package installation & dependency tracking — scope: global

## Learnings
- **What Failed**: The daily streak logic was initialized but never incremented, leaving the user with a permanent 1-day streak.
  - **How to Prevent**: Always define and implement updating logic for stats visible to users in dashboards.
  - **Scope**: file:src/App.jsx

- **What Failed**: Submit buttons (e.g. "Kiểm tra") were active by default before any selection was made, leading to an automatic error state.
  - **How to Prevent**: Disable interactive submit actions until a corresponding local selection hook resolves to a non-null value.
  - **Scope**: global
