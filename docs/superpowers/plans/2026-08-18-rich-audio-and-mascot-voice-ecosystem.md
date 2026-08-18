# Hệ Thống Giọng Đọc & Âm Thanh Linh Vật Đa Dạng (Rich Audio & Mascot Voice Ecosystem) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ sinh thái âm thanh và giọng đọc tiếng Việt phong phú cho TonyMath bằng OmniVoice, bao gồm 40+ câu thoại đa dạng theo từng linh vật (khen ngợi sâu sắc, động viên kiên trì, phê bình tế nhị hài hước khi bấm ẩu, chúc mừng streak), chống lặp lại và phát tức thì 0ms hoàn toàn miễn phí không cần server.

**Architecture:** Kiến trúc 3 tầng mở rộng: (1) Kho Audio Bank tĩnh nén chất lượng cao 24kHz sinh bằng OmniVoice cho mọi tình huống tương tác game, (2) Module `src/audioEngine.js` điều phối ngẫu nhiên chống lặp (anti-repetition history) và chuẩn hóa ngữ âm toán học thông minh, (3) Tích hợp sâu vào `src/App.jsx` nhận diện hành vi (bấm nhanh cẩu thả, suy nghĩ kỹ, chuỗi streak, hoàn thành bài).

**Tech Stack:** OmniVoice (Apple Silicon MPS / PyTorch), Web Audio API, HTML5 Audio, React 19, JavaScript ES Modules, Vite.

**Spec:** [openspec/changes/vietnamese-tts-upgrade/proposal.md](file:///Volumes/Data/Kids/hoc-toan-vui/openspec/changes/vietnamese-tts-upgrade/proposal.md)

## Global Constraints
- Zero-Server & 100% Free: Toàn bộ kho âm thanh được phục vụ tĩnh qua `public/audio/mascot/`, chạy offline 100% không tốn chi phí backend.
- Phản hồi tức thì < 50ms: Audio sinh sẵn phát ngay qua Web Audio / HTML5 Audio.
- Tính giáo dục và tâm lý học trẻ em: Khen ngợi tạo động lực phát triển (Growth Mindset), phê bình tế nhị mang tính hài hước nhẹ nhàng, không gây ức chế hay sợ sai.
- Chống lặp lại: Không bao giờ phát 1 câu thoại 2 lần liên tiếp trong cùng 1 phiên học.

---

### Task 1: Thiết Kế Danh Mục & Sinh Kho Âm Thanh Đa Dạng Bằng OmniVoice

**Files:**
- Create: `scripts/tonymath_full_audio_manifest.json`
- Output: `public/audio/mascot/*.wav` và `public/audio/mascot/manifest.json`

**Interfaces:**
- Consumes: `/Volumes/Data/AI/omnivoice/batch_generate.py`
- Produces: 36 file âm thanh `.wav` chuẩn 24kHz trong `public/audio/mascot/` phân loại theo:
  - 4 Mascots (`robot`, `turtle`, `owl`, `shark`)
  - 6 Danh mục tương tác (`welcome`, `correct_quick`, `correct_logic`, `correct_streak`, `wrong_careless`, `wrong_encourage`, `complete`)

- [ ] **Step 1: Viết file danh mục câu thoại `scripts/tonymath_full_audio_manifest.json`**

Tạo danh sách 36 câu thoại phong phú, giàu tính biểu cảm, hài hước và ấm áp cho từng linh vật:
```json
[
  { "id": "robot_welcome_1", "text": "Ting ting! Năng lượng 100%! Rô bốt đã sẵn sàng học toán cùng bạn nhỏ!", "instruct": "male, young adult", "speed": 1.05 },
  { "id": "robot_welcome_2", "text": "Khởi động hệ thống tư duy! Hôm nay chúng mình sẽ phá đảo bài toán mới nhé!", "instruct": "male, young adult", "speed": 1.05 },
  { "id": "robot_correct_quick", "text": "Tốc độ xử lý chớp nhoáng! Chuẩn boong!", "instruct": "male, young adult, high pitch", "speed": 1.1 },
  { "id": "robot_correct_logic", "text": "Thuật toán tư duy của con chạy quá mượt mà! Xuất sắc!", "instruct": "male, young adult", "speed": 1.05 },
  { "id": "robot_correct_streak", "text": "Cảnh báo quá tải vì quá giỏi! Chuỗi đúng liên tiếp không ngừng nghỉ!", "instruct": "male, young adult, high pitch", "speed": 1.1 },
  { "id": "robot_wrong_careless", "text": "Ối ối! Tốc độ bấm nhanh hơn tốc độ CPU xử lý rồi! Đọc lại đề bài một xíu nha con ơi!", "instruct": "male, young adult", "speed": 1.05 },
  { "id": "robot_wrong_encourage", "text": "Lỗi vi mạch nhỏ thôi! Nạp lại năng lượng và quét lại gợi ý nào!", "instruct": "male, young adult", "speed": 1.0 },
  
  { "id": "turtle_welcome_1", "text": "Chào con yêu! Chậm mà chắc, từng bước nhỏ sẽ đưa chúng mình đến đích!", "instruct": "female, young adult, moderate pitch", "speed": 0.92 },
  { "id": "turtle_correct_1", "text": "Tuyệt vời quá! Cứ bình tĩnh làm chuẩn như thế là Rùa vui lắm đó!", "instruct": "female, young adult, high pitch", "speed": 0.95 },
  { "id": "turtle_correct_logic", "text": "Từng bước suy luận thật chắc chắn! Con làm rất tốt!", "instruct": "female, young adult", "speed": 0.95 },
  { "id": "turtle_wrong_careless", "text": "Từ từ thôi con yêu ơi, bánh bao nóng không ăn vội được đâu! Đọc kỹ đề nhé!", "instruct": "female, young adult, moderate pitch", "speed": 0.92 },
  { "id": "turtle_wrong_encourage", "text": "Không sao cả con ơi, Rùa đi chậm nhưng chưa bao giờ bỏ cuộc. Mình thử lại nhé!", "instruct": "female, young adult, moderate pitch", "speed": 0.92 },
  
  { "id": "owl_welcome_1", "text": "Chào nhà thông thái nhỏ! Hôm nay chúng ta sẽ cùng giải mã những bí ẩn toán học thú vị!", "instruct": "female, young adult", "speed": 0.98 },
  { "id": "owl_correct_1", "text": "Lập luận vô cùng sắc bén! Một tư duy thông thái!", "instruct": "female, young adult", "speed": 1.0 },
  { "id": "owl_correct_streak", "text": "Trí tuệ sáng suốt như ngọn hải đăng! Chuỗi trả lời đúng siêu đẳng!", "instruct": "female, young adult, high pitch", "speed": 1.05 },
  { "id": "owl_wrong_careless", "text": "Thông thái không đi kèm với vội vã. Hãy quan sát thật kỹ các dữ kiện con nhé!", "instruct": "female, young adult", "speed": 0.98 },
  { "id": "owl_wrong_encourage", "text": "Người thông thái học hỏi từ mọi lỗi sai. Hãy đọc kỹ gợi ý rồi chọn lại nhé con!", "instruct": "female, young adult", "speed": 0.98 },
  
  { "id": "shark_welcome_1", "text": "Bơi vào biển toán học cùng Baby Shark nào! Quẫy đuôi học thôi!", "instruct": "female, high pitch", "speed": 1.1 },
  { "id": "shark_correct_1", "text": "Đỉnh chóp luôn bạn ơi! Quá siêu phàm!", "instruct": "female, high pitch", "speed": 1.15 },
  { "id": "shark_wrong_careless", "text": "Ủa ủa, bấm nhanh quá cá mập bơi theo không kịp nè! Xem lại đề xíu nha!", "instruct": "female, high pitch", "speed": 1.1 },
  { "id": "shark_wrong_encourage", "text": "Không sao hết trơn á! Hít một hơi thật sâu rồi quẫy tiếp nào!", "instruct": "female, high pitch", "speed": 1.05 },

  { "id": "gen_praise_1", "text": "Chính xác! Con giỏi quá!", "instruct": "female, young adult, high pitch", "speed": 1.05 },
  { "id": "gen_praise_2", "text": "Xuất sắc! Chuẩn không cần chỉnh!", "instruct": "female, young adult, high pitch", "speed": 1.05 },
  { "id": "gen_praise_3", "text": "Tuyệt đỉnh! Một bước tiến bộ vượt bậc!", "instruct": "female, young adult, high pitch", "speed": 1.05 },
  { "id": "gen_encourage_1", "text": "Chưa chính xác rồi, bình tĩnh đọc lại gợi ý nhé!", "instruct": "female, young adult, moderate pitch", "speed": 0.95 },
  { "id": "gen_encourage_2", "text": "Gần đúng rồi! Thử lại một lần nữa xem sao con nha!", "instruct": "female, young adult, moderate pitch", "speed": 0.95 },
  { "id": "lesson_done_fanfare", "text": "Chúc mừng bạn nhỏ đã hoàn thành xuất sắc bài học! Con nhận được huy hiệu vinh quang!", "instruct": "female, young adult, high pitch", "speed": 1.05 }
]
```

- [ ] **Step 2: Chạy batch sinh âm thanh bằng OmniVoice**
Run:
```bash
/Volumes/Data/AI/omnivoice/.venv/bin/python /Volumes/Data/AI/omnivoice/batch_generate.py \
  --input /Volumes/Data/Kids/hoc-toan-vui/scripts/tonymath_full_audio_manifest.json \
  --output-dir /Volumes/Data/Kids/hoc-toan-vui/public/audio/mascot
```

- [ ] **Step 3: Kiểm tra toàn bộ file `.wav` và `manifest.json` đã sinh thành công**
Run: `ls -lh /Volumes/Data/Kids/hoc-toan-vui/public/audio/mascot/`

---

### Task 2: Xây Dựng `src/audioEngine.js` (Smart Voice & Sound Manager)

**Files:**
- Create: `src/audioEngine.js`
- Modify: `src/audio.js`
- Test: `src/audioEngine.test.js`

**Interfaces:**
- Produces:
  - `playMascotReaction(mascotId, category, fallbackText, options)`
  - `playCustomAudio(audioId)`
  - `normalizeMathSpeech(text)`
  - `selectBestVietnameseVoice(voices)`

- [ ] **Step 1: Viết test cho `src/audioEngine.test.js`**
Kiểm tra logic phân loại, chống lặp lại (anti-repetition), và chuẩn hóa toán học.

- [ ] **Step 2: Viết module `src/audioEngine.js`**
Triển khai bộ nhớ đệm lịch sử phát để không lặp lại câu trước đó, phân loại tình huống thông minh (cẩu thả vs suy nghĩ kỹ vs streak).

- [ ] **Step 3: Cập nhật `src/audio.js` xuất các hàm tiện ích**

- [ ] **Step 4: Chạy test kiểm tra qua `npm run test:gate`**

---

### Task 3: Tích Hợp Vào `src/App.jsx` (Nhận Diện Hành Vi & Tương Tác Hài Hước)

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `playMascotReaction` từ `src/audioEngine.js`
- Tích hợp tại:
  - Nút Mascot Bubble / Lời khuyên (`handleSpeakMascot`)
  - Khi kiểm tra đáp án đúng (`validateStep` đúng ➔ kiểm tra thời gian trả lời & chuỗi streak)
  - Khi kiểm tra đáp án sai (`validateStep` sai ➔ nếu < 2.5 giây: kích hoạt phản hồi "Bấm nhanh ẩu/hài hước", nếu >= 2.5s: kích hoạt phản hồi "Động viên nhẹ nhàng")
  - Khi bấm nút Gợi ý / Cứu trợ (`handleShowHint`)
  - Khi hoàn thành toàn bộ bài học / nhận quà

- [ ] **Step 1: Thêm biến đo thời gian bắt đầu câu hỏi (`questionStartTimeRef`) trong `src/App.jsx`**
- [ ] **Step 2: Cập nhật xử lý phản hồi khi trả lời đúng / sai trong `validateStep`**
- [ ] **Step 3: Cập nhật lời chào và tương tác Mascot ở màn hình chính**

---

### Task 4: Kiểm Tra Toàn Diện & Verification

**Files:**
- Verify: `npm run lint`
- Verify: `npm run build`
- Verify: `npm run test:gate`

- [ ] **Step 1: Chạy linter `npm run lint`**
- [ ] **Step 2: Chạy production build `npm run build`**
- [ ] **Step 3: Chạy test gate `npm run test:gate`**
