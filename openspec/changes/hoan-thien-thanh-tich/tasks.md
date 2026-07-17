# Implementation Checklist: Hoàn thiện tính năng trang Thành tích (Achievements Page Polish)

## Step 1: Khởi tạo dữ liệu & Logic kiểm tra
- [ ] 1.1 Khai báo `unlockedAchievements: {}` trong `DEFAULT_PROGRESS` tại [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx).
- [ ] 1.2 Bổ sung logic di trú trong `loadProgress` tại [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx) để tự động khởi tạo `unlockedAchievements` là `{}` cho các tài khoản học sinh cũ.
- [ ] 1.3 Định nghĩa mảng metadata `ACHIEVEMENT_DEFINITIONS` trong [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx) chứa đầy đủ thông tin của 9 thành tích (gồm id, icon, title, description, progress trackers, mascot advice).
- [ ] 1.4 Viết hàm helper `getUnlockedAchievementIds(progress, earnedStars, lessons)` để tính toán các thành tích được mở khóa theo các điều kiện.

## Step 2: Auto-unlock Listener & Unit Tests
- [ ] 2.1 Bổ sung React `useEffect` trong component App lắng nghe các thông số của `progress` để phát hiện thành tích mới đạt được, cập nhật âm thầm vào `progress.unlockedAchievements` đồng thời kích hoạt popup ăn mừng.
- [ ] 2.2 Viết ca kiểm thử trong `src/utils.test.js` giả lập trạng thái tiến trình để kiểm tra logic mở khóa của hàm `getUnlockedAchievementIds`. Chạy test thông qua `npm test`.

## Step 3: Giao diện Modal & Màn ăn mừng Confetti
- [ ] 3.1 Viết component `<ConfettiCanvas>` sử dụng HTML5 Canvas vẽ các hạt tròn/chữ nhật chuyển động rơi tự do kết hợp lực cản gió và trọng lực.
- [ ] 3.2 Viết component `<AchievementCelebration>` hiển thị hiệu ứng vinh danh chúc mừng khi mở khóa thành tích kèm mascot khuyên học.
- [ ] 3.3 Đưa thẻ `<AchievementCelebration>` vào cuối phần render chính của component `App` để hiển thị overlay vinh danh khi danh sách thành tích mới khác rỗng.

## Step 4: Nâng cấp view Thành tích
- [ ] 4.1 Cải tiến component `<Achievements>` tại [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx) tích hợp state hiển thị Modal chi tiết khi click thẻ thành tích.
- [ ] 4.2 Thêm thanh tiến trình động (`.achievement-progress-bar`) bên dưới mỗi thẻ thành tích bị khóa.

## Step 5: Bổ sung Style CSS
- [ ] 5.1 Thêm CSS hover effects và box-shadow sáng lấp lánh cho các thẻ thành tích tại [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css).
- [ ] 5.2 Viết CSS cho Modal chi tiết (`.achievement-modal-overlay`, `.achievement-modal-card`) có hiệu ứng làm mờ nền glassmorphism và nút đóng.
- [ ] 5.3 Định nghĩa style cho màn ăn mừng `.achievement-celebration-overlay` với hiệu ứng hoạt ảnh phóng to (scale-up pop-in).

## Step 6: Xác minh & Hoàn thiện
- [ ] 6.1 Kiểm tra tương thích các thành tích cũ và mới.
- [ ] 6.2 Bật thử thông báo nhắc nhở để xác thực màn chúc mừng thành tựu "Học viên chăm chỉ" hiển thị chính xác.
- [ ] 6.3 Làm thử bài học đạt 3 sao để xác thực hiệu ứng Confetti của thành tựu "Trí tuệ hoàn hảo".
