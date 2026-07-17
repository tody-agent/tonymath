# TonyMath – Học cách học

Web app mobile-first giúp học sinh lớp 3–4 học cách đọc hiểu và giải toán lời văn từng bước.

## Chạy local

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm run preview
```

## Cấu trúc nội dung

- `src/lessons.json`: toàn bộ dữ liệu bài học, đáp án, lý do và gợi ý.
- `src/App.jsx`: luồng học 8 bước, mở khóa bài, điểm và localStorage.
- `src/App.css`: giao diện responsive cho desktop và mobile.

Tiến độ được lưu tại localStorage với key `tonymath-progress-v1`.

## Nội dung hiện có

Ứng dụng gồm **32 bài học** mở khóa tuần tự:

- Bài 1–10: đọc hiểu đề, tổng–phần, so sánh, nhân, chia và bài toán hai bước.
- Bài 11–18: phép tính ngược, tìm số lớn/nhỏ, gấp nhiều lần, giá tiền và hai ý nghĩa của phép chia.
- Bài 19–26: chia có dư theo thực tế, bài toán hai bước, thời gian, tiền và đổi đơn vị.
- Bài 27–32: chu vi, diện tích, phân số, dữ kiện thừa và thử thách tổng hợp.

### Nguyên tắc viết bài (dành cho trẻ)

Mỗi bài được viết theo hướng **dễ hình dung – dễ nhớ**:

1. **Câu chuyện cụ thể** — có nhân vật, đồ vật, cảm xúc; tránh ngôn ngữ giáo khoa khô.
2. **Tiêu đề gợi tò mò** — trẻ muốn mở bài vì “có chuyện xảy ra”.
3. **Hình theo loại bài** (`visual.type`: add, remove, compare, groups, divide, …).
4. **Mẹo nhớ trong gợi ý** — ví dụ *“Thêm vào = cộng = to hơn”*, *“Gấp N lần = × N”*.
5. **Lý do bằng lời trẻ** — giải thích “vì sao” gắn với câu chuyện, không chỉ thuật ngữ.
