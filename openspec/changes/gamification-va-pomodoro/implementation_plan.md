# Kế Hoạch Triển Khai: Nâng Cấp Toàn Diện Hồ Sơ Năng Lực & Tích Hợp Lộ Trình 60 Bài Học

Dự án sẽ nâng cấp giao diện Trang Đánh Giá Đầu Vào (Onboarding Assessment) để khớp chính xác với thiết kế trực quan trong hình ảnh người dùng tải lên, đồng thời cập nhật toàn bộ logic tính toán 3 chỉ số năng lực toán học thực tế và tích hợp lộ trình học tập 60 bài học theo Chương.

---

## 1. Phân Tích & Điều Chỉnh Thiết Kế Hồ Sơ Năng Lực (UX/UI Alignment)

Dựa trên hình ảnh thực tế của trang Onboarding:
* **Mascot Card:** Ảnh minh họa Mascot Cú Ú thám tử cầm bảng chứng nhận sẽ được đóng khung trắng bo góc tròn, đổ bóng nổi bật ở giữa card. (Chúng ta sẽ sử dụng ảnh `/public/detective_owl.jpg` đã được tạo).
* **3 Cột Kỹ Năng Động (Skill Bars):**
  1. **Đọc hiểu đề:** Thanh tiến trình màu xanh dương (Gradient từ `#3b82f6` đến `#60a5fa`).
  2. **Phép tính cơ bản:** Thanh tiến trình màu xanh lá (Gradient từ `#10b981` đến `#34d399`).
  3. **Giải toán 2 bước:** Thanh tiến trình màu cam (Gradient từ `#f59e0b` đến `#fbbf24`).
* **Vị trí hiển thị Sao & Phần trăm:** Mỗi thanh tiến trình có một ngôi sao vàng nhỏ ở góc trên bên phải hiển thị số phần trăm tương ứng (ví dụ: `⭐ 85%`).
* **Phong cách nền (Background):** Nền màn hình onboarding có hiệu ứng chuyển màu gradient pastel nhẹ nhàng (từ xanh da trời nhạt sang tím hồng nhạt), kèm theo các phần tử trang trí bay lơ lửng xung quanh (bút chì, ngôi sao, hình tròn, số `1`, số `8`).
* **Nút bấm Hành trình:** Nút bấm màu tím tròn trịa, rộng, nổi bật: **"Bắt đầu hành trình học 🚀"** nằm ở dưới cùng của hộp giao diện.

---

## 2. Logic Tính Toán Kỹ Năng Thực Tế (Dynamic Capability Scoring)

Thay vì gán điểm tĩnh theo mức điểm tổng (score 0-8), điểm phần trăm của 3 chỉ số năng lực sẽ được tính toán động dựa theo kết quả các câu hỏi kiểm tra cụ thể:

### A. Phân loại câu hỏi trong 8 bài kiểm tra đầu vào:
* **Kỹ năng Đọc hiểu đề** (Kiểm tra qua Câu 3, 6, 7):
  * Câu 3: Chia đều 24 kẹo cho 3 tổ.
  * Câu 6: Phân số trực quan pizza (8 miếng ăn 3).
  * Câu 7: Đo lường thời gian (15h $\rightarrow$ 15h40).
* **Kỹ năng Phép tính cơ bản** (Kiểm tra qua Câu 1, 2):
  * Câu 1: Cộng cơ bản (5 + 4).
  * Câu 2: Nhân cơ bản (gấp đôi của 6).
* **Kỹ năng Giải toán 2 bước / Logic** (Kiểm tra qua Câu 4, 5, 8):
  * Câu 4: Khẩu trang (2 bước tính: trừ và nhân).
  * Câu 5: Số sao của Vy và Hà (so sánh ít hơn rồi cộng tổng).
  * Câu 8: Bài toán Tổng - Hiệu (tổng 20, hiệu 4).

### B. Công thức tính điểm phần trăm:
Để đảm bảo giao diện hiển thị đẹp và khích lệ trẻ em, điểm số được tính theo công thức:
$$\text{Percent} = 40 + \left( \frac{\text{Số câu đúng thuộc nhóm}}{\text{Tổng số câu thuộc nhóm}} \times 60 \right)$$
* Nếu đúng hết: đạt **100%**.
* If sai hết: vẫn nhận mức cơ bản **40%** để khích lệ tinh thần học tập.

### C. Đồng bộ với Solver Bài Học (Liên kết Lực học thực tế):
Khi học sinh làm bài tập chính thức, các bước giải toán trong Solver sẽ liên tục cập nhật ngược lại 3 chỉ số năng lực này:
* Trả lời sai ở Bước 1, 2, 3 (Đọc hiểu, Phân loại, Sơ đồ) $\rightarrow$ Giảm nhẹ lực học **Đọc hiểu đề**.
* Trả lời sai ở Bước 4, 5 (Phép tính, Tính toán) $\rightarrow$ Giảm nhẹ lực học **Phép tính cơ bản**.
* Trả lời sai ở Bước 6, 7, 8 (Đáp số đầy đủ, Thử thách mở rộng) $\rightarrow$ Giảm nhẹ lực học **Giải toán 2 bước**.
* Học sinh sẽ thấy Hồ sơ năng lực của mình thay đổi theo thời gian thực tại tab "Tiến độ".

---

## 3. Bản Đồ Lộ Trình 60 Bài Học Theo Chương

Bản đồ phiêu lưu hành trình chính sẽ chứa 60 bài học thực tế trong tệp `math.json`, được phân loại Elo độc lập theo thuộc tính khó dễ và nhóm vào 6 Chương:

1. **Chương 1: Phép tính & Trung bình cộng** (Bài 1 - 12)
2. **Chương 2: Tìm hai số khi biết Tổng và Hiệu** (Bài 13 - 20)
3. **Chương 3: Tỉ số thần kỳ (Tổng-Tỉ & Hiệu-Tỉ)** (Bài 21 - 32)
4. **Chương 4: Rút về đơn vị & Đo lường** (Bài 33 - 44)
5. **Chương 5: Phân số & Tiền tệ mua bán** (Bài 45 - 52)
6. **Chương 6: Suy luận logic & Biểu đồ** (Bài 53 - 60)

---

## 4. Các Tệp Tin Sẽ Thay Đổi

### ✏️ [MODIFY] [utils.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/utils.js)
* Cập nhật thuật toán đề xuất để xử lý phân bổ 3 nhóm Quests dựa trên lực học thực tế.
* Hàm cập nhật chỉ số năng lực (`reading`, `arithmetic`, `solving`) sau mỗi bài học.

### ✏️ [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
* Tái cấu trúc cấu phần `AssessmentReport` để hiển thị khung ảnh mascot, 3 cột chỉ số năng lực kèm sao, nút bấm lớn màu tím, nền gradient và các phần tử trang trí (bút chì, hình sao bay lơ lửng) đúng thiết kế.
* Tích hợp lưu trữ 3 chỉ số năng lực vào `progress.profile.capabilities`.

### ✏️ [MODIFY] [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
* Thêm các lớp CSS tạo kiểu cho các hiệu ứng nền trôi nổi, bo viền nổi bật cho khung Mascot, màu gradient cho các thanh trượt và hiệu ứng 3D cho nút bấm hành trình màu tím.

---

## 5. Kế Hoạch Xác Minh

* **Mỹ thuật:** Chụp lại ảnh màn hình kết quả sau khi hoàn thành bài test Onboarding, so sánh trực quan với hình ảnh thiết kế gốc của người dùng.
* **Logic:** Kiểm tra xem trả lời đúng các câu hỏi có phản ánh chính xác lên 3 thanh tiến trình kỹ năng tương ứng không.
