# Design: Hoàn thiện tính năng trang Thành tích (Achievements Page Polish)

Tài liệu thiết kế chi tiết cho việc hoàn thiện hệ thống Thành tích tương tác, tích hợp mascot khuyên học, theo dõi tiến trình trực quan và màn ăn mừng pháo hoa Confetti động lực.

## Context & Technical Approach

1. **Giao diện Thành tích tương tác**:
   * Chuyển các thẻ thành tích tĩnh thành thẻ có thể tương tác (`cursor: pointer`).
   * Tích hợp một thanh tiến trình mini trực quan ở chân mỗi thẻ để chỉ rõ mức độ hoàn thành nhiệm vụ (ví dụ: `2/4 bài học`, `10/15 sao`).
   * Nhấp vào thẻ thành tích sẽ hiển thị một Modal chi tiết với lời thoại khuyên học cá nhân hóa từ Mascot hiện tại của bé.

2. **Dữ liệu & Quản lý State**:
   * Bổ sung trường `unlockedAchievements` dạng object trong state `progress` lưu trữ cặp `{ achievementId: unlockTimestamp }`.
   * Sử dụng một React `useEffect` trong `App.jsx` lắng nghe các biến tiến trình để tự động phát hiện và mở khóa thành tích mới, đồng thời cập nhật vào `progress` và đồng bộ qua LocalStorage.
   * Sử dụng một state `newlyUnlockedAchievements` dạng mảng để lưu danh sách các thành tích vừa mở khóa trong phiên học để chuẩn bị ăn mừng.

3. **Màn ăn mừng Confetti & Mascot chúc mừng**:
   * Xây dựng component `<ConfettiCanvas>` và `<AchievementCelebration>` xử lý hiển thị Canvas Confetti động và popup vinh danh bé.
   * Hỗ trợ ăn mừng tuần tự nếu bé cùng lúc mở khóa nhiều thành tích.

4. **3 Thành tích mới**:
   * **"Vượt khó thành công"** (`challenge_master`): Hoàn thành bài học chế độ Thử thách hoặc độ khó Hard.
   * **"Trí tuệ hoàn hảo"** (`perfect_score`): Hoàn thành bài học đạt tuyệt đối 3 sao.
   * **"Học viên chăm chỉ"** (`dedicated_learner`): Đã bật tính năng nhắc nhở học tập.

---

## Proposed Changes

### Component & Logic

#### [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
- Khai báo metadata `ACHIEVEMENT_DEFINITIONS` chứa cấu trúc và nội dung chi tiết của 9 thành tích.
- Định nghĩa helper `getUnlockedAchievementIds(progress, earnedStars, lessons)` kiểm tra điều kiện mở khóa.
- Bổ sung `useEffect` giám sát tiến trình, tự động cập nhật `unlockedAchievements` và kích hoạt hiệu ứng chúc mừng khi phát hiện thành tựu mới.
- Triển khai component `ConfettiCanvas`, `AchievementCelebration` và nâng cấp component `Achievements` hỗ trợ hiển thị tiến trình trực quan, click mở modal chi tiết với Mascot khuyên học.
- Khai báo mặc định `unlockedAchievements: {}` trong `DEFAULT_PROGRESS` và xử lý khởi tạo tương thích ngược trong `loadProgress`.

### Giao diện & Animation

#### [MODIFY] [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
- Bổ sung hiệu ứng hover cho các thẻ thành tích.
- Định nghĩa class CSS cho thanh tiến trình (`.achievement-progress-bar`).
- Bổ sung style cho overlay và card của modal chi tiết (`.achievement-modal-overlay`, `.achievement-modal-card`).
- Định nghĩa kiểu dáng và chuyển động zoom-in cực đẹp cho màn ăn mừng (`.achievement-celebration-card`).

---

## Verification

### Automated Tests
- Bổ sung các ca kiểm thử trong `src/utils.test.js` để đảm bảo logic `getUnlockedAchievementIds` trả về danh sách thành tích chính xác theo từng trạng thái `progress` giả lập.

### Manual Verification
- Truy cập cài đặt và bật thông báo nhắc nhở -> Kiểm tra xem popup chúc mừng thành tích "Học viên chăm chỉ" có hiển thị lập tức không.
- Bấm vào các thẻ Thành tích đang khóa để xem gợi ý khuyên học của Mascot (Cú Ú, Rùa Con, Rô Bốt).
- Hoàn thành bài học đạt 3 sao lần đầu tiên -> Kiểm tra hiệu ứng pháo hoa Confetti và popup chúc mừng thành tích "Trí tuệ hoàn hảo".
