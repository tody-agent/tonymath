# Design: Companion Personalization & Expansion

## Context & Technical Approach
We want to offer kids highly recognizable, personalized companions (Baby Shark, Robocar Poli, Minecraft Steve, Princess Elsa, Pinkfong, Peppa Pig) to accompany them on their learning journey.

The goal is to ensure a cohesive experience:
1. **Dialogue**: Characters have unique vocabulary, phrases, catchphrases.
2. **Audio/TTS**: Specific pitch/speed values.
3. **Indicators**: Custom guides in the handbook for each character.
4. **Theme UI**: The interface dynamically colors itself based on the companion's theme.

## Proposed Changes
- **src/mascotDialogs.js**: Defines profile configs and guides.
- **src/App.jsx**: Reads configs and displays UI.
- **src/App.css**: Contains specific theme styles.
- **src/utils.test.js**: Tests for mascot helpers.

## Mascot Specifications

| Key | Name | Emoji | Pitch | Rate | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `owl` | Cú Ú | 🦉 | 1.0 | 0.95 | Thông thái, lý luận (Thích hỏi "Tại sao?") |
| `robot` | Rô Bốt | 🤖 | 1.25 | 1.05 | Logic, chính xác (Vẽ sơ đồ siêu chuẩn) |
| `turtle` | Rùa Con | 🐢 | 0.85 | 0.88 | Kiên trì, chậm rãi (Cẩn thận, bền bỉ) |
| `babyshark` | Baby Shark | 🦈 | 1.4 | 1.1 | Năng động, vui nhộn (Doo doo doo! Quẩy cùng toán học) |
| `poli` | Poli Cảnh Sát | 🚓 | 1.1 | 1.0 | Dũng cảm, nguyên tắc (Đội tuần tra toán học) |
| `steve` | Steve Minecraft | ⛏️ | 0.8 | 0.9 | Sáng tạo, xây dựng (Đào kim cương trí tuệ) |
| `elsa` | Công chúa Elsa | ❄️ | 1.2 | 0.95 | Dịu dàng, phép thuật (Lấp lánh phép màu phép toán) |
| `pinkfong` | Pinkfong | 🦊 | 1.35 | 1.05 | Đáng yêu, kể chuyện (Ngôi sao may mắn lấp lánh) |
| `peppa` | Heo Peppa | 🐷 | 1.15 | 1.0 | Tinh nghịch, ngọt ngào (Nhảy vũng bùn bong bóng vui nhộn) |

## Verification
- Running `npm run test:gate` ensures syntax is correct and unit tests pass.
