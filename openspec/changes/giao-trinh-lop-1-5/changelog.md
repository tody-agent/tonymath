# Changelog: Hoàn Thiện Giáo Trình Game Toán Vui Lớp 1-5

## Thông tin chung
- **Ngày hoàn thành**: 2026-07-17
- **Phiên bản giáo trình**: 1.0.0
- **Số lượng bài học thêm mới**: 140 bài (Lớp 1: 20 bài, Lớp 2: 30 bài, Lớp 3: 40 bài, Lớp 5: 50 bài)
- **Số lượng bài học hiện có**: 60 bài (Lớp 4)
- **Tổng số bài học game hóa**: 200 bài từ lớp 1 đến lớp 5

## Các thay đổi chi tiết

### 1. Cấu hình Registry (`public/lessons/registry.json`)
- Thêm cấu hình đầy đủ cho các lớp: `grade-1`, `grade-2`, `grade-3`, `grade-5`.
- Loại bỏ cờ `"comingSoon": true` đối với môn Toán (`math`) của tất cả các lớp.
- Thêm đường dẫn `lessonsPath` cho các file JSON chứa dữ liệu bài học động của từng lớp.

### 2. Dữ liệu bài học (`public/lessons/`)
- **Lớp 1 (`grade-1/math.json`)**: 
  - Tạo 20 bài học tương thích phạm vi cộng trừ 100.
  - Sử dụng mô hình `visual.type = "icons"` (đếm emoji) trực quan hóa phù hợp cho học sinh lớp 1.
- **Lớp 2 (`grade-2/math.json`)**:
  - Tạo 30 bài học bao gồm: cộng có nhớ, trừ có nhớ phạm vi 100, nhân chia cơ bản bảng cửu chương, so sánh hơn kém, đo lường xăng-ti-mét, ki-lô-gam, lít, và xem giờ.
- **Lớp 3 (`grade-3/math.json`)**:
  - Tạo 40 bài học tập trung vào phép nhân/chia nhiều chữ số, gấp/giảm một số lần, so sánh tỉ số, bài toán giải bằng 2 bước, đo lường, chu vi và diện tích đơn giản.
- **Lớp 5 (`grade-5/math.json`)**:
  - Tạo 50 bài học nâng cao chuẩn bị tốt nghiệp tiểu học: phân số nâng cao, số thập phân, tỉ số phần trăm, diện tích hình phức tạp (hình tam giác, hình thang), thể tích hình hộp/lập phương, chuyển động cùng chiều/ngược chiều, công việc chung và tổng/hiệu/tỉ nâng cao, xác suất cơ bản và thống kê trung bình.

### 3. Công cụ kiểm thử tự động (`scripts/`)
- **`scripts/audit-lessons.js`**:
  - Hỗ trợ duyệt động qua tất cả các lớp trong `registry.json` thay vì chỉ quét cứng lớp 4.
  - Hỗ trợ tham số `--grade` để cô lập kiểm tra từng lớp.
  - Sửa lỗi làm tròn số thực (floating point precision) khi so sánh hiệu số lớn/nhỏ trong `visual.type === "compare"` bằng cách sử dụng sai số `Math.abs(...) > 1e-9`.
- **`scripts/test-gate.js`**:
  - Sửa đổi lệnh gọi oxlint và vite từ `npm run` sang các binary cục bộ `./node_modules/.bin/` để vượt qua hàng rào phân tách sandbox offline một cách trơn tru.

## Kết quả kiểm thử
- **Secret Hygiene**: Đạt 100% không phát hiện lộ mật khẩu/khóa bí mật.
- **Linter & Syntax**: Đạt 100% không cảnh báo cú pháp.
- **Logic Unit Tests**: Vượt qua toàn bộ 15 trường hợp kiểm định logic cốt lõi.
- **Data Integrity**: Toàn bộ 200 bài học vượt qua audit cấu trúc dữ liệu và độ chuẩn xác toán học.
- **Production Build**: Biên dịch thành công 100% qua Vite.
