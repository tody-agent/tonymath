# Continuity & Operational Learnings

## Active Goal
Đơn giản hóa trang Hồ sơ & Thiết lập bằng cách chia thành 2 phần: Hồ sơ học sinh (Mascot, đổi tên, XP, Streak, Badges) và Góc Phụ huynh (được bảo vệ bằng Math Gate để trẻ không vô tình thao tác thay đổi dữ liệu hoặc cấu hình học tập).

## Next Actions
- [x] 1.1 Add tab headers and transition animations in App.css.
- [x] 1.2 Add kid metrics layout classes (level, XP progression bar, streak fire).
- [x] 2.1 Define states for profileTab, showMathGate, mathGateQuestion, mathGateInput, mathGateError, selectedBadgeInfo, and mascotSpeechBubble in App.jsx.

## Current Phase
verification

## Working Context
- Đã hoàn thiện thiết kế UI/UX giao diện Hồ sơ học sinh (Hồ sơ của Bé) và Góc Phụ huynh (Math Gate).
- Đã hoàn tất cài đặt toàn bộ code CSS/JSX và logic kiểm thử unit test.
- Đã chạy kiểm thử linter, logic unit tests, lessons data audit, vite build và smoke test thành công qua toàn bộ 6 Cổng (test-gate.js).

## Decisions
- [Decision]: Tách biệt menu Hồ sơ thành 2 không gian: Tab của Bé (khoe XP/Streak/Huy hiệu) và Tab của Phụ huynh được bảo mật bằng cổng toán học Math Gate ngẫu nhiên tránh việc trẻ tự ý reset dữ liệu — scope: file:src/App.jsx
- [Decision]: Tích hợp tính năng TTS Mascot thoại trực tiếp bằng Web Speech Synthesis khi học sinh đổi nhân vật đồng hành trong Hồ sơ để tạo tương tác vui tươi — scope: file:src/App.jsx
- [Decision]: Thiết kế lưới huy hiệu đã đạt và chưa đạt trong Hồ sơ học sinh kèm popup popover hiển thị mô tả cụ thể điều kiện và lời khuyên theo mascot — scope: file:src/App.jsx
- [Decision]: Chuyển menu profile thành Bottom Sheet toàn màn hình (mobile) và Centered Modal (desktop) với các card chọn Mascot và pill chọn Lớp/Môn để trẻ em dễ dàng thao tác — scope: file:src/App.jsx
- [Decision]: Tách riêng component OnboardingLesson để độc lập hóa logic của Bài 0 với các bài học thực tế, giữ LessonView sạch sẽ — scope: file:src/App.jsx
- [Decision]: Tạo Service Worker thủ công (public/sw.js) để không phụ thuộc plugin build giúp ứng dụng biên dịch nhanh và nhẹ nhàng — scope: global
- [Decision]: Sử dụng file lịch biểu .ics làm fallback thông báo nhắc nhở để bảo đảm tính năng hoạt động trên mọi thiết bị và hệ điều hành (bao gồm cả iOS Safari) — scope: global
- [Decision]: Áp dụng difficulty: 'hard' để tự động kích hoạt Chế độ Thử thách cho các bài học mới lớp 4 — scope: file:src/lessons.json
- [Decision]: Tích hợp Game Over và Hint Confirm trực tiếp bằng React state trong App.jsx để tránh các thư viện ngoài và tối ưu hóa CSS chuyển động nhẹ nhàng — scope: file:src/App.jsx
- [Decision]: Tích hợp `activeProgress` làm lớp trung gian memoized (useMemo) để ánh xạ tiến trình động theo lớp/môn mà không thay đổi cấu trúc state gốc — scope: file:src/App.jsx
- [Decision]: Di chuyển bộ chọn Lớp học & Môn học từ nội dung trang chủ và danh sách bài học vào menu Profile ở Header để tối ưu không gian hiển thị và giảm thiểu dư thừa UX — scope: file:src/App.jsx
- [Decision]: Trích xuất các tham số tỷ lệ phát âm thành các hằng số rõ ràng (SPEECH_RATE_SLOW, SPEECH_RATE_FAST, SPEECH_RATE_NORMAL) để tăng độ rõ ràng — scope: file:src/utils.js
- [Decision]: Trích xuất khoảng thời gian giữ kết nối giọng nói thành hằng số KEEP_ALIVE_INTERVAL_MS — scope: file:src/audio.js
- [Decision]: Tự động bỏ qua Bước 5 (Tự tính toán) trong App.jsx khi bài học thuộc kỹ năng 'Suy luận logic' hoặc có answer = 0 để tránh bắt trẻ nhập các giá trị dummy vô nghĩa. — scope: file:src/App.jsx
- [Decision]: Loại bỏ các hàm chết `getEncourageLine` và `getLessonBadge` khỏi `src/utils.js` do không còn sử dụng — scope: file:src/utils.js
- [Decision]: Áp dụng nguyên tắc DRY, sử dụng `isChallengeModeActive` thay vì viết lại biểu thức `progress.challengeMode || lesson?.difficulty === 'hard'` ở 3 nơi trong `src/App.jsx` — scope: file:src/App.jsx
- [Decision]: Cải thiện đặt tên biến, đổi tên biến đơn tự `m` thành `mascotProfile` và `n` thành `visibleCount` trong `src/App.jsx` để tăng tính tường minh — scope: file:src/App.jsx

## Learnings
- **What Failed**: Uncaught ReferenceError: isDevMode is not defined (Gây lỗi trắng trang khi bấm vào nút Profile).
- **Why It Failed**: Linter không phát hiện ra biến bị thiếu do `isDevMode` nằm sâu trong cấu trúc JSX điều kiện của profile-menu `{menuOpen && ...}` vốn chỉ được render khi người dùng click tương tác thực tế, đồng thời state `isDevMode` đã bị xóa nhầm trong commit dọn dẹp trước đó.
- **How to Prevent**: Luôn kiểm tra kỹ các biến được sử dụng trong các đoạn JSX có điều kiện để chắc chắn trạng thái state của chúng được định nghĩa đầy đủ, hoặc viết smoke test tự động hóa click mở tất cả các panel tương tác.
- **Scope**: file:src/App.jsx

- **What Worked**: File lịch biểu .ics là một giải pháp cực kỳ sáng tạo và hiệu quả cho các ứng dụng PWA chạy local thuần frontend không có backend để kích hoạt thông báo hẹn giờ một cách chính xác.
- **How to Benefit**: Áp dụng cho các tính năng lên lịch, báo thức, hẹn giờ nhắc nhở trong các dự án offline-first/no-backend tương tự.
- **Scope**: global

- **What Failed**: Khi ẩn header/sidebar để hiển thị Onboarding toàn màn hình, thẻ `<main>` bị ép vào cột đầu tiên rộng 230px do CSS Grid của container `.app-shell`.
- **How to Prevent**: Luôn ghi đè thuộc tính Grid (ví dụ: `display: block !important`) của parent container khi hiển thị giao diện full-width/full-viewport để tránh bị dồn ép cột.
- **Scope**: file:src/App.css

- **What Failed**: Phần chữ trong hộp truyện (`story-box`) của Bài học số 0 bị co bóp thành một cột dọc do thiếu nút loa phát âm, trong khi CSS Grid của hộp truyện đang chia theo tỷ lệ 3 phần: `46px 1fr 64px`.
- **How to Prevent**: Luôn giữ cấu trúc số lượng thẻ con tương thích khi sử dụng CSS Grid chia theo cột cố định, hoặc định nghĩa lại Grid Template tùy chỉnh khi ẩn/hiện thẻ con.
- **Scope**: file:src/App.jsx

- **What Failed**: Bố cục của phần câu hỏi `.question-area` đè lấn lên hộp truyện `.story-box` trên mobile do sử dụng `justify-content: center` in một flex container bị giới hạn chiều cao (flex-shrink và min-height: 0).
- **How to Prevent**: Tránh sử dụng `justify-content: center` khi chiều cao của viewport trên thiết bị di động có thể bé hơn kích thước của các phần tử con bên trong. Hãy ưu tiên sử dụng `justify-content: flex-start` trên mobile để nội dung xếp lớp từ trên xuống và cuộn tự nhiên.
- **Scope**: file:src/App.css

- **What Failed**: Các nút loa phát âm nhỏ `.speech-mini-btn` bên trong thẻ `.fact-card` bị biến dạng thành hình chữ nhật bo góc thay vì hình tròn do selector `.fact-card button` viết quá chung chung làm ảnh hưởng đến các nút con sâu bên trong.
- **How to Prevent**: Hạn chế sử dụng các selector quá rộng như `.parent button`. Thay vào đó, hãy sử dụng các selector trực tiếp như `.parent > button` or chỉ định cụ thể class name cho các nút chức năng để tránh ảnh hưởng đến các thành phần dùng chung khác.
- **Scope**: file:src/App.css

- **What Failed**: Chrome DevTools/Playwright automation click bị đứng/hết thời gian chờ (timeout) trên nút bấm có hoạt ảnh chuyển động vô hạn như `bounce-small infinite`.
- **How to Prevent**: Không nên áp dụng các CSS keyframe animations chuyển động vô hạn trên các phần tử tương tác chính khi chạy tự động hóa kiểm thử UI, hoặc cần tắt hoạt ảnh này thông qua prefers-reduced-motion.
- **Scope**: global

- **What Failed**: Truy cập trực tiếp biến state `lessons.length` ở component con `Achievements` gây lỗi ReferenceError do biến này nằm ngoài tầm vực khai báo.
- **How to Prevent**: Đảm bảo truyền đầy đủ dữ liệu thông qua React props thay vì gọi trực tiếp từ tầm vực cha hoặc biến cục bộ không được export.
- **Scope**: file:src/App.jsx
