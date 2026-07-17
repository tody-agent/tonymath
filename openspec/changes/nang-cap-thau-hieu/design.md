# Design: Nâng cấp trang Tiến độ thành trang Thấu hiểu (Insights Page)

Tài liệu thiết kế chi tiết kỹ thuật cho tính năng nâng cấp trang Tiến độ thành trang Thấu hiểu học lực dạng RPG game, bao gồm cách thu thập chỉ số tốc độ, phân tích quái vật lỗi sai, xây dựng cây kỹ năng và bảng nhiệm vụ gợi ý bài học.

---

## 1. Context & Technical Approach

### 1.1 Thu thập chỉ số thời gian học (Tốc độ)
* **Ý tưởng**: Ghi lại thời gian bắt đầu và kết thúc của một bài học để tính toán tốc độ.
* **Chi tiết kỹ thuật**:
  * Thêm React state `lessonStartTime` trong `App` component.
  * Trong hàm `openLesson(index)`, gán `setLessonStartTime(Date.now())`.
  * Trong hàm `nextStep()` khi kết thúc bài (bước 7), tính `duration = Math.round((Date.now() - lessonStartTime) / 1000)` (giây).
  * Truyền `duration` vào hàm `applyLessonResult(old, { ..., duration })`.
  * Cập nhật `applyLessonResult` trong `src/utils.js` để lưu:
    * `progress.completed[fullId].duration`: Lưu thời gian hoàn thành lần chơi gần nhất.
    * `progress.attempts[fullId].lastDuration`: Thời gian chơi lần cuối.
    * `progress.attempts[fullId].totalDuration`: Tổng thời gian của tất cả các lần chơi để tính trung bình.

### 1.2 Phân tích Quái vật Lỗi sai (Mistake Monsters)
* **Ý tưởng**: Gom toàn bộ lỗi sai từ `stepFails` của tất cả bài học để tìm xem bước nào bé hay sai nhất.
* **Cách tính**:
  * Duyệt qua `progress.attempts` của tất cả bài học thuộc lớp/môn hiện tại.
  * Gom tổng số lỗi theo từng bước (1 đến 7).
  * Xác định bước có số lỗi sai nhiều nhất. Nếu số lỗi cao nhất bằng 0, không hiển thị quái vật nào (hoặc hiển thị Trạng thái Hòa bình).
  * Ánh xạ bước có số lỗi cao nhất sang Quái vật tương ứng:
    * Bước 1-2: `Quái vật Đọc Lướt 🦇`
    * Bước 3: `Quái vật Lệch Sơ Đồ 👾`
    * Bước 4: `Quái vật Nhầm Phép Tính 🦖`
    * Bước 5: `Quái vật Tính Nhầm 🕷️`
    * Bước 6-7: `Quái vật Quên Kiểm Tra 🐢`
  * Cung cấp bí kíp tương ứng và gợi ý bài học gần nhất có lỗi ở bước này để làm Quest sửa lỗi.

### 1.3 Phân loại bài học theo dạng Đề (Skill Quest Map)
* **Ý tưởng**: Gom bài học theo `skill` (Chủ đề).
* **Phân loại**:
  * **Mastered 🟢**: Tất cả bài học của chủ đề này đều đã hoàn thành với 3 sao.
  * **Improving 🔵**: Có bài học đã chơi nhưng chưa đạt 3 sao hoặc nằm trong `weakSkills`.
  * **Focus Needed 🟡**: Chưa học bài nào, hoặc là chủ đề tiếp theo có bài gợi ý học lực.

### 1.4 Bảng nhiệm vụ khẩn cấp (Emergency Quests)
* **Nhiệm vụ Phục hồi**: Chọn 1 bài trong `weakSkills` hoặc có <3 sao để chơi lại. Thưởng thêm +20 XP.
* **Nhiệm vụ Tăng tốc**: Chọn bài cũ chơi lại để rút ngắn thời gian làm bài.
* **Nhiệm vụ Thử thách**: Chơi bài mới tiếp theo ở chế độ Thử thách (Challenge Mode).

---

## 2. Proposed Changes

### [utils.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/utils.js)
* Cập nhật `applyLessonResult` để nhận thêm `duration` trong payload.
* Cập nhật `completed` và `attempts` để lưu `duration`, `lastDuration`, `totalDuration`.
* Cập nhật file test [utils.test.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/utils.test.js) tương ứng để đảm bảo các logic lưu trữ hoạt động ổn định.

### [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
* Thêm state `lessonStartTime` trong `App` component.
* Cập nhật `openLesson` và `nextStep` để tính toán thời gian giải bài.
* Thay thế `ProgressView` bằng `InsightsView`.
* Xây dựng giao diện `InsightsView` với các phần:
  * **Hero Status Widget**: Thẻ thông tin nhân vật, liên kết Cấp độ, Streak, Điểm.
  * **RPG attributes**: 4 chỉ số (Logic, Tốc độ, Độ chính xác, Bền bỉ) dưới dạng thẻ gauge SVG tròn/thanh ngang.
  * **Mistake Monsters Codex**: Hiển thị quái vật và nút "Khắc phục ngay".
  * **Skill Quest Map**: Danh sách các chủ đề toán học phân nhóm và tiến độ tương ứng.
  * **Emergency Quests Board**: Bảng nhiệm vụ gợi ý tăng điểm/phục hồi tim.
* Thay đổi nhãn nút menu sidebar từ `"Tiến độ"` thành `"Thấu hiểu"`.

---

## 3. Verification

### Automated Tests
* Chạy `npm run test:gate` để kiểm tra toàn bộ unit test.

### Manual Verification
* Vào ứng dụng, chơi thử một bài học xem `duration` có được lưu vào LocalStorage không.
* Xem trang Thấu hiểu có hiển thị các biểu đồ thuộc tính và Quái vật lỗi sai tương ứng hay không.
