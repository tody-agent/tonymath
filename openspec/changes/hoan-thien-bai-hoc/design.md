# Design: Developer Mode for Unlocking Lessons

## Context & Technical Approach
We verified that `src/lessons.json` contains 32 unique lessons. They are sequentially locked:
```javascript
const isUnlocked = (index) => index === 0 || Boolean(progress.completed[lessons[index - 1].id])
```
We want to add a Developer Mode toggle inside the Profile Menu (`profile-menu`). When active, it sets a state `isDevMode` to `true`, making all lessons unlocked:
```javascript
const isUnlocked = (index) => isDevMode || index === 0 || Boolean(progress.completed[lessons[index - 1].id])
```
This is fully clientside, persistent (if required, or just in-memory for simplicity. Let's make it persist in state so it stays on page reload/navigation, but in-memory is fine too. Let's make it in-memory for safety so kids don't accidentally leave it enabled, but easily toggleable in the Profile Menu).

## Proposed Changes

### Core UI & Logic

#### [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
1. Add `isDevMode` state at the top of the `App` component:
   ```javascript
   const [isDevMode, setIsDevMode] = useState(false)
   ```
2. Modify `isUnlocked` to check `isDevMode`:
   ```javascript
   const isUnlocked = (index) => isDevMode || index === 0 || Boolean(progress.completed[lessons[index - 1].id])
   ```
3. Update the Profile Menu rendering logic to add a new button that toggles `isDevMode` status:
   ```javascript
   {menuOpen && (
     <div className="profile-menu">
       <b>Bạn nhỏ chăm học</b>
       <span>{earnedStars} sao đã kiếm được</span>
       <button onClick={() => setIsDevMode(dev => !dev)}>
         {isDevMode ? '🔒 Khóa chế độ Dev' : '🔓 Mở khóa tất cả bài'}
       </button>
       <button onClick={resetAllProgress}>Xóa tiến độ</button>
     </div>
   )}
   ```

## Verification
- Click on the Profile icon 👦 at the top right to open the menu.
- Verify the button displays "🔓 Mở khóa tất cả bài".
- Click it, check that the button text changes to "🔒 Khóa chế độ Dev".
- Verify all 32 lesson cards in the grid are unlocked (no padlock icon 🔒, fully clickable).
- Click any downstream lesson (e.g. Lesson 15) and verify it opens and operates properly.
