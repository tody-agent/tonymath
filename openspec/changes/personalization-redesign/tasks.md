# Implementation Checklist: Personalization & Layout Redesign

- [ ] **1. Navigation & State**
  - [ ] 1.1 Thêm view state `'lessons-menu'` trong `App` component và chuyển đổi đường dẫn của nút "Bài học" sang view này.
  - [ ] 1.2 Cập nhật `NavButton` ở cả sidebar và mobile nav để kích hoạt active state khi ở `'lessons-menu'`.

- [ ] **2. Personalized Logic & Dashboard**
  - [ ] 2.1 Viết helper `getRecentlyStudiedLesson` để tìm bài học vừa học gần nhất trong danh sách dựa trên `lastPlayedAt` của `progress.attempts`.
  - [ ] 2.2 Tạo phần giao diện "Kế hoạch học tập cá nhân hóa" trên Trang chủ với 3 thẻ: Bài học tiếp theo (kế tiếp), Bài vừa học (gần nhất) và Bài học nên ôn tập.
  - [ ] 2.3 Cập nhật Quest Board trên Trang chủ để card "Hành trình chính" dẫn thẳng sang view `'lessons-menu'`.

- [ ] **3. Full Lessons Curriculum Menu**
  - [ ] 3.1 Trích xuất và xây dựng component `LessonsMenu` chứa bộ lọc Lớp / Môn học, tổng điểm tiến độ và lưới hiển thị đầy đủ 60 bài học.
  - [ ] 3.2 Tích hợp `LessonsMenu` vào luồng render view chính trong `App.jsx`.

- [ ] **4. Giao diện & Styles**
  - [ ] 4.1 Thêm CSS class mới trong `src/App.css` cho các thẻ cá nhân hóa ở Trang chủ, đảm bảo thiết kế trực quan và cân xứng.

- [ ] **5. Kiểm thử & Đánh giá**
  - [ ] 5.1 Chạy bộ test gate kiểm tra biên dịch và linter.
  - [ ] 5.2 Kiểm tra thủ công tính năng cá nhân hóa hiển thị đúng bài vừa học, bài gợi ý tiếp theo và bài ôn tập.
