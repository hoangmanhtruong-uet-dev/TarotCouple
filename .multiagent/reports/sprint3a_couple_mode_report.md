# Báo Cáo Sprint 3A: P12–P15 Chế Độ Bói Đôi (Couple Mode)

## 1. Mục tiêu Sprint 3A
- **Kiểu 1 (Solo Couple Check)**: Cho phép một người tự xem năng lượng của mình và đối phương (3 lá: Bản thân, Người ấy, Tần số kết nối) kèm máy đo độ hợp cạ (%) và cảnh báo Red Flag (%).
- **Kiểu 2 (Co-op Room 48h)**: Người A tạo phòng và rút Lá 1 (đặt câu hỏi riêng tư được bảo mật tuyệt đối), gửi link cho Người B rút Lá 2, hệ thống tự động rút Lá 3 và phân tích tương thích qua AI.
- **Dynamic Route `/couple/[roomCode]`**: Cho phép Người B truy cập trực tiếp bằng link ngắn gọn.
- **Đồng bộ thời gian thực cho Người A**: Tự động Polling mỗi 3 giây kèm nút *"Kiểm tra người ấy đã rút chưa"*, tự động phát chuông huyền bí và mở bài khi Người B hoàn thành.
- **Xuất ảnh Story 9:16**: Tích hợp nút xuất ảnh khoe kết quả bói đôi trực tiếp sang màn hình Story.

---

## 2. Các Thay Đổi Chi Tiết

### 2.1. Dynamic Route & Link mời Zalo/Messenger
- Tạo trang mới: [`src/app/(couple)/couple/[roomCode]/page.tsx`](file:///d:/MyProjects/MyProjectToMoney/TarotCouple/src/app/(couple)/couple/[roomCode]/page.tsx)
  - Tự động bóc tách `roomCode` từ URL param.
  - Khởi tạo `CoupleModeView` ở chế độ tham gia phòng (`join`).
- Nâng cấp [`src/app/(couple)/couple/page.tsx`](file:///d:/MyProjects/MyProjectToMoney/TarotCouple/src/app/(couple)/couple/page.tsx):
  - Hỗ trợ cả Query Params: `?coupleRoom=XYZ` hoặc `?room=XYZ` bọc trong `Suspense`.
  - Kết nối callback `onOpenStoryModal` lưu trữ kết quả bói đôi vào store và chuyển hướng sang `/reading/story`.

### 2.2. Đồng bộ phòng chờ & Trải nghiệm Người A (`src/components/CoupleModeView.tsx`)
- Tích hợp hook `useEffect` tự động Polling tới `GET /api/couple?roomCode=...` mỗi 3 giây khi Người A ở trạng thái `waiting_partner`.
- Nút bấm thủ công *"Kiểm tra người ấy đã rút chưa"* có animation xoay `RefreshCw` và `Loader2`.
- Khi Người B hoàn thành:
  - Tự động nhận diện dữ liệu phòng hoàn tất.
  - Kích hoạt âm thanh chuông mừng `soundManager.playMysticChime()`.
  - Tự động lật 3 lá bài và hiển thị phân tích tương thích, máy đo hợp cạ và Red Flag.
- Cập nhật định dạng link mời chia sẻ Zalo/Messenger thành link ngắn `/couple/${roomCode}`.
- Cập nhật mã QR quét trực tiếp từ Camera bằng URL `/couple/${roomCode}`.
- Bổ sung nút *"Xuất Thẻ Story 9:16 Khoe Bạn Bè"* và *"Bói lượt mới"*.
- Đồng bộ toàn bộ màu sang Design Token chuẩn `--gold: #C9A24A`.

### 2.3. Cải tiến API Bói Đôi (`src/app/api/couple/route.ts`)
- `GET /api/couple?roomCode=...`: Khi phòng ở trạng thái `completed`, trả về kèm object `reading: room.fullReading` để phía client Người A tự động nhận kết quả ngay trong lần polling tiếp theo.
- Duy trì rào chắn bảo mật nghiêm ngặt: Tuyệt đối không bao giờ trả về trường `ownerQuestionText` của Người A cho Người B.

---

## 3. Kết Quả Kiểm Thử & Xác Minh (Stage Gate)

1. **Kiểm thử tự động (Vitest)**:
   - Tạo test suite mới [`tests/sprint3a_couple_mode.test.ts`](file:///d:/MyProjects/MyProjectToMoney/TarotCouple/tests/sprint3a_couple_mode.test.ts) kiểm thử độc lập 4 kịch bản:
     - Kịch bản 1: Người A tạo phòng 48h, nhận mã phòng 6 ký tự, câu hỏi riêng tư được bảo mật.
     - Kịch bản 2: Người B gọi `GET /api/couple?roomCode=...` không thấy câu hỏi riêng của Người A.
     - Kịch bản 3: Người B tham gia rút Lá 2, AI phân tích tương thích, và Người A Polling nhận được kết quả chung.
     - Kịch bản 4: Trải bài Solo Couple Check 3 lá hoạt động hoàn hảo với các chỉ số tương thích.
   - **Kết quả**: **15/15 test files passed**, **74/74 tests passed (100% green)**.

2. **Kiểm tra biên dịch sản phẩm (Next.js Production Build)**:
   - Chạy `npm run build`: **Thành công (Exit code 0)**.
   - Biên dịch hoàn tất 38 static & dynamic routes, bao gồm dynamic route `ƒ /couple/[roomCode]`.

---

## 4. Trạng Thái Hoàn Thành
Sprint 3A đã hoàn thành 100% mục tiêu kỹ thuật, sẵn sàng bàn giao cho người dùng.
