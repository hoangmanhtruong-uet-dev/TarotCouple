# Báo Cáo Hoàn Thành: Phần 4 (Animation) & Phần 5 (Kiểm Tra Bắt Buộc)

## 1. Tổng Quan Nhiệm Vụ
Đã hoàn thành toàn bộ yêu cầu của **Phần 4 (Animation & Chuyển cảnh)** và **Phần 5 (Kiểm tra bắt buộc)** theo đặc tả:
- Tinh chỉnh trải nghiệm thị giác chuyển cảnh giữa các màn con Bước 2 (`/reading/chu-de` → `/reading/noi-niem` → `/reading/bo-bai`).
- Đảm bảo tuân thủ nghiêm ngặt `prefers-reduced-motion`.
- Tích hợp các bộ phòng vệ Route Guard và đồng bộ hóa trạng thái Hydration Client/Server.

---

## 2. Chi Tiết Triển Khai Phần 4 (Animation)

1. **Chuyển giữa các màn con (Page Transition)**:
   - Dùng Framer Motion với hiệu ứng trượt ngang `x: 16px` + `opacity: 0` khi vào, và trượt thoát `x: -16px` + `opacity: 0`.
   - Thời lượng chuẩn xác `350ms` (`duration: 0.35`) với easing mượt mà `ease: [0.22, 1, 0.36, 1]`.
   - Hỗ trợ `shouldReduceMotion`: khi người dùng bật chế độ giảm chuyển động, hiệu ứng chuyển ngay lập tức mà không gây giật.

2. **Màn 2a - Chủ đề (`/reading/chu-de`)**:
   - Khi chạm vào thẻ chủ đề: Thẻ phóng nhẹ `scale: 1.02` với viền sáng bừng theo màu Reader (`boxShadow: 0 0 24px ${readerAccentColor}60`) trong `250ms` trước khi tự động chuyển trang.

3. **Màn 2b - Nỗi niềm (`/reading/noi-niem`)**:
   - **Typewriter Greeting**: Câu mở đầu độc quyền của Reader gõ từng chữ với con trỏ nhấp nháy màu vàng cổ (`#D9B36A`).
   - **Breathing Glow Border**: Khi focus/gõ vào ô textarea, viền đổi màu Reader và tỏa hào quang thở nhẹ nhàng (`boxShadow` dao động theo nhịp 2.2s).
   - **Floating Spark Particles**: Các hạt bụi sao phát sáng nổi lên nhẹ nhàng ở đáy ô nhập khi đang focus/gõ, sử dụng `pointer-events-none` và không kích hoạt re-render gây lag gõ phím.

4. **Màn 2c - Chọn bộ bài (`/reading/bo-bai`)**:
   - **Chồng bài nhô lên (Elevation)**: Khi một bộ bài được chọn, thẻ nhô lên nhẹ `translateY(-2px)`.
   - **Ổ khóa rung nhẹ (Lock Shake)**: Khi chạm vào bộ 78 lá bị khóa, ổ khóa rung lắc nhẹ 4px qua lại (`x: [-4, 4, -4, 4, -2, 2, 0]`) trong 400ms và mở Bottom Sheet xác nhận trừ Sao.
   - **Animation Bấm Xáo Bài (Golden Dissolve Particles)**: Khi bấm "Xáo bài", 24 hạt năng lượng vàng bùng nổ tan biến ra bốn phía và hiển thị dòng chữ *"Vũ Trụ Đang Xáo Bài..."* trong 450ms trước khi chuyển sang `/reading/rut-bai`.

---

## 3. Chi Tiết Triển Khai Phần 5 (Kiểm Tra Bắt Buộc)

| Hạng mục kiểm tra | Trạng thái | Cơ chế thực hiện |
| :--- | :---: | :--- |
| **1. F5 không mất dữ liệu** | ✅ Đạt | `useReadingStore` dùng middleware `persist` lưu vào `localStorage`. Quota đồng bộ server-side theo client key. |
| **2. Nút Back của trình duyệt** | ✅ Đạt | Luồng được tách thành các URL riêng biệt (`/reading/chu-de`, `/reading/noi-niem`, `/reading/bo-bai`). Nút Back và Forward hoạt động chuẩn xác theo lịch sử duyệt web. |
| **3. Vào thẳng khi chưa qua bước trước** | ✅ Đạt | Tích hợp **Route Guard** có chờ `isHydrated`: nếu chưa điền hồ sơ Về Bạn (`!hasFilledProfile` / `!nickname`), tự động chuyển về `/reading/ve-ban`. Nếu vào `/reading/noi-niem` hoặc `/reading/bo-bai` khi chưa chọn chủ đề, tự động chuyển về `/reading/chu-de`. |
| **4. Bàn phím iOS không che ô nhập** | ✅ Đạt | Cấu hình `interactiveWidget: 'resizes-content'` trong `Viewport` (`src/app/layout.tsx`), đồng thời textarea có `scrollIntoView({ behavior: 'smooth', block: 'center' })` khi focus. |
| **5. An toàn 10–15 tuổi** | ✅ Đạt | Chế độ Học Đường Trong Sáng: Lọc bộ 3 chủ đề an toàn (`KID_TEEN_SAFE_TOPICS`), tự động đổi giọng Bà Cố sang *Bà Ngoại Vui Tính*. Khóa hoàn toàn mọi nút và API nạp tiền ngân hàng; chỉ cho phép mở khóa bộ 78 lá bằng Sao miễn phí kiếm từ Điểm danh (+2⭐) hoặc Mời bạn (+5⭐). |

---

## 4. Kết Quả Kiểm Thử & Biên Dịch Sản Xuất

1. **Vitest Unit Test Suite**:
   - `46/46 tests passing` trên 7 bộ test suites (bao gồm kiểm thử route guard, rehydration, luật bộ bài server-side, và chính sách 10–15 tuổi).
2. **Next.js Production Build**:
   - `npm run build` biên dịch thành công `Exit code 0` cho toàn bộ **29 routes** (static prerender & dynamic endpoints).
