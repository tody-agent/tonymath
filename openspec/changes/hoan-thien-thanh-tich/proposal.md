# Proposal: Hoàn thiện tính năng trang Thành tích (Achievements Page Polish)

Tài liệu đề xuất các phương án cải tiến trang Thành tích, biến nó từ một danh sách tĩnh thành một hệ thống phần thưởng tương tác, trực quan, thúc đẩy động lực học tập của bé thông qua mascot và các màn ăn mừng sinh động.

## Khảo sát hiện trạng (Discover)

1. **Vị trí code**:
   - Giao diện: Component `Achievements` nằm tại [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx#L4155-L4167).
   - Style: Lớp CSS `.achievement-grid`, `.achievement`, `.achievement.unlocked` tại [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css#L172-L182).
   - Dữ liệu: Các thành tích đang được tính toán on-the-fly dựa trên `progress` và `earnedStars`.

2. **Hạn chế hiện tại**:
   - **Tĩnh & đơn điệu**: Thẻ thành tích bị khóa chỉ hiển thị grayscale và dòng chữ "Tiếp tục học để mở". Trẻ không biết mình đã hoàn thành được bao nhiêu phần trăm (ví dụ: cần 15 sao nhưng đã có bao nhiêu sao thì không hiện).
   - **Thiếu tương tác**: Nhấp vào thẻ thành tích không có phản ứng gì (không có popup chi tiết, không có mascot khuyên nhủ).
   - **Không có ăn mừng tức thời**: Khi bé đạt đủ điều kiện mở khóa thành tích trong lúc làm bài, không có màn ăn mừng nào xuất hiện ngay lập tức để ghi nhận nỗ lực của bé.
   - **Số lượng thành tích ít**: Chỉ có 6 thành tích cơ bản, thiếu các cột mốc thử thách khó hơn hoặc ghi nhận thói quen học tập tốt khác.

---

## Phân tích 9 ô (9 Windows Analysis)

| Cấp độ | Quá khứ | Hiện tại | Tương lai |
|---|---|---|---|
| **SUPER-SYSTEM** *(Học trực tuyến)* | Bài tập tính toán khô khan, tập trung vào điểm số và tốc độ. | Ứng dụng gamification nhẹ (XP, Streaks) nhưng còn rời rạc. | Trải nghiệm học tập tạo động lực tự thân, khuyến khích sự kiên trì và tư duy mở rộng. |
| **SYSTEM** *(Ứng dụng Học Toán)* | Chỉ có bài học tĩnh và chọn bài đơn giản. | Có lộ trình học cá nhân hóa, mascot động viên, Pomodoro và 6 thành tích tĩnh. | Hệ thống phần thưởng tương tác cao, tủ cúp trưng bày sinh động, mascot tư vấn học tập thông minh. |
| **SUB-SYSTEM** *(Component Thành tích)* | Chưa có trang thành tích. | Component `Achievements` render tĩnh các div grayscale dựa trên state cha. | Component `Achievements` giàu tương tác, popup chi tiết, thanh tiến trình động, và lưu trữ lịch sử mở khóa cụ thể. |

---

## Phương án đề xuất (Develop)

### Option A (Khuyên dùng): Trung tâm Thành tích Tương tác & Mascot Đồng hành (Interactive Hub & Live Celebrations)

**Cách tiếp cận**: Cải tiến giao diện thẻ thành tích thành các nút bấm tương tác, hiển thị thanh tiến trình trực quan, tích hợp Mascot khuyên học và hệ thống popup ăn mừng tức thì khi vừa đạt thành tích.

- **Chi tiết thay đổi**:
  1. **Hiển thị tiến trình trực quan**: Mỗi thẻ thành tích bị khóa sẽ hiển thị một thanh tiến trình mini kèm số liệu chi tiết (ví dụ: `10 / 15 ⭐` hoặc `2 / 4 bài học`).
  2. **Popup chi tiết tương tác**: Khi bấm vào một thẻ thành tích (kể cả khóa hay mở), một modal/drawer được thiết kế đẹp mắt sẽ hiện ra, hiển thị:
     - Tên, icon lớn, mô tả chi tiết nhiệm vụ.
     - Lời thoại từ Mascot hiện tại của bé (Cú Ú, Rùa Con hoặc Rô Bốt) gợi ý cách mở khóa (ví dụ: *"Cú Ú khuyên: Con chỉ cần tích lũy thêm 30 XP nữa là đạt huy hiệu này rồi, cố lên nhé!"*).
     - Ngày giờ mở khóa (nếu đã đạt).
  3. **Lưu vết ngày mở khóa**: Bổ sung object `unlockedAchievements` vào `progress` để lưu vết thời gian bé đạt thành tích (ví dụ: `{"thám tử dữ kiện": "2026-07-17T15:26:09Z"}`).
  4. **Hệ thống ăn mừng khi học xong**:
     - Khi bé hoàn thành bài học, hàm `applyLessonResult` sẽ kiểm tra xem có thành tích nào chuyển từ khóa sang mở không.
     - Nếu có, sau khi màn hình kết quả bài học hiện ra, một popup ăn mừng lớn với hiệu ứng Canvas Confetti và mascot chúc mừng sẽ xuất hiện để tạo bất ngờ và phấn khích cho bé.
  5. **Bổ sung 3 thành tích mới**:
     - **"Vượt khó thành công"** (Challenge Mode): Hoàn thành ít nhất 1 bài học ở Chế độ Thử thách hoặc bài học có độ khó `hard`.
     - **"Trí tuệ hoàn hảo"** (Perfect Score): Đạt điểm tuyệt đối 3 sao trong bất kỳ bài học nào.
     - **"Học viên chăm chỉ"** (Dedicated Learner): Đã bật nhắc nhở học tập hàng ngày.

- **Ước lượng công sức**: **M** (Khoảng 4 - 6 giờ phát triển).
- **Rủi ro**: Thấp. Đã có sẵn cấu trúc lưu trữ `progress` trong LocalStorage để mở rộng dễ dàng.

---

### Option B: Tủ trưng bày Huy hiệu 3D & Cửa hàng Mascot (Badge Showcase & Mascot Shop)

**Cách tiếp cận**: Thay đổi hoàn toàn bố cục trang thành một tủ gỗ trưng bày cúp/huy hiệu theo mô hình 3D, liên kết việc đạt thành tích với điểm vàng thưởng dùng để mua trang phục cho Mascot.

- **Chi tiết thay đổi**:
  - Giao diện dạng tủ trưng bày bằng CSS Grid sáng tạo, giả lập kệ gỗ. Các huy hiệu đã mở sẽ phát sáng lấp lánh, các huy hiệu chưa mở là bóng mờ 3D.
  - Khi mở khóa thành tích, bé nhận được một lượng "Xu Vàng".
  - Thêm một trang phụ "Cửa hàng Mascot", cho phép bé dùng Xu Vàng để mua mũ, kính mắt, hoặc bóng bay trang trí cho mascot đại diện (Cú Ú, Rùa Con).
  - Tích hợp tính năng tạo ảnh Certificate (Chứng nhận thành tích học tập) bằng HTML5 Canvas để bé có thể tải về khoe bố mẹ.
- **Ước lượng công sức**: **XL** (Khoảng 2 - 3 ngày phát triển).
- **Rủi ro**: Trung bình-Cao. Đòi hỏi thiết kế nhiều asset hình ảnh/CSS cho trang phục mascot và xử lý canvas phức tạp. Việc này có thể làm phình to kích thước code và giảm hiệu năng trên thiết bị di động cũ của trẻ.

---

### Option C: Cải tiến giao diện Tối giản (Minimalist Polish)

**Cách tiếp cận**: Giữ nguyên layout cũ nhưng tinh chỉnh CSS cho mượt mà hơn và thêm tooltip khi di chuột.

- **Chi tiết thay đổi**:
  - Thêm thuộc tính `title` hoặc tooltip thuần CSS để hiển thị điều kiện mở khóa khi hover chuột vào thẻ thành tích.
  - Thêm số liệu tiến trình dưới dạng chữ nhỏ (ví dụ: `(2/4)`).
  - Không thay đổi cấu trúc lưu trữ `progress`, không có mascot khuyên nhủ hay popup ăn mừng confetti.
- **Ước lượng công sức**: **S** (Khoảng 1 - 2 giờ).
- **Rủi ro**: Không có. Tuy nhiên phương án này chưa tạo ra đủ độ "WOW" và chưa tối ưu hóa hiệu quả gamification cho đối tượng học sinh tiểu học.

---

## 🎯 So sánh & Khuyến nghị

| Tiêu chí | Trọng số | Option A (Interactive Hub) | Option B (Wood Shelf & Shop) | Option C (Minimalist) |
|---|---|---|---|---|
| **Tech** (khả thi, ổn định, bảo trì) | 25% | **9 / 10** | **5 / 10** | **10 / 10** |
| **Product** (giá trị cho bé, gamification) | 30% | **9 / 10** | **10 / 10** | **4 / 10** |
| **Design** (giao diện, độ WOW, mascot) | 20% | **9 / 10** | **9.5 / 10** | **5 / 10** |
| **Business** (thời gian hoàn thành, ROI) | 25% | **9 / 10** | **5 / 10** | **8 / 10** |
| **Tổng điểm có trọng số** | **100%** | **9.0 / 10** | **7.3 / 10** | **6.7 / 10** |

**Khuyến nghị**: **Chọn Option A**.
Phương án này mang lại sự cân biến hoàn hảo giữa tính tương tác cao (thanh tiến trình trực quan, popup mascot khuyên nhủ, canvas confetti ăn mừng) và chi phí thực thi tối ưu. Việc lưu vết ngày mở khóa giúp dữ liệu tiến trình của bé trở nên sinh động và đáng tin cậy hơn.

---

## Kế hoạch kiểm thử (Verification Plan)

### Kiểm thử tự động
- Viết test case trong [utils.test.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/utils.test.js) để kiểm tra logic mở khóa thành tích mới.
- Kiểm tra tính đúng đắn của việc ghi nhận `unlockedAchievements` sau khi gọi `applyLessonResult`.

### Kiểm thử thủ công
1. Vào trang Thành tích, kiểm tra xem các thanh tiến trình hiển thị đúng số liệu thực tế của bé không (ví dụ: bao nhiêu sao, bao nhiêu XP).
2. Click vào từng thẻ thành tích để kiểm tra modal hiển thị thông tin và Mascot phản hồi tương ứng.
3. Học thử một bài mới để đạt đủ điều kiện mở khóa một thành tích (ví dụ: đạt 3 sao lần đầu tiên) và kiểm tra xem màn hình ăn mừng Confetti có xuất hiện ngay sau khi kết thúc bài học hay không.

---

## 🎨 Giao diện đề xuất (Mockup Design)

Dưới đây là thiết kế giao diện đề xuất cho Option A với thanh tiến trình và mascot đồng hành:

![Giao diện Thành tích đề xuất](/Users/hailm/.gemini/antigravity/brain/3ec56179-558d-4009-b83a-aff93e1f3943/achievements_ui_preview_1784302110698.jpg)

