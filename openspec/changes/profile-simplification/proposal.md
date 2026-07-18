# Proposal: Đơn giản hóa và Tối ưu hóa Trang Hồ sơ Học sinh (Profile Redesign)

Đề xuất cải tiến trang Hồ sơ thiết lập (Profile & Settings Bottom Sheet) nhằm giải quyết tình trạng giao diện quá tải, lộn xộn, trộn lẫn tính năng của học sinh và cấu hình của phụ huynh/lập trình viên.

---

## 1. Hiện trạng & Đánh giá (Phase 1: Discover)

Hiện tại, trang hồ sơ của **TonyMath** (`App.jsx` dòng 1186–1447) hiển thị toàn bộ thiết lập trong một bảng cuộn duy nhất (bottom sheet). Giao diện này phục vụ 3 nhóm tính năng khác nhau:
1. **Học sinh:** Đổi tên hiển thị, Chọn Mascot đồng hành (Cú Ú, Rô Bốt, Rùa Con).
2. **Phụ huynh:** Đổi Lớp & Môn học, Thay đổi Chế độ học tập (8 bước / 5 bước / 3 bước), Cài đặt nhắc nhở & Chuông báo học, Chế độ thử thách (Challenge Mode - tốn ❤️ khi mở gợi ý).
3. **Lập trình viên:** Mở khóa tất cả bài học (Dev Mode), Xóa sạch tiến độ.

### Điểm yếu của thiết kế hiện tại:
* **Gây rối mắt cho học sinh nhỏ tuổi:** Trẻ em chỉ quan tâm đến nhân vật Mascot, tên của mình và các thành tích đạt được. Việc nhìn thấy hàng loạt bảng chọn Lớp học, Chuông báo, Giờ giấc, Chế độ siêu tốc/từng bước, hay Reset dữ liệu làm loãng trải nghiệm vui tươi của app.
* **Nguy cơ lỗi vận hành:** Bé có thể vô tình bấm đổi lớp học (mất danh sách bài cũ), bật Chế độ thử thách (gây mất tim ức chế khi học), hoặc tệ nhất là bấm nhầm "Xóa toàn bộ tiến độ" dẫn tới mất hết XP/sao đã tích lũy.
* **Thiếu tính tương tác & gamification:** Mascot chọn xong chỉ đổi emoji tĩnh, không có câu đối thoại tương tác cụ thể ngay lúc chọn. Thiếu vắng khu vực khoe thành tích (Level, XP, Ngày học liên tiếp - Streak, và Huy hiệu/Badges đã đạt được) để tạo động lực cho học sinh.

---

## 2. Phân tích 9 Ô (9 Windows Analysis - Phase 2)

| Hệ thống | Quá khứ | Hiện tại | Tương lai |
| :--- | :--- | :--- | :--- |
| **Siêu hệ thống** *(Ecosystem)* | Học toán qua bài tập giấy hoặc app tĩnh, không cá nhân hóa, không có Mascot. | Các app học tập hiện đại chia rõ 2 không gian: Bé cá nhân hóa & Ba mẹ cài đặt cấu hình học. | Trợ lý học tập AI tự động thích ứng với thói quen học sinh; Phụ huynh quản lý từ xa. |
| **Hệ thống** *(TonyMath)* | Giao diện menu chọn cấu hình đơn giản bằng thẻ chọn `<select>` thô sơ. | Bottom Sheet đẹp hơn nhưng ôm đồm tất cả tính năng vào một chỗ. | Phân chia rõ rệt: **Không gian của Bé** (Gamified) & **Cửa ngõ Phụ huynh** (Bảo mật bằng Math Gate). |
| **Phân hệ** *(Components)* | Chỉ lưu tên học sinh cơ bản vào LocalStorage. | Các thẻ `profile-sheet-card` phẳng, danh sách nút bấm dày đặc và nút reset nguy hiểm. | Thẻ Avatar/Mascot động kèm câu thoại chào hỏi sinh động; Khung khoe Huy hiệu; Cổng bảo mật Math Gate. |

### Phát biểu vấn đề (Problem Qualification Statement)
* **Dành cho:** Trẻ em tiểu học sử dụng app TonyMath học toán.
* **Gặp khó khăn vì:** Trang hồ sơ hiện tại quá phức tạp, trộn lẫn cấu hình của bố mẹ (lớp học, giờ báo chuông, chế độ tim) và nút bấm của dev với khu vực đổi tên/chọn mascot của bé.
* **Dẫn đến:** Trẻ dễ bấm nhầm làm thay đổi tiến trình học tập, mất dữ liệu, đồng thời trang hồ sơ bị khô khan, thiếu tính năng khoe thành tích để kích thích bé học.
* **Giải pháp:** Tách biệt trang Hồ sơ thành 2 phần rõ rệt: **Hồ sơ của Bé** (mặc định mở ra, tối giản, sinh động, khoe XP/Streak/Huy hiệu) và **Góc Phụ Huynh** (bảo vệ bằng một phép toán nhân/chia đơn giản để trẻ không bấm nhầm vào cài đặt sâu).

---

## 3. Các Phương án Giải quyết (Phase 3: Develop)

Dưới đây là 3 phương án thiết kế lại trang Hồ sơ:

### Phương án A: Thiết kế dạng Tab phân chia + Cổng bảo mật Toán học (Math Gate) — *Khuyến nghị*
* **Cách tiếp cận:** Giữ nguyên nút Hồ sơ (👦) ở thanh trên. Khi mở lên, Bottom Sheet sẽ được phân làm 2 Tab rõ rệt:
  1. **Tab 1: "Hồ sơ của Bé" (Mặc định)**
     * Chỉ có: Đổi tên bé (khung nhập đẹp), Chọn Mascot đồng hành (hiển thị thẻ Mascot hoạt họa, bấm vào Mascot nào Mascot đó sẽ "nói" một câu chào đặc trưng qua khung thoại hoặc audio).
     * Bổ sung khu vực **Thành tựu của Bé**:
       * Huy hiệu cấp độ (Level tính từ XP).
       * Chuỗi ngày học liên tiếp (Streak 🔥).
       * Khoe 3-4 Huy hiệu nổi bật nhất bé đã mở khóa (từ danh sách Achievements).
     * Dưới cùng có nút nổi bật: **"⚙️ Góc cho Ba Mẹ"**.
  2. **Cửa ngõ bảo mật (Math Gate):** Khi bé bấm vào "Góc cho Ba Mẹ", app hiển thị một phép tính ngẫu nhiên (Ví dụ: *"Ba mẹ ơi, hãy tính giúp con: 7 x 8 = ?"*). Chỉ khi nhập đúng đáp án mới chuyển sang Tab phụ huynh.
  3. **Tab 2: "Góc Phụ Huynh & Thiết lập"**
     * Chứa toàn bộ cấu hình: Lớp học & Môn học, Chế độ học tập (8/5/3 bước), Nhắc nhở tự động (Chuông báo, Giờ giấc, Tải lịch ICS), Chế độ thử thách (mất tim).
     * Mục **Cài đặt kỹ thuật & Reset** được thu gọn vào cuối trang và làm mờ/cảnh báo đỏ để tránh vô tình bấm.
* **Độ khó thực hiện:** Trung bình (Medium - khoảng 1.5 giờ code).
* **Ưu điểm:**
  * Giải quyết triệt để vấn đề an toàn dữ liệu học tập (tránh trẻ nghịch dại reset hoặc đổi lớp).
  * Tăng động lực học cho bé nhờ giao diện khoe huy hiệu, điểm XP, chuỗi ngày học 🔥.
  * Giữ app gọn gàng, không cần đẻ thêm nút cài đặt mới trên giao diện chính.
* **Nhược điểm:** Phải code thêm logic sinh phép tính Math Gate và quản lý trạng thái chuyển tab.

---

### Phương án B: Tách biệt hoàn toàn (Nút Hồ sơ riêng & Nút Cài đặt riêng)
* **Cách tiếp cận:**
  * Nút 👦 trên Header chỉ mở **Hồ sơ của Bé**: chứa Tên, Mascot, XP, Badge. Tuyệt đối không có bất cứ nút cấu hình hay lớp học nào.
  * Thêm một nút bánh răng ⚙️ (Settings) nhỏ ở góc dưới Sidebar hoặc Header để mở **Cài đặt hệ thống** dành riêng cho Phụ huynh (cũng bảo vệ bằng PIN hoặc Math Gate).
* **Độ khó thực hiện:** Trung bình.
* **Ưu điểm:** Tách biệt vật lý cực kỳ rõ ràng, bé không thấy nút "Góc của Mẹ" trong hồ sơ nên không tò mò phá khóa.
* **Nhược điểm:** Cần sửa layout Header/Sidebar để nhét thêm nút cài đặt mới, có thể làm chật giao diện trên điện thoại màn hình nhỏ.

---

### Phương án C: Thu gọn dạng Accordion đơn giản (Không có Cổng bảo mật)
* **Cách tiếp cận:**
  * Giữ nguyên giao diện phẳng hiện tại nhưng chỉ hiển thị Tên bé và Mascot ở trên cùng.
  * Các thẻ Lớp học, Chế độ học, Nhắc nhở, Reset được giấu bên trong một khối rút gọn (Accordion) tiêu đề *"Cấu hình học tập (Dành cho cha mẹ)"*.
  * Bấm vào tiêu đề sẽ mở ra toàn bộ thiết lập mà không cần Math Gate hay mật mã.
* **Độ khó thực hiện:** Dễ (Easy - 30 phút code).
* **Ưu điểm:** Thời gian hoàn thành siêu nhanh, ít thay đổi cấu trúc code.
* **Nhược điểm:** Trẻ em tò mò sẽ tự bấm mở Accordion ra bình thường, nguy cơ bấm nhầm xóa tiến độ vẫn rất cao. Không có thêm các tính năng gamification để động viên bé.

---

## 4. Ma trận Điểm số & Đánh giá (Phase 4: Evaluate)

| Tiêu chí | Trọng số | Phương án A (Tab + Math Gate + Gamification) | Phương án B (Tách nút Profile & Settings) | Phương án C (Accordion rút gọn đơn giản) |
| :--- | :---: | :---: | :---: | :---: |
| **Kỹ thuật (Tech)** *(Khả thi, Dễ bảo trì)* | 25% | **8.5/10** | **8.0/10** | **9.5/10** |
| **Sản phẩm (Product)** *(Trải nghiệm bé, Bảo mật phụ huynh)* | 30% | **10/10** | **9.0/10** | **5.5/10** |
| **Thiết kế (Design)** *(Độ đẹp, Trực quan, Gamified)* | 20% | **10/10** | **8.5/10** | **6.5/10** |
| **Hiệu quả (Business)** *(Động lực học tập, Chuyển đổi)* | 25% | **9.5/10** | **8.0/10** | **6.0/10** |
| **Tổng điểm trọng số** | **100%** | **9.55 / 10** | **8.35 / 10** | **6.75 / 10** |

### 🎯 Đề xuất lựa chọn: Phương án A (Thiết kế dạng Tab phân chia + Math Gate)
* **Lý do:**
  1. Đây là cách làm chuẩn của các app EdTech lớn. Nó tôn trọng trẻ em bằng cách cho trẻ một không gian cá nhân riêng đẹp đẽ (khoe thành tích, chọn bạn đồng hành) đồng thời bảo vệ tiến trình học tập của trẻ khỏi sự vô ý.
  2. Việc tích hợp Math Gate dạng ngẫu nhiên (Ví dụ: `6 x 7 = ?`) vừa bảo mật tốt vừa mang tính giáo dục, tăng tính tương tác toán học ngay trong app toán.
  3. Mascot đồng hành khi được chọn sẽ hiển thị bong bóng đối thoại trực tiếp chào bé, ví dụ: Rùa Con 🐢 *"Tớ sẽ đồng hành cùng cậu chậm mà chắc nhé!"* giúp tăng gắn kết cảm xúc.

---

## 5. Kế hoạch xác minh (Verification Plan)

### Kiểm thử tự động (Automated Tests)
* Chạy test kiểm tra logic lưu trữ và khôi phục trạng thái hồ sơ học sinh:
  `npm run test` hoặc chạy các test có sẵn của `utils.test.js`.

### Xác minh thủ công (Manual Verification)
1. **Kiểm tra Cổng toán học (Math Gate):** Bấm nút "Góc phụ huynh", nhập đáp án sai -> hiển thị báo lỗi và không cho qua; nhập đúng -> chuyển sang giao diện thiết lập.
2. **Kiểm tra Mascot:** Chọn Cú Ú, Robot, Rùa Con -> kiểm tra câu thoại chào tương ứng có hiển thị đúng bong bóng chat và phát giọng đọc phù hợp không.
3. **Kiểm tra hiển thị Thành tựu:** Đảm bảo XP hiển thị đúng, vòng tròn cấp độ tính toán chuẩn, các Huy hiệu đã mở khóa sáng lên, huy hiệu chưa mở khóa bị mờ đi.
4. **Kiểm tra responsive:** Đảm bảo trên điện thoại di động Bottom Sheet mở rộng đẹp mắt, nút đóng dễ bấm, trên desktop hiển thị như một hộp thoại nổi ở trung tâm.
