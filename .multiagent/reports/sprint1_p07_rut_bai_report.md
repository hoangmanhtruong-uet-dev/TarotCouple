# BÁO CÁO MULTI-AGENT TEAM: TINH CHỈNH HOÀN THIỆN P07 RÚT BÀI 🔮

**Ngày thực hiện**: 12/10/2026  
**Mục tiêu**: Nâng cấp màn hình P07 Rút bài theo chuẩn Masterplan `TarotCouple_Plan_GoLive.pdf` (Mục 4.3 P07).

---

## 1. Các Hạng Mục Kỹ Thuật Đã Triển Khai

### 1.1. Hoạt Ảnh Xáo Bài Riffle 3D (1.2 Giây & Web Audio API)
- **Tương tác trực quan 3D**: Hai nửa cọc bài (Left Deck & Right Deck) nghiêng đa chiều (`rotateZ`, `perspective: 1000px`), uốn cong và bắn các lớp lá bài so le đan cài vào nhau (Riffle shuffle).
- **Âm thanh Web Audio Native**: Bổ sung hàm `soundManager.playRiffleShuffle()` trong `src/lib/sound-effects.ts`, tổng hợp 20 xung âm thanh flutter tự nhiên trong 1.15s mà không phụ thuộc file mp3 ngoài.
- **Rung Haptic Ngắt Quãng**: Kích hoạt `navigator.vibrate([35, 45, 35, 45, 35, 60, 100])` mô phỏng độ nảy của mép bài.
- **Tiến trình & Dẫn dắt**: Tiến trình đếm từ 0% đến 100% trong 1.2s; nút bỏ qua nghi thức cho người dùng muốn vào thẳng rút bài.

### 1.2. Vuốt Xòe Quạt TactileArcFan & Khóa Design Tokens
- Đồng bộ bảng màu chuẩn: Vàng kim `--gold #C9A24A`, nền `--surface #14111C`, bề mặt `--surface-2 #1D1829`.
- Thêm rung haptic 25ms khi chạm chọn từng lá bài.

### 1.3. Chuỗi Lật Bài 3D Xen Kẽ 350ms (Flip Reveal Sequence)
- Khi người dùng chọn đủ 3 lá:
  - **Lá 1**: Bắt đầu lật lúc `0ms` (Duration `700ms`, `rotateY: 180deg`) kèm âm thanh `playCardFlip()` và rung nhẹ.
  - **Lá 2**: Bắt đầu lật lúc `350ms` (Duration `700ms`, `rotateY: 180deg`) kèm âm thanh `playCardFlip()` và rung nhẹ.
  - **Lá 3**: Bắt đầu lật lúc `700ms` (Duration `700ms`, `rotateY: 180deg`) kèm hợp âm ngân `playMysticChime()` và bừng sáng ánh hào quang vàng kim `box-shadow: 0 0 25px rgba(201, 162, 74, 0.6)`.
- Tự động chuyển mượt sang giai đoạn giải mã sau khi cả 3 lá lật mở hoàn tất (`1350ms`).
- Hỗ trợ `useReducedMotion()`: Không giật lắc, đổi sang hiệu ứng fade nhẹ cho người dùng nhạy cảm chuyển động.

### 1.4. Trạng Thái Chờ AI Đổi Câu Thoại 2s Theo Persona Reader
- Thay thế spinner hamster tĩnh bằng **Mystic Reader Presence**:
  - Vòng hào quang breathing pulse theo màu nhận diện của Reader (`accent_color`).
  - Bộ 4 câu thoại triết lý / tâm sự độc bản luân chuyển mượt mà mỗi 2.2 giây bằng `AnimatePresence`.
  - Phân tầng câu thoại theo 4 Canonical Readers:
    * `ba_ngoai`: *"Bà đang đeo kính ngắm các lá bài nha con..."*
    * `chi_dai`: *"Chị đang nhìn thẳng vào năng lượng của em đây..."*
    * `ban_than`: *"Ê coi bộ trải bài này có biến nha bà..."*
    * `thay_cu_meo`: *"Thầy đang quan sát biểu tượng ẩn sau từng lá bài..."*

---

## 2. Kết Quả Kiểm Thử (Quality Assurance)

1. **Vitest Unit Test Suite**:
   - Thêm `tests/rut_bai_ritual.test.ts` kiểm thử `playRiffleShuffle`, khoảng cách nhịp 350ms và thuộc tính Reader.
   - **12/12 test files passed, 63/63 tests passed (100% green)**.
2. **Next.js 15 App Router Production Build**:
   - `npm run build` hoàn thành với **Exit code 0**.
   - Toàn bộ **38 routes** biên dịch thành công.
