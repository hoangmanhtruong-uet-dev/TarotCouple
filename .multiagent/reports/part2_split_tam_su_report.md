# BÁO CÁO HOÀN THÀNH PHẦN 2: TÁCH BƯỚC 2 THÀNH 3 MÀN CON

## 1. Tổng quan
Theo kế hoạch tái cấu trúc giao diện luồng bốc bài (`/reading/*`), trang `tam-su` cũ vốn chứa quá nhiều mục (chủ đề, nỗi niềm, gợi ý, bộ bài) đã được tách thành **3 màn con chuyên biệt** thuộc Bước 2:
- **2a (`/reading/chu-de`)**: Chọn chủ đề trải bài.
- **2b (`/reading/noi-niem`)**: Nhập nỗi niềm phong ấn, công tắc bảo mật Story và chip gợi ý.
- **2c (`/reading/bo-bai`)**: Chọn quy mô bộ bài (22 lá vs 78 lá).

## 2. Chi tiết thực hiện

### 2.1. Cập nhật Stepper & Tiến trình con (`src/app/(reading)/layout.tsx`)
- Giữ nguyên Stepper 4 bước trên cùng (`1. Chọn Reader`, `2. Tâm sự`, `3. Rút 3 lá`, `4. Kết quả`) theo đúng yêu cầu, **KHÔNG thêm bước 5**.
- Bổ sung thanh tiến trình con hiển thị **3 chấm nhỏ** (`Chủ đề • Nỗi niềm • Bộ bài`) ngay dưới stepper khi người dùng ở Bước 2. Chấm hiện tại tự động sáng vàng/màu Reader kèm hiệu ứng glow.

### 2.2. Màn 2a — Chủ đề (`src/app/(reading)/reading/chu-de/page.tsx`)
- Phần đầu trang: Avatar biểu tượng của Reader đã chọn + câu chào theo giọng Reader.
- Thẻ lớn xếp dọc: Mỗi thẻ có icon, tên chủ đề, mô tả 1 dòng.
- Lọc theo tuổi: Khi người dùng trong độ tuổi học đường (10–15 tuổi), tự động chuyển sang `KID_TEEN_SAFE_TOPICS` kèm huy hiệu *"Chủ đề được chọn theo độ tuổi của bạn"*.
- Tương tác: Chạm một thẻ là chọn, sáng viền và glow 250ms rồi tự động chuyển sang `/reading/noi-niem`.
- Nút quay lại: Trở về sửa thông tin cá nhân tại `/reading/ve-ban`.

### 2.3. Màn 2b — Nỗi niềm (`src/app/(reading)/reading/noi-niem/page.tsx`)
- Ô nhập lớn với nhãn *"Nỗi niềm phong ấn gửi vũ trụ"*, đếm ký tự `/300` và nút *"Xóa ô"* nhanh.
- Gợi ý câu hỏi nhanh: Lọc chính xác theo chủ đề vừa chọn, hiển thị dạng chip. Chạm là điền vào ô và có chấm sáng đánh dấu đã dùng.
- Công tắc bảo mật: *"Ẩn câu hỏi khi chia sẻ ảnh Story"* đặt ngay dưới ô nhập, mặc định bật sẵn (`true`).
- Cảnh báo an toàn tâm lý: Quét crisis qua `scanCrisisAndInjection`, hiển thị tổng đài 111 & 096 306 1414 nếu có từ khóa nhạy cảm.
- Bố cục đáy & nút Bỏ qua:
  + **Bỏ hoàn toàn** nút xám to ở giữa màn hình.
  + **Chỉ giữ duy nhất 1 chỗ Bỏ qua** dạng dòng chữ nhỏ ở thanh dưới cùng: *"Bạn chưa muốn viết? Bấm để Bỏ qua & AI đọc theo chủ đề"*.
  + Bấm Bỏ qua: Xóa nội dung ô và chuyển sang màn 2c (`/reading/bo-bai`).
  + Nút chính "Tiếp tục chọn Bộ bài" tự động mờ (`disabled`) khi ô nhập trống.

### 2.4. Màn 2c — Bộ bài (`src/app/(reading)/reading/bo-bai/page.tsx`)
- 2 lựa chọn thẻ lớn:
  + *"Bộ 22 lá Ẩn Chính (Major Arcana)"* — Năng lượng cốt lõi, bước ngoặt lớn.
  + *"Trọn bộ 78 lá Tarot (RWS 1909)"* — Chi tiết sâu sắc, bao gồm cả đời sống hàng ngày.
- Thẻ đang chọn có viền sáng, huy hiệu và dấu tích check.
- Nút chính cố định ở đáy: *"Xáo Bài & Rút Bài"* chuyển sang `/reading/rut-bai`.
- Hiệu ứng chuyển cảnh: Chữ và hạt vàng tan mượt mà (*"Vũ Trụ Đang Xáo Bài..."*) trong 450ms.

### 2.5. Hỗ trợ F5 & Tương thích ngược
- Route `/reading/tam-su` cũ được chuyển thành client-side redirect sang `/reading/chu-de`.
- Route `/reading/rut-bai` có nút quay lại trỏ về `/reading/bo-bai`.
- Toàn bộ trạng thái form (`selectedTopic`, `questionText`, `deckMode`, `hideQuestionOnShare`) được đồng bộ thông qua Zustand `useReadingStore` và lưu trữ an toàn trên thiết bị (localStorage).

## 3. Bằng chứng kiểm thử
- `npx tsc --noEmit`: Đạt 0 lỗi.
- `tests/step2_split_routes.test.ts`: Đã thêm 5 test cases chuyên biệt cho luồng 3 màn con.
- Toàn bộ test suite: 38/38 tests passed.
