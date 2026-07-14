# Continuity & Operational Learnings

## Active Goal
Bổ sung Onboarding Flow gamified (chào mừng, chọn cố vấn Mascot, học Bài 0 hướng dẫn 8 bước trực quan) và PWA Reminders (Service Worker chạy offline, cài đặt nhắc nhở, tải file lịch biểu .ics).

## Next Actions
- [x] Đăng ký Service Worker và cấu hình manifest.json cho PWA offline.
- [x] Tạo màn hình OnboardingView nhập tên và chọn Mascot đồng hành.
- [x] Xây dựng Bài học thử thách số 0 hướng dẫn 8 bước giải toán kèm gợi ý trực quan.
- [x] Tích hợp bộ cài đặt giờ học tự động trong menu cá nhân và xuất lịch biểu .ics.

## Current Phase
Completed

## Working Context
- Ứng dụng PWA hỗ trợ chạy offline hoàn toàn (caching CSS, JS, HTML, Audio và dữ liệu bài học).
- Sử dụng Mascot (Cố vấn) tùy chọn để tạo sự thân thiện với trẻ nhỏ lớp 3-4.
- Bài 0 sử dụng apple bài toán nhỏ (3 + 2 = 5) để bé hiểu cấu trúc 8 bước một cách dễ dàng và thú vị.
- Đặt báo thức thông qua file `.ics` lịch biểu điện thoại để nâng độ tin cậy của thông báo lên 100%.

## Decisions
- [Decision]: Tách riêng component OnboardingLesson để độc lập hóa logic của Bài 0 với các bài học thực tế, giữ LessonView sạch sẽ — scope: file:src/App.jsx
- [Decision]: Tạo Service Worker thủ công (public/sw.js) để không phụ thuộc plugin build giúp ứng dụng biên dịch nhanh và nhẹ nhàng — scope: global
- [Decision]: Sử dụng file lịch biểu .ics làm fallback thông báo nhắc nhở để bảo đảm tính năng hoạt động trên mọi thiết bị và hệ điều hành (bao gồm cả iOS Safari) — scope: global

## Learnings
- **What Worked**: File lịch biểu .ics là một giải pháp cực kỳ sáng tạo và hiệu quả cho các ứng dụng PWA chạy local thuần frontend không có backend để kích hoạt thông báo hẹn giờ một cách chính xác.
- **How to Benefit**: Áp dụng cho các tính năng lên lịch, báo thức, hẹn giờ nhắc nhở trong các dự án offline-first/no-backend tương tự.
- **Scope**: global

- **What Failed**: Khi ẩn header/sidebar để hiển thị Onboarding toàn màn hình, thẻ `<main>` bị ép vào cột đầu tiên rộng 230px do CSS Grid của container `.app-shell`.
- **How to Prevent**: Luôn ghi đè thuộc tính Grid (ví dụ: `display: block !important`) của parent container khi hiển thị giao diện full-width/full-viewport để tránh bị dồn ép cột.
- **Scope**: file:src/App.css
