# Implementation Checklist - Nâng cấp trang Thấu hiểu

Hành trình nâng cấp trang Tiến độ thành trang Thấu hiểu (RPG Insights).

- [x] **1. Cập nhật Logic Lưu Trữ & Thống Kê (`utils.js`)**
  - [x] 1.1 Cập nhật `applyLessonResult` trong `src/utils.js` để lưu thêm `duration`, `lastDuration`, và `totalDuration` trong progress completed & attempts.
  - [x] 1.2 Bổ sung các test case trong `src/utils.test.js` để kiểm chứng việc lưu trữ thời gian giải bài hoạt động đúng đắn.
  - [x] 1.3 Chạy `npm run test:gate` đảm bảo các logic nền tảng không bị lỗi.

- [x] **2. Tích Hợp Đếm Giờ Học Tập Trong Bài Học (`App.jsx`)**
  - [x] 2.1 Khai báo state `lessonStartTime` trong component `App` của `src/App.jsx`.
  - [x] 2.2 Ghi nhận thời gian bắt đầu học `Date.now()` bên trong hàm `openLesson()`.
  - [x] 2.3 Tính toán hiệu thời gian `duration` (giây) tại bước hoàn thành bài học (bước 7) trong hàm `nextStep()` và truyền nó sang `applyLessonResult()`.

- [x] **3. Xây Dựng Component Giao Diện Thấu Hiểu `InsightsView` (`App.jsx`)**
  - [x] 3.1 Đổi tên component `ProgressView` thành `InsightsView` (hoặc định nghĩa component mới và xóa component cũ).
  - [x] 3.2 Xây dựng phần hiển thị **Hero Card** tích hợp avatar mascot, Cấp độ, Streak, Điểm vàng và liên kết bấm để mở hướng dẫn của Mascot.
  - [x] 3.3 Tính toán và vẽ **4 Chỉ số RPG** (Logic, Tốc độ, Độ chính xác, Bền bỉ) bằng SVG circular progress hoặc thanh progress bar phong cách game.
  - [x] 3.4 Viết hàm phân tích lỗi sai dựa trên `stepFails` và render **Bí kíp chiến thắng Quái vật Lỗi sai** (Mistake Monster).
  - [x] 3.5 Gom bài học theo `skill` và render **Skill Quest Map** phân nhóm: Đã thấu hiểu hoàn toàn 🟢, Đang rèn luyện 🔵, Cần cải thiện 🟡.
  - [x] 3.6 Tạo bảng **Nhiệm vụ Khẩn cấp** gợi ý: bài ôn tập phục hồi điểm số (+20 XP), bài đua tốc độ, bài thử thách siêu cấp.
  - [x] 3.7 Cập nhật Sidebar Navigation để thay đổi nhãn từ `"Tiến độ"` thành `"Thấu hiểu"`.

- [x] **4. Tinh Chỉnh Giao Diện & Trải Nghiệm Người Dùng (`App.css`)**
  - [x] 4.1 Thêm CSS styles cho trang Thấu hiểu: layout chia cột RPG, khung thẻ thuộc tính nhân vật, vòng tròn tiến độ SVG.
  - [x] 4.2 Định dạng CSS cho quái vật lỗi sai, biểu tượng kỹ năng và các nút hành động dạng game bắt mắt.
  - [x] 4.3 Đảm bảo giao diện hiển thị responsive tốt trên mobile, không bị vỡ bố cục.

- [x] **5. Kiểm Thử & Nghiệm Thu**
  - [x] 5.1 Chạy lại toàn bộ test suite: `npm run test:gate`.
  - [x] 5.2 Kiểm thử thủ công: Chơi thử bài học, kiểm tra việc lưu trữ `duration`, hiển thị quái vật lỗi sai và thực thi nhiệm vụ phục hồi điểm số.
