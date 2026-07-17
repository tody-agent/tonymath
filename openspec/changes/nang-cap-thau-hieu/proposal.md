# Proposal: Nâng cấp trang Tiến độ thành trang Thấu hiểu (Insights & Analytics Upgrade)

Tài liệu này trình bày phân tích ý tưởng nâng cấp trang **Tiến độ học** hiện tại thành trang **Thấu hiểu** giàu tương tác, trình bày theo phong cách game (RPG Status Screen), giúp phụ huynh và học sinh thấu hiểu tiến trình học tập, phát hiện lỗi sai thường gặp và tìm kiếm bài học cải thiện điểm số nhanh chóng.

---

## 1. Khảo sát hiện trạng (Discover)

### Giao diện hiện tại:
* Component `ProgressView` nằm trong [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx#L4303-L4307).
* Đây chỉ là một danh sách phẳng các bài học của lớp/môn học hiện tại kèm số sao (hoặc nhãn "Chưa học").
* Không có phân tích thời gian, tốc độ, hay độ chính xác.
* Chưa có liên kết gì với các chỉ số trên Header (Cấp độ, Streak, Điểm vàng).
* Chưa ghi nhận thời gian học (duration) của mỗi bài.

### Dữ liệu hiện có trong `progress` state:
* `progress.completed`: Đối tượng lưu trữ thông tin các bài học đã hoàn thành bao gồm: `stars`, `mistakes`, `completedAt`, `stepFails` (danh sách lỗi sai theo từng bước 1-7).
* `progress.attempts`: Đối tượng lưu trữ tất cả lượt chơi của từng bài bao gồm: `playCount`, `totalMistakes`, `lastMistakes`, `stepFails`, `needsReview`.
* `progress.weakSkills`: Đối tượng lưu trữ các kỹ năng yếu của trẻ (được tích lũy tự động khi làm sai từ 2 lỗi trở lên trong 1 bài học).

---

## 2. Phân tích 9 ô (9 Windows Analysis)

| Cấp độ | Quá khứ | Hiện tại | Tương lai |
|---|---|---|---|
| **SUPER-SYSTEM** *(Học Toán Tiểu Học)* | Danh sách điểm số, học bạ tĩnh, trẻ chỉ biết mình được mấy điểm mà không rõ vì sao sai. | Báo cáo tiến độ trực tuyến cơ bản, đếm số bài hoàn thành và số sao thu thập được. | Báo cáo thông minh dạng game hóa, thấu hiểu điểm mạnh/yếu tư duy và gợi ý lộ trình tự phục hồi. |
| **SYSTEM** *(Ứng dụng Học Toán)* | Chỉ hiển thị danh sách bài học và trạng thái học. | Có lộ trình gợi ý của Mascot, chế độ đấu trường Pomodoro và trang Thành tích tĩnh. | Trang **Thấu hiểu** trực quan hóa thuộc tính của bé (như nhân vật RPG), phân tích lỗi sai và mở quest cải thiện. |
| **SUB-SYSTEM** *(Trang Tiến độ)* | Component `ProgressView` tĩnh, liệt kê bài học và sao. | Component `ProgressView` đọc từ danh sách `completed` hiển thị sao dạng text phẳng. | Component `ProgressView` (đổi tên thành `InsightsView` hoặc `ThauHieu`) đầy đủ biểu đồ SVG, Monster lỗi sai và bảng Quest. |

---

## 3. Các phương án thiết kế (Develop)

### Option A (Khuyên dùng): Giao diện Bản đồ Chỉ số Anh Hùng (RPG Hero Status Dashboard)

**Triết lý**: Học sinh là một "Anh Hùng Toán Học". Trang Thấu hiểu chính là màn hình chỉ số nhân vật trong các trò chơi nhập vai (RPG), nơi bé có thể nâng cấp các thuộc tính toán học của mình.

#### Chi tiết tính năng:
1. **Thẻ nhân vật & Liên kết chỉ số Header**:
   * Hiển thị Avatar Mascot hiện tại (Cú Ú, Rùa Con, Rô Bốt) với thanh cấp độ RPG đẹp mắt.
   * Liên kết trực tiếp 3 chỉ số Header dưới dạng chỉ số thuộc tính game:
     * **Cấp độ (Level)** 🌟: Kèm thanh XP chi tiết (ví dụ: `40/100 XP`). Bấm vào mở Mascot Cú Ú khuyên: *"Làm thêm 3 bài học mới để thăng cấp lên Cấp độ tiếp theo nhé!"*
     * **Bền bỉ (Streak)** 🔥: Chỉ số ngày liên tiếp. Bấm vào mở Mascot Rùa Con khuyên: *"Duy trì học mỗi ngày giúp con giữ lửa kiên trì, không bị quái vật quên lãng phá hoại!"*
     * **Tài phú (Điểm số/XP)** 🪙: Tổng điểm tích lũy được. Bấm vào mở Mascot Rô Bốt khuyên: *"Dùng điểm này để mở khóa thêm các bài học thử thách siêu cấp!"*

2. **Hệ thống 3 thuộc tính Toán học mới**:
   * **Trí tuệ Logic 🧠 (Logic Power)**: Tính bằng % bài học đã hoàn thành trên tổng số bài (ví dụ: `15/60 bài = 25%`).
   * **Độ Chính xác 🎯 (Accuracy)**: Tính dựa trên tỷ lệ câu trả lời đúng của các bước. Công thức: `100 - (Tổng số lỗi sai / (Tổng số lượt chơi * 7) * 100)`. Hiển thị dưới dạng thanh Gauge hoặc vòng tròn SVG.
   * **Tốc độ Chớp chớp ⚡ (Quickness/Speed)**: Tốc độ giải bài trung bình. Để có chỉ số này, ta sẽ lưu thêm `startTime` lúc mở bài học, khi kết thúc bài học (bước 7) tính ra `duration` (giây) và lưu vào `progress.completed`. Tốc độ trung bình sẽ được xếp hạng theo các mốc: `Sấm sét` (<45s/bài), `Gió lốc` (45s-90s), `Thong thả` (>90s).

3. **Bí kíp chiến thắng Quái vật Lỗi sai (Mistake Monster Codex)**:
   * Tổng hợp dữ liệu từ `stepFails` để xác định bé hay làm sai ở bước nào nhất:
     * Sai bước 1-2: **Quái vật Đọc Lướt 🦇** (Thiếu kỹ năng đọc hiểu/phân tích dữ kiện).
     * Sai bước 3: **Quái vật Lệch Sơ Đồ 👾** (Yếu kỹ năng chọn mô hình/trực quan hóa).
     * Sai bước 4: **Quái vật Nhầm Phép Tính 🦖** (Yếu kỹ năng thiết lập phép toán & tư duy logic).
     * Sai bước 5: **Quái vật Tính Nhầm 🕷️** (Yếu kỹ năng tính toán số học cơ bản).
     * Sai bước 6-7: **Quái vật Quên Kiểm Tra 🐢** (Yếu kỹ năng kết luận và rà soát kết quả).
   * Hiển thị hình ảnh quái vật tương ứng cực kỳ sinh động kèm lời khuyên khắc phục của Mascot (Bí kíp khắc chế). Có nút "Khiêu chiến để sửa sai" mở ngay bài học chứa lỗi đó để ôn luyện.

4. **Phân loại bài học theo 3 trạng thái**:
   * **Ải đã thấu hiểu 🟢**: Các bài học đạt 3 sao hoàn hảo.
   * **Ải đang rèn luyện 🔵**: Bài học đã làm nhưng chưa đạt 3 sao, hoặc có lỗi sai cần ôn tập.
   * **Ải cần học tiếp 🟡**: Bài học gợi ý tiếp theo trong lộ trình chưa học.

5. **Bảng Nhiệm Vụ Khẩn Cấp (Score Boost & Point Recovery Quests)**:
   * **Nhiệm vụ phục hồi điểm 🪙**: Gợi ý làm lại 1 bài học nằm trong danh sách `weakSkills` để nhận thưởng lớn (+20 XP).
   * **Nhiệm vụ tăng tốc ⚡**: Thử thách giải lại 1 bài học cũ với tốc độ nhanh hơn để tăng chỉ số Tốc độ.
   * **Nhiệm vụ thử thách siêu cấp ⚔️**: Gợi ý làm bài học tiếp theo ở Chế độ Thử thách để nhân đôi điểm thưởng.

* **Ước lượng công sức**: **M** (Khoảng 5 - 7 giờ). Giao diện thuần CSS, SVG vẽ biểu đồ nên rất nhẹ.
* **Rủi ro**: Không có. Mở rộng dữ liệu `completed` để lưu thêm `duration` không ảnh hưởng đến các logic cũ nhờ cơ chế di trú an toàn.

---

### Option B: Phòng Thí Nghiệm Thám Tử Toán Học (Detective Math Lab)

**Triết lý**: Học sinh đóng vai trò "Thám tử tư duy", nghiên cứu các "ẩn số" và "vết tích lỗi sai" trong phòng thí nghiệm.

#### Chi tiết tính năng:
* Biểu đồ phân tích hình mạng nhện (Spider Web / Radar Chart) thể hiện 5 kỹ năng thám tử toán học tương ứng với các bước học.
* Các lỗi sai hiển thị dưới dạng các "Vụ án chưa giải quyết" (Cold Cases).
* Danh sách bài học chia làm: "Hồ sơ đã đóng" (Mastered), "Vụ án đang điều tra" (Weak skills), và "Hiện trường mới" (New lessons).
* Gợi ý bài học được gọi là "Nhiệm vụ tuần tra" để lấy thêm manh mối (XP/Điểm).

* **Ước lượng công sức**: **L** (Khoảng 1-2 ngày do cấu trúc vẽ biểu đồ radar đa giác bằng CSS/Canvas phức tạp hơn).
* **Rủi ro**: Trung bình. Trẻ nhỏ lớp 4 có thể thấy giao diện thám tử hơi nhiều chữ và phức tạp hơn so với game RPG quen thuộc.

---

### Option C: Trang Báo Cáo Học Tập Thông Thường (Standard Analytics Dashboard)

**Triết lý**: Tập trung vào báo cáo học tập sạch sẽ, tối giản phù hợp cho phụ huynh theo dõi.

#### Chi tiết tính năng:
* Biểu đồ đường/cột thể hiện số lượng bài học hoàn thành qua các ngày.
* Bảng thống kê số lỗi sai trung bình mỗi bài.
* Danh sách bài học phẳng phân nhóm theo chủ đề (Trung bình cộng, Tổng hiệu...) với phần trăm hoàn thành.
* Nút "Học lại bài sai" đơn giản.

* **Ước lượng công sức**: **S** (Khoảng 2-3 giờ).
* **Rủi ro**: Thấp. Tuy nhiên, trẻ sẽ không thấy hứng thú tự truy cập trang này vì nó mang cảm giác "học tập" nặng nề, thiếu tính game hóa.

---

## 4. Đánh giá & Khuyến nghị (Evaluate)

| Tiêu chí | Trọng số | Option A (RPG Hero) | Option B (Detective Lab) | Option C (Standard Dashboard) |
|---|---|---|---|---|
| **Tính khả thi & ổn định (Tech)** | 25% | **9 / 10** | **7 / 10** | **10 / 10** |
| **Giá trị trải nghiệm cho bé (Product)** | 30% | **10 / 10** | **8 / 10** | **4 / 10** |
| **Độ WOW & Game hóa (Design)** | 20% | **10 / 10** | **8.5 / 10** | **5 / 10** |
| **Thời gian hoàn thành & ROI (Business)** | 25% | **9 / 10** | **6 / 10** | **8 / 10** |
| **Tổng điểm có trọng số** | **100%** | **9.5 / 10** | **7.4 / 10** | **6.7 / 10** |

**Khuyến nghị**: **Chọn Option A**.
RPG Hero Dashboard tạo động lực cực lớn cho học sinh tiểu học tự khám phá các chỉ số của bản thân. Nó liên kết trực tiếp với các chỉ số Header, biến việc học thành hành trình rèn luyện thuộc tính nhân vật và giải cứu thế giới khỏi "Quái vật Lỗi sai".

---

## 5. Kế hoạch kiểm thử (Verification Plan)

### Kiểm thử tự động (Automated Tests):
* Viết unit test bổ sung cho helper phân tích chỉ số trong `src/utils.js`:
  * Test tính toán tốc độ trung bình từ mảng `duration`.
  * Test phân tích lỗi sai phổ biến nhất dựa trên `stepFails`.
  * Test phân loại danh sách bài học và gợi ý nhiệm vụ khẩn cấp.
* Chạy test bằng lệnh: `npm run test:gate`.

### Kiểm thử thủ công (Manual Verification):
1. Chơi thử một bài học để ghi nhận `duration` mới và kiểm tra xem thuộc tính Tốc độ trên trang Thấu hiểu có cập nhật chính xác không.
2. Cố tình làm sai ở bước "Tự tính" để xem trang Thấu hiểu có xuất hiện "Quái vật Tính Nhầm" tương ứng hay không.
3. Kiểm tra tính tương thích Responsive trên mobile (Safari iOS và Chrome Android) để đảm bảo các thanh thuộc tính, avatar nhân vật không bị tràn hay co bóp xấu.
