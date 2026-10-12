# BÁO CÁO MULTI-AGENT TEAM: RÀ SOÁT HOÀN THIỆN P08 KẾT QUẢ, P09 LÁ THỨ 4 & HỎI SÂU 🔮

**Ngày thực hiện**: 12/10/2026  
**Mục tiêu**: Rà soát và hoàn thiện màn hình P08 Kết quả, P09 Lá thứ 4 (5 Sao), và tính năng Hỏi sâu với Reader (2 lượt miễn phí trọn đời tài khoản, sau đó 2 Sao/câu) theo chuẩn Masterplan `TarotCouple_Plan_GoLive.pdf`.

---

## 1. Các Quyết Định Đã Thống Nhất Qua /grill-me

1. **Biểu phí Hỏi sâu (Followup Chat)**:
   - 2 câu đầu tiên miễn phí **trọn đời tài khoản**.
   - Từ câu thứ 3 trở đi: **2 Sao / câu** (đã cập nhật từ mức 5 Sao cũ xuống 2 Sao theo đúng PDF mục 4.4).
2. **Trải nghiệm P09 Lá thứ 4 (Clarifier)**:
   - Tự động dùng câu gợi ý của Reader (cliffhanger tease text từ AI) để rút và lật lá bài thứ 4 ngay lập tức khi bấm *"Mở Lá Thứ 4 · 5 Sao"*.
   - Cho phép người dùng chỉnh sửa câu hỏi nếu muốn đào sâu theo ý riêng.
   - Chi phí: **5 Sao**.
3. **Cơ chế khi thiếu Sao**:
   - Tích hợp component tái sử dụng `src/components/OutOfStarsSheet.tsx`.
   - Cung cấp giải pháp nhận Sao ngay tại chỗ: Điểm danh hôm nay (+2 Sao miễn phí) hoặc Nạp PayOS VietQR (từ 10.000đ được 10 Sao).

---

## 2. Các Hạng Mục Kỹ Thuật Đã Triển Khai

### 2.1. Chuẩn Hóa Design Tokens P08 Kết Quả
- Đã loại bỏ 100% mã màu cũ `#D9B36A`, thay thế triệt để bằng `--gold #C9A24A`, viền `--surface-2 #1D1829`, và gradient vàng kim `#C9A24A` -> `#A68032`.
- Cả hai nút *"Mở Lá Thứ 4 · 5 Sao"* (trong thẻ và ở thanh fixed bottom) đều có viền vàng kim sắc nét và hiệu ứng nhịp thở glow 2.2s.

### 2.2. Nâng Cấp Followup Chat Modal (`FollowupChatModal.tsx`)
- Hiển thị badge trực quan: *"2 câu đầu miễn phí ✨"*, *"Sau đó: 2 Sao / câu"*.
- Nút gửi đổi nhãn động: *"Gửi · Miễn phí"* hoặc *"Gửi · 2 Sao"*.
- Tích hợp `OutOfStarsSheet` khi hết Sao, cho phép nhận điểm danh +2 Sao trực tiếp mà không cần thoát modal.

### 2.3. Rút Lá Thứ 4 Tức Thì & Kiểm Tra Sao Client-Side
- Trong `KetQuaPage`, khi người dùng bấm *"Mở Lá Thứ 4 · 5 Sao"*:
  - Nếu số dư `< 5 Sao`: Bật ngay `OutOfStarsSheet` giải thích rõ ràng và gợi ý nạp/điểm danh.
  - Nếu số dư `≥ 5 Sao`: Tự động gọi API `/api/clarifier`, trừ 5 Sao, chuyển sang màn làm rõ và lật mở lá bài thứ 4 kèm hiệu ứng bừng sáng `box-shadow` và âm thanh `playMysticChime()`.

---

## 3. Bằng Chứng Kiểm Thử (Verification Evidence)

1. **Vitest Unit Test Suite**:
   - Thêm `tests/ket_qua_clarifier_followup.test.ts`.
   - **13/13 test files passed, 66/66 tests passed (100% green)**.
2. **Next.js 15 App Router Production Build**:
   - `npm run build` hoàn thành với **Exit code 0**.
   - Toàn bộ **38 routes** biên dịch thành công 100%.
