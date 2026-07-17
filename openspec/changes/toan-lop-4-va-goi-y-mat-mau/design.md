# Design: Nâng cao Toán lớp 4 & Cơ chế Gợi ý mất máu

## Context & Technical Approach
Hệ thống học toán hiện tại sử dụng một cấu trúc bài học 8 bước cố định, nơi dữ liệu được lấy từ `src/lessons.json` và giao diện cùng logic điều hướng được tích hợp tại `src/App.jsx`. Để tăng độ thử thách và bổ sung các dạng toán lớp 4 điển hình, chúng ta sẽ thực hiện hai nâng cấp lớn:
1. **Dữ liệu**: Bổ sung 8 bài tập toán nâng cao lớp 4 vào `src/lessons.json`, từ Bài 33 đến Bài 40, sử dụng thuộc tính `difficulty: "hard"`.
2. **Logic & UI**:
   - Thêm nút bật tắt **Chế độ Thử thách** (`progress.challengeMode`) trong Profile Menu để người dùng có thể kích hoạt tùy ý đối với các bài học lớp 3. Các bài nâng cao lớp 4 (`difficulty: "hard"`) sẽ luôn bắt buộc chạy dưới chế độ Thử thách.
   - Khi chế độ Thử thách hoạt động:
     - Bấm xem gợi ý 💡 lần đầu ở mỗi bước sẽ tốn 1 ❤️ (giảm `hearts`, tăng `mistakes`).
     - Có hiển thị hộp thoại xác nhận trực quan thân thiện trước khi trừ ❤️ của trẻ.
     - Khi `hearts` giảm về 0 (do trả lời sai hoặc dùng gợi ý), hiển thị màn hình phủ toàn bộ **Game Over** động viên trẻ làm lại bài học từ đầu.

---

## Proposed Changes

### Component: Data & Lessons
#### [MODIFY] [lessons.json](file:///Volumes/Data/Kids/hoc-toan-vui/src/lessons.json)
Thêm 8 bài học mới (Bài 33 - 40) vào cuối danh sách bài học:
- **Bài 33**: Tổng và Hiệu. Dữ liệu: 85 kg giấy vụn, Tổ Một hơn Tổ Hai 15 kg. Tìm Tổ Hai.
- **Bài 34**: Trung bình cộng. Dữ liệu: Quy quyên góp sách Hùng 12, Dũng 15, Sang 18. Tìm trung bình.
- **Bài 35**: Rút về đơn vị. Dữ liệu: 4 hộp màu hết 48k. Tìm giá 7 hộp màu.
- **Bài 36**: Tổng và Tỉ số. Dữ liệu: 120 con gà và vịt, gà = 1/3 vịt. Tìm gà.
- **Bài 37**: Hiệu và Tỉ số. Dữ liệu: Mẹ hơn con 28 tuổi, con = 1/5 mẹ. Tìm tuổi con.
- **Bài 38**: Hình học (Tổng-Hiệu + Diện tích). Dữ liệu: Chu vi 60m, chiều dài hơn rộng 6m. Tìm diện tích.
- **Bài 39**: Phân số (Tìm phân số của một số). Dữ liệu: Rổ trứng 45 quả, bán 2/5. Tìm số trứng bán.
- **Bài 40**: Thử thách công việc chung + Rút về đơn vị. Dữ liệu: Tổ Một làm 24 sp/3h, Tổ Hai làm 30 sp/3h. Tìm số sp cả 2 làm trong 5h.

Mỗi bài học này có cấu trúc 8 bước hoàn chỉnh và thuộc tính `"difficulty": "hard"`.

---

### Component: Frontend & Logic
#### [MODIFY] [App.jsx](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.jsx)
- Cập nhật `DEFAULT_PROGRESS` để khai báo mặc định `challengeMode: false`.
- Khai báo state `hintUnlockedForCurrentStep` (mặc định `false`), reset về `false` trong `resetStepState`.
- Khai báo state `showHintConfirm` (mặc định `false`) để điều khiển Dialog xác nhận.
- Khai báo state `isGameOver` (mặc định `false`) để điều khiển hiển thị màn hình Game Over.
- Cập nhật sự kiện click vào nút gợi ý `💡` trong `LessonView`:
  ```javascript
  const isChallenge = progress.challengeMode || lesson.difficulty === 'hard';
  if (isChallenge) {
    if (hintUnlockedForCurrentStep) {
      setHintOpen(open => !open);
    } else {
      if (hearts === 0) {
        alert("Con đã hết ❤️, hãy tự giải hoặc bắt đầu lại bài học nhé!");
      } else {
        setShowHintConfirm(true);
      }
    }
  } else {
    setHintOpen(open => !open);
  }
  ```
- Thêm hàm xử lý xác nhận mua gợi ý `confirmHint()`:
  - Khấu trừ 1 ❤️: `setHearts(h => Math.max(0, h - 1))`
  - Tăng `mistakes` lên 1 để điều chỉnh điểm sao: `setMistakes(m => m + 1)`
  - Đặt `hintUnlockedForCurrentStep = true`
  - Đặt `hintOpen = true`
  - Đóng dialog xác nhận `setShowHintConfirm(false)`.
- Sử dụng `useEffect` lắng nghe `hearts`. Nếu `isChallenge` đang bật, và `hearts === 0` khi `view === 'lesson'`, đặt `setIsGameOver(true)`.
- Định nghĩa component phụ `HintConfirmModal` hiển thị hộp thoại xác nhận khi `showHintConfirm` là true.
- Định nghĩa component phụ `GameOverScreen` phủ toàn màn hình khi `isGameOver` là true. Cung cấp nút "Thử lại bài học này" thực hiện reset:
  - Reset `hearts = 3`
  - Reset `mistakes = 0`
  - Reset `step = 0`
  - Đặt `isGameOver = false`
  - Đặt `hintUnlockedForCurrentStep = false`
  - Đặt `hintOpen = false`
  - Kích hoạt lại bước 0 của bài học.
- Cập nhật Profile Menu: thêm checkbox chuyển đổi trạng thái `challengeMode` của `progress`.

#### [MODIFY] [App.css](file:///Volumes/Data/Kids/hoc-toan-vui/src/App.css)
- Thêm styles cho hộp thoại xác nhận gợi ý: `.confirm-modal-overlay`, `.confirm-modal`, các nút "Đồng ý", "Hủy".
- Thêm styles cho màn hình Game Over: `.gameover-overlay`, `.gameover-content`, biểu tượng 💔 lớn, animation đập của tim khi gần hết máu, thiết kế động viên sinh động.
- Thêm styles cho huy hiệu `.challenge-badge` dạng tag nổi bật màu cam/đỏ trên toolbar bài học.

---

### Component: Logic & Utilities
#### [MODIFY] [utils.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/utils.js)
- Kiểm tra tính tương thích của `progress` trong các helper và đảm bảo `challengeMode` được truyền nhận tự nhiên.

#### [MODIFY] [utils.test.js](file:///Volumes/Data/Kids/hoc-toan-vui/src/utils.test.js)
- Thêm unit test kiểm tra thuộc tính `challengeMode` trong đối tượng `progress`.

---

## Verification
- Chạy toàn bộ test gate: `node scripts/test-gate.js`.
- Kiểm thử thủ công từng bước hoạt động của modal xác nhận, trừ ❤️ khi dùng hint, màn hình GameOver khi hết ❤️, và tự động bật thử thách khi mở bài học lớp 4.
