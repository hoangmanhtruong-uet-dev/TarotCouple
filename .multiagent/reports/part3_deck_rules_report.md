# BÁO CÁO HOÀN THÀNH PHẦN 3: LUẬT BỘ BÀI CHO TÀI KHOẢN FREE (SERVER-SIDE)

## 1. Tổng quan
Đã triển khai cơ chế kiểm soát luật chọn bộ bài cho tài khoản miễn phí và logic mở khóa bằng Ví Sao theo đúng đặc tả:
- **Server-side Enforced**: Kiểm tra nghiêm ngặt tại API `POST /api/reading` và `src/lib/quota-store.ts`, ngăn chặn hoàn toàn việc bypass từ client.
- **Client UX & Bottom Sheet**: Trải nghiệm mở khóa trực quan tại màn 2c (`/reading/bo-bai`) với 2 Bottom Sheet chuyên biệt ("Mở khóa bộ 78 lá bằng 5 Sao" & "Hết lượt hôm nay").

---

## 2. Chi tiết thực hiện

### 2.1. Cấu hình & Luật lượt Server-side (`src/lib/quota-store.ts`)
- `FREE_DAILY_READINGS = 3`: Mỗi ngày tài khoản free có tối đa 3 lượt bốc bài miễn phí.
- `FREE_DAILY_FULL_DECK_READINGS = 1`: **Lượt đầu tiên trong ngày** (`usedToday === 0`) được tự do chọn bộ 78 lá hoặc bộ 22 lá hoàn toàn miễn phí.
- **Lượt thứ hai và thứ ba**: Chỉ được chọn bộ 22 lá. Bộ 78 lá bị **khóa** (`canUseFullDeck: false`).
- `FULL_DECK_UNLOCK_STAR_COST = 5` (*TODO: Giá tạm thời 5 Sao, sau có thể điều chỉnh theo quyết định kinh doanh*):
  - Hàm `unlockFullDeckWithStars(clientKey)`: Kiểm tra số dư Ví Sao, trừ 5 Sao và cấp quyền mở khóa 78 lá cho 1 lượt bốc tiếp theo (`fullDeckUnlockedDraws += 1`).
  - Hàm `canUseFullDeck(clientKey)`: Trả về trạng thái được phép dùng bộ 78 lá hay không.
  - Hàm `consumeQuota(...)`: Tự động trừ 1 đơn vị mở khóa nếu người dùng thực hiện trải bài 78 lá ở lượt thứ 2+.

### 2.2. Kiểm duyệt bảo vệ Server API (`src/app/api/reading/route.ts`)
- Khi client gửi request `POST /api/reading` với `deck_mode === 'full_78'`:
  - Server kiểm tra qua `canUseFullDeck(clientKey)`.
  - Nếu gửi 78 lá ở lượt 2 hoặc 3 mà **chưa mở khóa**: Server từ chối ngay lập tức với **HTTP 403** và mã lỗi `FORBIDDEN_DECK_MODE`.
  - **Không gọi Gemini AI**, **không trừ lượt**, và **không trừ quota**.
- Thêm action `unlock_full_deck` trong `PUT /api/reading`:
  - Cho phép client gửi yêu cầu mở khóa bộ 78 lá bằng Ví Sao.
  - Nếu đủ Sao: Trừ 5 Sao, trả về HTTP 200 kèm `quota` cập nhật.
  - Nếu không đủ Sao: Trả về HTTP 400 kèm `INSUFFICIENT_STARS`.

### 2.3. Giao diện Màn 2c Bộ bài ([`src/app/(reading)/reading/bo-bai/page.tsx`](file:///d:/MyProjects/MyProjectToMoney/TarotCouple/src/app/(reading)/reading/bo-bai/page.tsx))
- **Trạng thái Thẻ 78 lá**:
  - Khi chưa bị khóa (lượt 1): Thẻ sáng bình thường, chạm là chọn.
  - Khi bị khóa (lượt 2 và 3): Hiển thị icon Ổ khóa vàng (`Lock`), huy hiệu *"Khóa Lượt 2 & 3 • Cần 5 Sao"*, và nút *"Mở khóa bằng Ví Sao: 5 Sao"*.
  - Chạm vào thẻ bị khóa: Hiệu ứng rung nhẹ ổ khóa và mở **Bottom Sheet 1: Mở khóa bộ 78 lá**.
- **Bottom Sheet 1 — Xác nhận mở khóa bằng Sao**:
  - Hiển thị chi phí: `5 Sao ⭐` và Số dư hiện tại của người dùng.
  - **Nếu đủ Sao (≥ 5 Sao)**: Nút *"Xác nhận trừ 5 Sao để mở khóa"*, gọi API `unlock_full_deck`, kích hoạt bộ 78 lá và hiển thị toast chúc mừng.
  - **Nếu không đủ Sao (< 5 Sao)**:
    - *Đối với 18+*: Nút nạp Sao PayOS VietQR (mở `WalletPayOSModal`).
    - *Đối với 10–15 tuổi*: Banner bảo vệ giải thích chính sách bảo vệ độ tuổi, hướng dẫn nhận Sao miễn phí qua Điểm danh streak (+2 ⭐) và Mời bạn bè (+5 ⭐).
- **Bottom Sheet 2 — Hết lượt hôm nay**:
  - Khi đã dùng hết 3 lượt (`remainingToday === 0`), nút *"Xáo bài"* chuyển thành *"Nhận thêm lượt →"*.
  - Mở Bottom Sheet hướng dẫn 4 cách nhận thêm lượt/Sao: Chia sẻ Story (+1 lượt), Điểm danh chuỗi (+2 ⭐), Mời bạn bè (+5 ⭐), và Nạp Sao PayOS (nếu 18+).

---

## 3. Bằng chứng kiểm thử & Xác minh
- `npx tsc --noEmit`: 0 lỗi.
- `tests/part3_deck_rules.test.ts`: 6 test cases kiểm thử chi tiết toàn bộ luồng server-side:
  1. Cho phép bộ 78 lá miễn phí ở lượt 1.
  2. Khóa bộ 78 lá ở lượt 2 và 3.
  3. Server từ chối request full_78 ở lượt 2 với HTTP 403 & `FORBIDDEN_DECK_MODE` mà không trừ lượt hay AI.
  4. Mở khóa thành công bằng 5 Sao qua `PUT /api/reading`.
  5. Chặn mở khóa khi số dư không đủ (`INSUFFICIENT_STARS`).
  6. Chặn bốc bài khi hết 3 lượt (`QUOTA_EXCEEDED`).
- Test suite tổng thể: **44/44 tests pass**.
- Git commit: `0e1d8ce`.
