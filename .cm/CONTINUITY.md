# Continuity & Operational Learnings

## Active Goal
Audit toàn bộ các bài toán lớp 4 trong public/lessons/grade-4/math.json đảm bảo độ chính xác toán học và cấu trúc dữ liệu, tối ưu UX stepper cho các bài suy luận logic.

## Next Actions
- [x] 1.1 Tạo file kiểm thử tự động scripts/audit-lessons.js
- [x] 1.2 Tích hợp scripts/audit-lessons.js làm Gate 3 trong scripts/test-gate.js
- [x] 2.1 Cập nhật nextStep, isStepAnswered, và validateStep trong src/App.jsx để bỏ qua Bước 5 khi giải bài suy luận logic

## Current Phase
completed

## Working Context
- Đã xác thực toàn bộ 55 bài toán tính toán lớp 4 đúng logic toán học.
- Phát hiện 5 bài toán suy luận logic/so sánh biểu đồ (bài 53-57) có câu trả lời phi số (hoặc answer = 0) gây cản trở ở bước Tự tính toán (bắt học sinh điền số 0).
- Thống nhất và triển khai thành công phương án bỏ qua bước 5 (Tự tính) của stepper đối với các bài toán phi số này.
- Đã kiểm định toàn bộ dự án qua 6 cổng kiểm thử tự động `npm run test:gate` thành công 100%.

## Decisions
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

## Learnings
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
