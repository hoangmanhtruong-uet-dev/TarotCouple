# Node D78: Mở Rộng Dataset Luận Giải Cho Trọn Bộ 78 Lá Bài Tarot (0đ API Cost)

## 1. Yêu cầu & Mục tiêu
- **User Request**: "Vậy bộ 78 lá thì sao, lên dataset cho bộ 78 lá đi /team".
- **Mục tiêu**: Xây dựng toàn bộ dataset chuyên sâu giải mã chi tiết, chính xác 100% theo từng chủ đề cho toàn bộ 56 lá Ẩn Phụ (Minor Arcana IDs 22..77) kết hợp với 22 lá Ẩn Chính đã có (tổng cộng đủ 78 lá: 0..77).
- **Nguyên tắc cốt lõi**:
  - Không gọi API tốn tiền (Zero LLM cost).
  - Tách bạch 3 chủ đề: `love` (Tình cảm/Crush), `career` (Công việc/Học tập), `finance` (Tài chính/Vận may).
  - Đầy đủ 2 chiều: `upright` (Xuôi) & `reversed` (Ngược) với `meaning`, `advice`, `keyword`.
  - Phản hồi siêu tốc (<10ms).

## 2. Phân công vai trò Multi-Agent (/team)
- **Leader / Planner**: Định nghĩa cấu trúc file, sơ đồ ID (22..77), ánh xạ các bộ Gậy (Wands), Cốc (Cups), Kiếm (Swords), Tiền (Pentacles).
- **Data Specialist (Coder)**:
  - Tạo `src/data/minor-arcana-topic-dataset.ts` chứa dataset chi tiết 56 lá Ẩn Phụ.
  - Tích hợp vào `src/data/topic-interpretations.ts` để `getCardTopicInterpretation(cardId, reversed, topic)` hỗ trợ trọn vẹn IDs 0..77.
- **Tester**: Chạy vitest test suite kiểm tra coverage 78 lá x 3 chủ đề x 2 chiều.
- **Integrator**: Build Next.js & commit git.
