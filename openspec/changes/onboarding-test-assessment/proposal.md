# Proposal: Thay Thế Onboarding Hướng Dẫn Bằng Bài Test Đánh Giá Học Lực Cá Nhân Hóa

## 1. Why we're doing this

### Qualified Problem
* **For:** Các bé tiểu học (lớp 3-4) mới bắt đầu sử dụng ứng dụng và phụ huynh của các bé.
* **Who:** Cần một buổi bắt đầu (onboarding) thú vị, sinh động, đồng thời kiểm tra nhanh được năng lực toán thực tế của bé để cá nhân hóa lộ trình học, tránh việc học quá dễ gây chán hoặc quá khó gây nản.
* **The:** Quy trình onboarding hiện tại là một bài học hướng dẫn (tutorial) dài 8 bước bắt buộc, có tính chất "cầm tay chỉ việc" tuyệt đối (chỉ được phép chọn đáp án đúng được highlight sẵn) cho một bài toán cộng cực kỳ đơn giản (3 + 2).
* **That:** Cần thay thế bằng một **bài kiểm tra chẩn đoán (Diagnostic Onboarding Test) gồm 8 câu hỏi** đa dạng mức độ (Dễ, Trung bình, Khó). Trong đó lồng ghép các bài toán thách thức vừa sức ở vị trí **Câu 4 và Câu 8** để kích thích tinh thần vượt khó của bé, nhận phản hồi động viên từ linh vật đồng hành, và kết thúc bằng một **Báo cáo học lực & Kế hoạch học tập cá nhân hóa**.
* **Unlike:** Cách tiếp cận cũ mang tính thụ động, gò bó, không phản ánh đúng trình độ của bé và không khơi gợi được sự tò mò/thử thách.
* **Our approach:** Thiết kế một bài kiểm tra "Quest" thám tử gồm 8 câu hỏi trắc nghiệm và điền số nhanh. Linh vật (Cú Ú, Rô Bốt, Rùa Con) sẽ là người cổ vũ xuyên suốt bài test. Sau khi hoàn thành, hệ thống sẽ phân loại học lực của bé (Khởi động vững chắc, Bứt phá tư duy, Thử thách siêu cấp) và hiển thị một chứng nhận/bảng phân tích cá nhân hóa kèm theo lộ trình học khuyến nghị.

### Root Causes
1. **Technical:** Luồng onboarding hiện tại đang bị hardcode vào component `OnboardingLesson` chạy qua các bước cố định của `LESSON_0`.
2. **Product:** Chưa có cơ chế phân loại học lực lúc đầu vào, dẫn đến tất cả các bé đều nhận được một lộ trình gợi ý tuần tự giống nhau.
3. **Design:** Thiếu giao diện báo cáo học lực trực quan, sinh động để tạo động lực và gây ấn tượng mạnh cho bé ngay từ lần đầu truy cập.

### Impact if NOT addressed
* **User impact:** Học sinh khá giỏi sẽ thấy ứng dụng quá dễ và tẻ nhạt ngay từ bước đầu tiên; học sinh yếu hơn thì không được chuẩn bị tinh thần cho các bài toán khó hơn về sau.
* **Business impact:** Tỉ lệ giữ chân người dùng (Retention Rate) ngày thứ nhất giảm do trải nghiệm ban đầu thiếu tính tương tác và không chứng minh được giá trị cá nhân hóa của app.
* **Technical debt:** Luồng code onboarding cũ gò bó khó tùy biến hoặc mở rộng cho các môn học/khối lớp khác.

---

## 2. 9 Windows Analysis (TRIZ)

| Trục thời gian | QUÁ KHỨ (Past) | HIỆN TẠI (Present) | TƯƠNG LAI (Future) |
| :--- | :--- | :--- | :--- |
| **SUPER-SYSTEM** *(Hệ sinh thái)* | Các app học toán truyền thống dùng bài tập giấy số hóa hoặc bài test dài dòng gây căng thẳng cho trẻ. | Trẻ em quen với các ứng dụng gamification (như Duolingo) có bài test xếp lớp nhanh, trực quan. | Cá nhân hóa học tập dựa trên AI thích ứng (Adaptive Learning), chẩn đoán điểm mạnh/yếu tức thì. |
| **SYSTEM** *(Sản phẩm)* | App học toán chỉ hiển thị danh sách bài học tĩnh, không có hướng dẫn lúc bắt đầu. | App có onboarding dài 8 bước gò bó, bắt buộc bé làm theo mẫu có sẵn của Bài 0. | App có onboarding test 8 câu sinh động, chẩn đoán năng lực và sinh lộ trình học phù hợp. |
| **SUB-SYSTEM** *(Thành phần)* | Component chứa danh sách bài đơn giản. | Component `OnboardingView` & `OnboardingLesson` chạy tuyến tính. | Component `OnboardingTest` tương tác, chứa ngân hàng câu hỏi test đầu vào và bộ tạo học lực. |

---

## 3. Options Evaluated

### Option A: "Thử Thách Thám Tử Nhí" (Diagnostic Test & Personalized Plan) - KHUYÊN DÙNG
* **Approach:** Thay thế hướng dẫn cũ bằng một bài test gồm 8 câu hỏi toán lời văn đa dạng chủ đề từ dễ đến lắt léo.
  * *Câu 1, 2, 3:* Mức độ Dễ/Trung bình (Phép cộng/trừ 1 bước, gấp số lần).
  * *Câu 4 (Khó #1):* Bài toán 2 bước tính (Tính tổng rồi trừ hoặc gấp lên rồi cộng).
  * *Câu 5, 6, 7:* Mức độ Trung bình (So sánh nhiều hơn/ít hơn, phân số cơ bản, thời gian).
  * *Câu 8 (Khó #2):* Bài toán Tìm hai số khi biết Tổng và Hiệu hoặc Trung bình cộng lồng ghép thực tế.
  * Linh vật sẽ nói câu động viên phù hợp với từng câu trả lời của bé. Bé làm sai vẫn được đi tiếp để giữ mạch trải nghiệm (không block bắt làm lại như bài học thông thường).
  * Sau câu 8, hiển thị màn hình **"Hồ Sơ Năng Lực"** sinh động: Xếp hạng học lực, Huy hiệu thám tử, điểm mạnh điểm yếu, lộ trình bài học đề xuất đặc biệt cho bé.
* **Philosophy:** Balanced, User-first (đánh giá chuẩn xác, tạo động lực tốt).
* **Effort:** Medium (~3-4 giờ phát triển).
* **Risk level:** Low.
* **Pros:**
  * Giải quyết triệt để yêu cầu của người dùng: lồng ghép câu hỏi khó vừa sức ở câu 4 và 8, khích lệ động viên bé, cá nhân hóa lộ trình.
  * Trải nghiệm mượt mà, không gây áp lực thời gian.
  * Tận dụng tối đa mascot để tương tác giọng nói (Text-to-Speech).
* **Cons:** Cần thiết kế giao diện báo cáo học lực thật đẹp để gây ấn tượng mạnh (Wow factor).

### Option B: "Đấu Trường Tốc Độ" (Timed Challenge Assessment)
* **Approach:** Cho bé giải toán dưới dạng tính nhanh vượt chướng ngại vật trong 2 phút. Số câu đúng càng nhiều trình độ xếp hạng càng cao. Câu 4 và Câu 8 sẽ là "Quái vật cản đường" có câu hỏi khó hơn.
* **Philosophy:** Game-first, Competitive.
* **Effort:** Medium-High (~4-5 giờ).
* **Risk level:** Medium (áp lực thời gian có thể khiến các bé học lực yếu hoặc có tốc độ đọc chậm bị hoảng sợ, nản lòng ngay từ đầu).
* **Pros:** Tính kích thích cực kỳ cao đối với học sinh giỏi.
* **Cons:** Không phù hợp với tinh thần cốt lõi của ứng dụng là "đọc hiểu sâu câu chữ trong toán lời văn" (Toán lời văn đòi hỏi tư duy phân tích kỹ đề bài chứ không chỉ tính nhẩm nhanh).

### Option C: "Bài Học Khám Phá Thích Ứng" (Adaptive Guided Tutorial)
* **Approach:** Giữ nguyên format hướng dẫn giải bài toán 8 bước hiện tại nhưng cho phép bé tự giải thay vì ép click nút đúng. Nếu bé giải đúng liên tục mà không cần gợi ý, hệ thống tự động nhảy bước hoặc nâng độ khó. Nếu bé giải sai, linh vật sẽ vào hướng dẫn chi tiết từng bước.
* **Philosophy:** Teach-first, Adaptive.
* **Effort:** High (~6-8 giờ do phải viết lại bộ máy quản lý trạng thái phức tạp cho tutorial).
* **Risk level:** Medium.
* **Pros:** Vừa hướng dẫn được cách dùng app vừa đánh giá được năng lực của trẻ.
* **Cons:** Vẫn kéo dài thời gian onboarding, bé phải trải qua đủ các bước giải thích lý do, chọn mô hình... có thể gây sốt ruột.

---

## 4. Multi-Dimensional Scoring Matrix

| Tiêu chí | Trọng số | Option A (Thử Thách Thám Tử) | Option B (Đấu Trường) | Option C (Bài Học Thích Ứng) |
| :--- | :--- | :--- | :--- | :--- |
| **Tech** *(Khả thi, dễ bảo trì)* | 25% | **9/10** (Tách biệt luồng, dễ viết code) | **8/10** (Cần làm thêm bộ đếm giờ, loop câu hỏi) | **5/10** (State phức tạp, dễ sinh bug) |
| **Product** *(Giá trị giáo dục & Cá nhân hóa)* | 30% | **9/10** (Đánh giá toàn diện các kỹ năng lời văn) | **6/10** (Thiên về tính nhanh hơn đọc hiểu) | **8/10** (Kết hợp dạy và học tốt) |
| **Design** *(UX/UI phù hợp tâm lý trẻ em)* | 20% | **9/10** (Nhẹ nhàng, sinh động, mascot gần gũi) | **8/10** (Kịch tính nhưng dễ gây căng thẳng) | **7/10** (Hơi nhiều chữ và bước bấm) |
| **Business** *(ROI, Giữ chân người dùng)* | 25% | **9/10** (Tạo ấn tượng cá nhân hóa chuyên nghiệp) | **7/10** (Có thể làm drop-off ở trẻ sợ toán) | **8/10** (Bảo đảm trẻ hiểu rõ cách dùng app) |
| **Weighted Total** | **100%** | **9.0 / 10** | **7.1 / 10** | **7.1 / 10** |

---

## 5. 🎯 Recommendation

**Chọn Option A: "Thử Thách Thám Tử Nhí" (Diagnostic Test & Personalized Plan)**

### Kế hoạch thiết kế chi tiết ngân hàng câu hỏi test đầu vào:
* **Câu 1 (Dễ - Phép cộng):**
  * *Đề bài:* Nhà An nuôi 5 chú gà con. Hôm nay mẹ mua thêm 4 chú gà con nữa. Hỏi nhà An có tất cả bao nhiêu chú gà con?
  * *Đáp án:* 9 chú gà con.
* **Câu 2 (Dễ - Phép nhân/gấp số lần):**
  * *Đề bài:* Bạn Nam có 6 viên bi. Số bi của bạn Minh gấp đôi số bi của Nam. Hỏi Minh có bao nhiêu viên bi?
  * *Đáp án:* 12 viên bi.
* **Câu 3 (Trung bình - Phép chia/chia phần):**
  * *Đề bài:* Cô giáo chia đều 24 cái kẹo cho 3 tổ học sinh. Hỏi mỗi tổ nhận được bao nhiêu cái kẹo?
  * *Đáp án:* 8 cái kẹo.
* **Câu 4 (Khó 1 - Toán hai bước tính):** ⭐ *Điểm nhấn kích thích tư duy*
  * *Đề bài:* Mẹ mua 30 cái khẩu trang. Buổi sáng cả nhà dùng hết 6 cái. Buổi chiều dùng gấp đôi buổi sáng. Hỏi mẹ còn lại bao nhiêu cái khẩu trang?
  * *Hướng dẫn giải ẩn:* Dùng sáng = 6. Dùng chiều = 6 x 2 = 12. Tổng dùng = 18. Còn lại = 30 - 18 = 12 cái.
  * *Đáp án:* 12 cái.
* **Câu 5 (Trung bình - So sánh ít hơn):**
  * *Đề bài:* Bạn Vy gấp được 18 ngôi sao giấy. Bạn Hà gấp được ít hơn bạn Vy 5 ngôi sao. Hỏi cả hai bạn gấp được bao nhiêu ngôi sao giấy?
  * *Đáp án:* 31 ngôi sao (Vy 18 + Hà 13).
* **Câu 6 (Trung bình - Phân số cơ bản):**
  * *Đề bài:* Một chiếc bánh pizza được cắt thành 8 miếng bằng nhau. Bé Na đã ăn 3 miếng. Hỏi trên đĩa còn lại bao nhiêu miếng bánh?
  * *Đáp án:* 5 miếng bánh.
* **Câu 7 (Trung bình - Đo lường thời gian):**
  * *Đề bài:* Trận bóng đá của lớp 4A bắt đầu lúc 15 giờ và kết thúc lúc 15 giờ 40 phút. Hỏi trận đấu kéo dài bao nhiêu phút?
  * *Đáp án:* 40 phút.
* **Câu 8 (Khó 2 - Tổng và hiệu):** ⭐ *Điểm nhấn kích thích tư duy*
  * *Đề bài:* Hai anh em gom được 20 vỏ lon để tái chế. Anh gom được nhiều hơn em 4 vỏ lon. Hỏi em gom được bao nhiêu vỏ lon?
  * *Hướng dẫn giải ẩn:* (20 - 4) ÷ 2 = 8 vỏ lon.
  * *Đáp án:* 8 vỏ lon.

### Luồng khích lệ động viên từ Mascot:
* Linh vật sẽ hiện bong bóng thoại bên trên kèm biểu cảm sinh động.
* Khi bé bấm trả lời:
  * **Nếu đúng:** *"Tuyệt cú mèo! Con tư duy nhạy bén thật đó!"* (Cú Ú) / *"Tính toán chuẩn xác 100%! Tiếp tục phát huy nào!"* (Rô Bốt).
  * **Nếu chưa đúng:** *"Không sao hết nè! Câu hỏi này có một chút thử thách lắt léo, chúng mình sẽ cùng rèn luyện kỹ năng này trong hành trình sắp tới nhé!"* (Rùa Con).
* Giọng nói Text-To-Speech sẽ tự động phát âm đọc đề bài và đọc lời thoại động viên để trẻ thấy sinh động và cuốn hút.

### Màn hình Kết Quả & Kế hoạch học cá nhân hóa:
* **Học lực đánh giá:**
  * **Khởi động vững chắc** (Đúng 0 - 3 câu): Bé nắm được các phép tính cơ bản. Cần rèn thêm kỹ năng đọc hiểu phân tích đề toán lời văn nhiều bước.
    * *Đề xuất:* Bắt đầu từ **Bài 1: An, Bình và Cường hái cam** (Trung bình cộng trực quan) hoặc ôn tập các bài toán 1 bước đầu hành trình.
  * **Bứt phá tư duy** (Đúng 4 - 6 câu): Bé có khả năng suy luận tốt, biết giải các bài toán so sánh và chia phần.
    * *Đề xuất:* Bắt đầu từ **Bài 11: Mua vở chuẩn bị đi học** (Phép tính ngược) hoặc các bài toán so sánh phức tạp hơn.
  * **Thử thách siêu cấp** (Đúng 7 - 8 câu): Bé có tư duy xuất sắc, giải được bài toán 2 bước và dạng toán Tổng-Hiệu/Trung bình cộng nâng cao.
    * *Đề xuất:* Đề xuất bé thử sức trực tiếp ở **Bài 27: Chu vi khu vườn hình chữ nhật** và bật **Chế độ Thử thách (Challenge Mode)** để tăng thêm kịch tính!
* Giao diện hiển thị như một bức thư mời nhận nhiệm vụ thám tử nhí siêu xịn sò.

---

## 6. Proposed Changes

### [Component: Onboarding & Home UI]

#### [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
* Thay thế toàn bộ code của `OnboardingView` và `OnboardingLesson` hiện tại bằng logic của `OnboardingTest`.
* Khai báo hằng số `ONBOARDING_TEST_QUESTIONS` chứa 8 câu hỏi với các trường: đề bài, các phương án lựa chọn (A, B, C, D hoặc điền số), đáp án đúng, cấp độ khó, kỹ năng tương ứng.
* Thêm logic tính toán kết quả kiểm tra đầu vào, phân loại level và lưu vào `progress.profile.academicLevel` và `progress.profile.startingRecommendation` trong localStorage.
* Cập nhật màn hình chúc mừng hoàn thành onboarding để vẽ giao diện Báo cáo học lực cá nhân hóa đẹp mắt, ấn tượng.

#### [MODIFY] [utils.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/utils.js)
* Cập nhật `getLearningPlan` để nếu bé mới hoàn thành bài test onboarding, hệ thống sẽ ưu tiên gợi ý bài học đầu tiên khớp với đề xuất học lực của bé (`progress.profile.startingRecommendation`) thay vì luôn bắt đầu từ bài 1.

#### [MODIFY] [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
* Thêm các style CSS hiện đại cho bài test đầu vào: hiệu ứng thẻ câu hỏi chuyển động mượt mà (slide-in), thanh tiến trình test sặc sỡ, giao diện Hồ Sơ Năng Lực (certificate card, biểu đồ cột kỹ năng đơn giản bằng CSS thuần cực đẹp).

---

## 7. Verification Plan

### Automated Tests
* Chạy `node scripts/test-gate.js` để kiểm tra cú pháp, lỗi lint và tính toàn vẹn của logic.
* Thêm unit test mới trong `src/utils.test.js` để kiểm thử logic phân loại học lực đầu vào từ số điểm kiểm tra (ví dụ: test case 3 câu đúng -> Starter, 5 câu đúng -> Intermediate, 8 câu đúng -> Advanced và kiểm tra gợi ý bắt đầu tương ứng).

### Manual Verification
* Chạy dự án ở local (`npm run dev`) và dùng trình duyệt để trải nghiệm luồng onboarding mới từ đầu.
* Thử chọn các đáp án khác nhau để kiểm tra:
  * Trẻ làm đúng hết 8 câu nhận được level "Thử thách siêu cấp" và gợi ý Bài 27.
  * Trẻ làm sai nhiều nhận được level "Khởi động vững chắc" và gợi ý Bài 1.
  * Giọng đọc mascot phát ra chính xác qua loa khi chuyển câu hỏi và khi hiện pop-up động viên.
  * Giao diện hiển thị responsive chuẩn đẹp trên cả thiết bị giả lập di động và desktop.
