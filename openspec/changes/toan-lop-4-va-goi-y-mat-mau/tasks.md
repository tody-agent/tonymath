# Implementation Checklist - Nâng cao Toán lớp 4 & Cơ chế Gợi ý mất máu

## 1. Dữ liệu & Cấu hình bài học lớp 4
- [ ] 1.1 Thêm Bài học 33 (Tổng và Hiệu) với thuộc tính `"difficulty": "hard"` vào `src/lessons.json`
- [ ] 1.2 Thêm Bài học 34 (Trung bình cộng) với thuộc tính `"difficulty": "hard"` vào `src/lessons.json`
- [ ] 1.3 Thêm Bài học 35 (Rút về đơn vị) với thuộc tính `"difficulty": "hard"` vào `src/lessons.json`
- [ ] 1.4 Thêm Bài học 36 (Tổng và Tỉ số) với thuộc tính `"difficulty": "hard"` vào `src/lessons.json`
- [ ] 1.5 Thêm Bài học 37 (Hiệu và Tỉ số) với thuộc tính `"difficulty": "hard"` vào `src/lessons.json`
- [ ] 1.6 Thêm Bài học 38 (Hình học Tổng-Hiệu + Diện tích) với thuộc tính `"difficulty": "hard"` vào `src/lessons.json`
- [ ] 1.7 Thêm Bài học 39 (Tìm phân số của một số) với thuộc tính `"difficulty": "hard"` vào `src/lessons.json`
- [ ] 1.8 Thêm Bài học 40 (Công việc chung + Rút về đơn vị) với thuộc tính `"difficulty": "hard"` vào `src/lessons.json`

## 2. Phát triển Logic & UI trong App.jsx
- [ ] 2.1 Cấu hình thuộc tính `challengeMode: false` trong `DEFAULT_PROGRESS` tại `src/App.jsx`
- [ ] 2.2 Khai báo các state mới `hintUnlockedForCurrentStep`, `showHintConfirm` và `isGameOver` trong component `App` tại `src/App.jsx`
- [ ] 2.3 Reset `hintUnlockedForCurrentStep` về `false` trong hàm `resetStepState` tại `src/App.jsx`
- [ ] 2.4 Cập nhật xử lý sự kiện nút bóng đèn 💡 để hiển thị Modal xác nhận nếu là chế độ thử thách tại `src/App.jsx`
- [ ] 2.5 Viết hàm `confirmHint` thực hiện trừ ❤️, tăng `mistakes`, mở hint, và đóng modal xác nhận tại `src/App.jsx`
- [ ] 2.6 Thêm `useEffect` để kiểm tra khi `hearts === 0` dưới chế độ thử thách thì kích hoạt `isGameOver = true` tại `src/App.jsx`
- [ ] 2.7 Viết và tích hợp Component `HintConfirmModal` vào cấu trúc JSX của `LessonView` tại `src/App.jsx`
- [ ] 2.8 Viết và tích hợp Component `GameOverScreen` hiển thị toàn màn hình với nút "Thử lại bài học" tại `src/App.jsx`
- [ ] 2.9 Thêm checkbox bật/tắt "Chế độ Thử thách" trong Profile Menu tại `src/App.jsx`
- [ ] 2.10 Hiển thị huy hiệu `⚡ Thử thách` trên thanh công cụ `LessonView` khi chế độ này đang hoạt động tại `src/App.jsx`

## 3. Tạo Giao diện & Hiệu ứng trong App.css
- [ ] 3.1 Viết styles CSS cho huy hiệu `.challenge-badge` nổi bật tại `src/App.css`
- [ ] 3.2 Viết styles CSS cho `.confirm-modal-overlay` và `.confirm-modal` xác nhận tiêu hao ❤️ tại `src/App.css`
- [ ] 3.3 Viết styles CSS cho `.gameover-overlay` và `.gameover-content` động viên trẻ làm lại tại `src/App.css`
- [ ] 3.4 Tinh chỉnh responsive trên thiết bị di động để đảm bảo các thành phần mới hiển thị cân đối tại `src/App.css`

## 4. Kiểm thử & Đóng gói
- [ ] 4.1 Cập nhật unit test trong `src/utils.test.js` để bao phủ thuộc tính `challengeMode`
- [ ] 4.2 Chạy test gate tự động `node scripts/test-gate.js` để kiểm tra tính toàn vẹn của mã nguồn
- [ ] 4.3 Kiểm thử thủ công chức năng trừ ❤️, màn hình GameOver và tự động bật Thử thách đối với các bài học lớp 4
