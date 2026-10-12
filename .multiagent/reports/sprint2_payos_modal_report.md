# Báo Cáo Sprint 2: Modal Nạp Sao VietQR PayOS & Rào Chắn Tuổi <11t

## 1. Mục tiêu Sprint 2
- **UI Modal VietQR PayOS (P18)**: Tạo mã QR VietQR động qua PayOS API, cơ chế Polling tự động 2.5s (tối đa 10 phút đếm ngược), nút "Kiểm tra ngay", âm thanh chúc mừng `playMysticChime()` và rung haptic `[60, 60, 120]`.
- **Rào chắn độ tuổi <11t**: Theo quyết định người dùng xác nhận từ `/grill-me`, rào chắn thanh toán chỉ áp dụng cho người **dưới 11 tuổi** (`age < 11`, sinh năm 2016 trở về sau theo mốc 2026). Người từ 11 tuổi trở lên được phép tạo mã VietQR và nạp Sao bình thường.
- **Biểu phí**: Rút lá thứ 4 (Clarifier) = 5 Sao; Hỏi sâu (Followup) 2 câu đầu trọn đời miễn phí, câu thứ 3 trở đi = 2 Sao/câu.
- **Hệ màu chuẩn**: Sử dụng token `--gold: #C9A24A`, `--surface: #14111C`, `--surface-2: #1D1829`.

---

## 2. Các Thay Đổi Chi Tiết

### 2.1. Backend & Phân Tầng Tuổi (`src/lib/safety.ts`)
- Cập nhật hàm `classifyAgeTier`:
  ```ts
  const paymentEnabled = age >= 11;
  const dailySpendCapVnd = age >= 11 ? 50000 : 0;
  ```
- Trẻ em dưới 11 tuổi (`age < 11`) bị khóa tính năng nạp tiền (`paymentEnabled = false`), hạn mức chi tiêu = 0.
- Từ 11 tuổi trở lên (`age >= 11`): Cho phép nạp tiền (`paymentEnabled = true`), áp dụng hạn mức bảo vệ 50.000 VNĐ/ngày.

### 2.2. API Thanh toán (`src/app/api/payment/route.ts`)
- `GET /api/payment?orderCode=...`: Hỗ trợ kiểm tra trạng thái đơn hàng phục vụ client polling thời gian thực.
- `POST /api/payment`: Kiểm tra độ tuổi người dùng. Nếu `age < 11` hoặc `birthYear > 2015`, trả về `403 Forbidden` với mã lỗi `AGE_PAYMENT_BLOCKED` và thông báo bảo vệ trẻ em rõ ràng.

### 2.3. Modal Nạp Sao (`src/components/WalletPayOSModal.tsx`)
- Giao diện 3 bước:
  1. **Chọn gói Sao** (19k / 29k / 49k / 99k).
  2. **Tạo và hiển thị mã VietQR động** kèm thông tin chuyển khoản: Ngân hàng, Số tài khoản, Số tiền, Mã đơn.
  3. **Polling tự động 2.5s** kèm đồng hồ đếm ngược 10 phút (600s), nút Copy 1-click có phản hồi Toast, nút *"Kiểm tra ngay"*.
- **Rào chắn tuổi**:
  - Nếu `age < 11`: Banner thông báo bảo vệ trẻ em màu hổ phách, khóa nút nạp và gợi ý tích lũy sao miễn phí qua Điểm danh / Chia sẻ.
- **Hiệu ứng hoàn tất**:
  - Kích hoạt chuông huyền bí `soundManager.playMysticChime()`.
  - Rung haptic `[60, 60, 120]`.
  - Cập nhật số dư Quota ngay trên client và chuyển sang màn hình thông báo chúc mừng.

### 2.4. Hồ Sơ Cá Nhân (`src/app/(app)/me/page.tsx`)
- Liên kết trực tiếp `birthYear` và `nickname` từ `useReadingStore`.
- Nút "Nạp thêm" phản ánh chính xác trạng thái người dùng (`<11t` hiển thị "Điểm danh tích Sao (<11t)").
- Đảm bảo đồng bộ khi người dùng cập nhật năm sinh.

---

## 3. Kết Quả Kiểm Thử & Xác Minh (Stage Gate)

1. **Kiểm thử tự động (Vitest)**:
   - Tổng cộng **14 test files**, **70/70 tests passed (100% green)**:
     - `tests/sprint2_payos_age_guardrail.test.ts` (4/4 tests passed)
     - `tests/payos_integration.test.ts` (3/3 tests passed)
     - `tests/phase0_1_verification.test.ts` (13/13 tests passed)
     - `tests/phase2_3_verification.test.ts` (6/6 tests passed)
     - `tests/step2_split_routes.test.ts` (7/7 tests passed)
     - `tests/ket_qua_clarifier_followup.test.ts` (3/3 tests passed)
     - `tests/rut_bai_ritual.test.ts` (3/3 tests passed)
     - ... và các test suite khác.

2. **Kiểm tra biên dịch sản phẩm (Next.js Production Build)**:
   - Chạy lệnh `npm run build`: **Thành công (Exit code 0)**.
   - Biên dịch hoàn tất 38 static & dynamic routes không có lỗi TypeScript hay ESLint.

---

## 4. Trạng Thái Hoàn Thành
Sprint 2 đã hoàn thành trọn vẹn và đạt chuẩn chất lượng theo đúng cam kết kế hoạch.
