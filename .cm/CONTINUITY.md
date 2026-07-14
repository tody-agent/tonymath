# Continuity & Operational Learnings

## Active Goal
Bổ sung chức năng âm thanh phản hồi (Sound Effects) dùng Web Audio API và phát âm Text-to-Speech (TTS) dùng giọng nói trình duyệt với bảng điều khiển cài đặt lưu trong localStorage.

## Next Actions
- [ ] Tạo file `src/audio.js` chứa bộ tổng hợp SFX và điều khiển SpeechSynthesis (TTS).
- [ ] Thêm state `audioSettings` và giao diện cấu hình ở Header trong `src/App.jsx`.
- [ ] Tích hợp Sound Effects (SFX) vào các nút bấm và kiểm tra đáp án.

## Current Phase
Planning

## Working Context
- Cần âm thanh sinh động (click, correct, wrong, complete) để thu hút trẻ nhỏ học toán.
- Thiết kế hệ thống không phụ thuộc MP3 (sử dụng Web Audio API và Web Speech API).
- Hỗ trợ cài đặt tự động đọc bài, tốc độ nói (Chậm/Vừa/Nhanh) và Mute.

## Decisions
- [Decision]: Disabled validateStep submit action if inputs are incomplete to prevent accidental score degradation (lost hearts) — scope: global
- [Decision]: Adopted pnpm for speedier package installation & dependency tracking — scope: global
- [Decision]: Adopted Web Audio API for sound effects to keep zero external dependencies and zero-latency performance — scope: global

## Learnings
- **What Failed**: The daily streak logic was initialized but never incremented, leaving the user with a permanent 1-day streak.
- **How to Prevent**: Always define and implement updating logic for stats visible to users in dashboards.
- **Scope**: file:src/App.jsx

- **What Failed**: Submit buttons (e.g. "Kiểm tra") were active by default before any selection was made, leading to an automatic error state.
- **How to Prevent**: Disable interactive submit actions until a corresponding local selection hook resolves to a non-null value.
- **Scope**: global
