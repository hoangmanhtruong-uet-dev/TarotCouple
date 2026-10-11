# 📋 PLAN1.md — Báo Cáo Audit UI/UX & Kế Hoạch Nâng Cấp Thẩm Mỹ Toàn Diện

> **Ngày lập:** 11/10/2026  
> **Người thực hiện:** Multi-Agent Team (`tester` + `critic-reviewer` + `design-taste-frontend`)  
> **Dự án:** Tarot Couple (Next.js 15 App Router + Framer Motion + Tailwind v4)  
> **Mục tiêu:** Đánh giá chi tiết hiện trạng UI/UX, chỉ ra nguyên nhân gây cảm giác "UI xấu, ít trang con, thiếu chuyển động huyền bí" và lập danh sách hành động (Action Plan) nâng tầm giao diện đạt chuẩn Anti-Slop / Editorial Mystic-Noir.

---

## 1. Executive Summary & Design Read

- **Design Read hiện tại:** Web app bói bài phong cách tâm linh Gen Z (Rider-Waite-Smith 1909), nhưng các trang con sau khi tách route đang mang cảm giác **"khô cứng, dạng form nhập liệu hành chính hơn là một không gian nghi thức huyền bí (Mystic Sanctuary)"**.
- **Điểm Dial hiện tại (The Three Dials):**
  - `DESIGN_VARIANCE: 4/10` (Quá đối xứng, thiếu điểm ngắt nhịp điệu thị giác và bố cục bất đối xứng editorial).
  - `MOTION_INTENSITY: 4/10` (Mới chỉ có các chuyển động cơ bản fade/slide; thiếu cảm giác vật lý tương tác lá bài, thiếu ánh sáng hạt sao chuyển động theo thao tác ngón tay).
  - `VISUAL_DENSITY: 7/10` (Các khối card còn dày đặc viền, ô nhập liệu to bản thô, chưa có khoảng thở sang trọng).

---

## 2. Kiểm Tra & Audit Chi Tiết Từng Luồng (Audit Findings)

### 2.1. Cụm Landing Page (`/`)
- 🔴 **Vấn đề nhận diện:**
  - Bộ 5 lá bài xòe quạt ở hero hiện là các thẻ giả lập CSS chữ đơn giản, chưa đưa trực tiếp ảnh gốc Rider-Waite-Smith 1909 lên bề mặt lá bài nên trông thiếu độ tin cậy và huyền ảo.
  - 4 ô thẻ Reader ở dưới đang xếp thành lưới 2x2 hoặc 4 cột đơn điệu như thẻ tính năng SaaS thông thường, làm giảm chất "Lều Thầy Bói".
- 🟢 **Khắc phục đề xuất:**
  - Thay mặt bài xòe quạt bằng artwork RWS thực tế (The Fool, The Lovers, The Sun) có bóng đổ nhung và viền vàng kim tuyến.
  - Thêm hiệu ứng di chuột / chạm ngón tay tương tác làm sáng rực lá bài đang chọn.
  - Thay đổi lưới 4 Reader thành Bento Grid bất đối xứng: Reader nổi bật (`Bà Cố Mỏ Hỗn`) chiếm 2 cột với trích dẫn sinh động, các Reader khác bố trí hài hòa.

### 2.2. Cụm Chọn Reader (`/reading/reader`)
- 🔴 **Vấn đề nhận diện:**
  - Giao diện trông như một bảng giá đăng ký gói dịch vụ (pricing cards).
  - Hiệu ứng rèm lều hiện chỉ là 2 tấm che mờ tối đơn điệu 0.38s, chưa có nếp gấp vải nhung, ánh nến lung linh hay âm hưởng huyền bí.
- 🟢 **Khắc phục đề xuất:**
  - Biến đổi trang thành **"Không Gian 4 Gian Lều Tarot"**: mỗi Reader có một background họa tiết riêng biệt (Ember Red cho Bà Cố, Jade Healing cho Tiên Tử, Royal Blue cho Tổng Tài, Dark Amethyst cho Pháp Sư).
  - Chuyển nút bấm thành nghi thức: *"Bước vào lều"* với âm hưởng gõ cửa hoặc vén rèm rõ rệt.

### 2.3. Cụm Tâm Sự & Hoàn Cảnh (`/reading/tam-su`)
- 🔴 **Vấn đề nhận diện:**
  - Giao diện có quá nhiều ô `select` và `input` hình chữ nhật thô (Năm sinh, Cung hoàng đạo, Quy mô bộ bài), tạo cảm giác như form khảo sát hành chính hoặc điền thông tin xin việc.
  - Thanh đếm ký tự và gợi ý câu hỏi thiếu chất thơ, trông nặng tính công nghệ.
- 🟢 **Khắc phục đề xuất:**
  - Thay các ô dropdown thô kệch bằng **Vòng Tròn Hoàng Đạo (Zodiac Dial/Wheel)** hoặc chip biểu tượng cung hoàng đạo (♈ ♉ ♊ ♋...).
  - Thiết kế ô kể chuyện như một **"Bức Thư Phong Ấn Năng Lượng"** (Parchment / Velvet Box) với hiệu ứng viền phát sáng khi người dùng bắt đầu gõ phím.
  - Thêm trạng thái chuyển tiếp: khi bấm nút gửi, từng câu chữ tan biến thành bụi sao vàng bay vào lư hương/quả cầu năng lượng.

### 2.4. Cụm Rút Bài & Xáo Bài (`/reading/rut-bai`)
- 🔴 **Vấn đề nhận diện:**
  - Bộ 78 lá bài hiện đang hiển thị dưới dạng một lưới ô vuông bé xíu (grid) bên trong khung cuộn, người dùng cảm giác như đang chọn số lô tô thay vì rút một lá bài Tarot huyền bí.
  - 3 ô vị trí bên trên chỉ là các khung viền nét đứt khô khan.
- 🟢 **Khắc phục đề xuất:**
  - Chuyển sang **vòng cung bài 3D xếp lớp rẻ quạt chân thực (Interactive Arc Fan Carousel)** cho phép người dùng dùng ngón tay vuốt lướt qua mép từng lá bài (haptic swipe).
  - Khi rút bài, lá bài nhấc bổng khỏi bộ bài với vệt sáng lấp lánh (sparkle trail) và bay xoay lật đáp nhẹ xuống ô vị trí (Slot Landing).

### 2.5. Cụm Kết Quả & Luận Giải (`/reading/ket-qua`)
- 🔴 **Vấn đề nhận diện:**
  - Các đoạn luận giải đang xếp thành các khối text dài đặt trong card nền đen viền xám, gây mỏi mắt và giảm cảm xúc hồi hộp của người xem.
  - Khối lá thứ 4 (Clarifier) nằm thụ động ở cuối trang, chưa tạo được cảm giác bí ẩn tò mò thôi thúc mở khóa.
- 🟢 **Khắc phục đề xuất:**
  - Phân tách màn hình thành 2 giai đoạn:
    1. **Màn 1: Lễ Lật Bài Thần Thánh (Sacred Reveal)** — 3 lá bài chiếm trọn khung nhìn, chạm để tự tay lật từng lá với âm thanh và ánh hào quang bung tỏa.
    2. **Màn 2: Sổ Tay Định Mệnh (The Prophecy Scroll)** — Lời giải được bóc tách theo nhịp kể chuyện, câu chốt hạ (Verdict) thiết kế kiểu chữ to bản editorial tương phản cao.
  - Thêm nhãn *"Cảnh Báo Red Flag 🚩"* hoặc *"Thông Điệp Chữa Lành 🌿"* nổi bật bằng typography cổ điển.

### 2.6. Cụm Xuất Ảnh Story 9:16 (`/reading/story`)
- 🔴 **Vấn đề nhận diện:**
  - Mới chỉ có 1 khung ảnh tĩnh và nút tải/chia sẻ đơn giản, thiếu các trang con tùy biến phong cách (Sticker, Theme viền, Bộ lọc màu tối/sáng).
- 🟢 **Khắc phục đề xuất:**
  - Bổ sung thanh chọn **Theme Poster** (Phong cách Cổ Điển RWS, Phong cách Báo Chí Tạp Chí Editorial, Phong cách Tối Giản Cyber-Noir).
  - Hiệu ứng xuất ảnh với pháo hoa ngôi sao lấp lánh và nút xem trước trực quan chuẩn tỉ lệ khung hình Instagram/TikTok Stories.

### 2.7. Cụm Bói Đôi (`/couple`)
- 🔴 **Vấn đề nhận diện:**
  - Hiện tại trang `/couple` đang gọi lại component gộp cũ (`CoupleModeView`), giao diện còn nặng và chưa chia thành các bước nhỏ tách biệt.
- 🟢 **Khắc phục đề xuất:**
  - Tách cụm Bói Đôi thành các trang/màn hình nhỏ riêng biệt:
    1. `/couple` (Chọn hình thức: Tự soi một mình vs Mời người ấy)
    2. `/couple/tao-phong` (Người A nhập tâm sự bí mật & rút lá số 1)
    3. `/couple/phong-cho/[code]` (Phòng chờ 48h đếm ngược thời gian)
    4. `/couple/ket-qua` (Đồng hồ đo % Hợp Cạ chạy từ 0 đến kết quả cùng máy đo Red Flag)

---

## 3. Danh Sách Trang Giao Diện Nhỏ (Sub-Pages & Micro-Screens) Cần Bổ Sung

Để ứng dụng sống động, sâu sắc và không bị "cộc lốc", hệ thống sẽ bổ sung các trang giao diện nhỏ sau:

| STT | Trang / Micro-Screen | Đường dẫn (Route) | Mục đích trải nghiệm |
|---|---|---|---|
| 1 | **Nhật Ký Trải Bài (Tarot Journal)** | `/me/history` | Xem lại các trải bài cũ đã lưu, lịch sử rút bài, tra cứu ý nghĩa các lá bài từng rút |
| 2 | **Từ Điển 78 Lá Bài (Grimoire / Deck Codex)** | `/cards` hoặc `/reading/codex` | Thư viện lật mở khám phá ý nghĩa xuôi/ngược của cả 78 lá Rider-Waite-Smith 1909 |
| 3 | **Nghi Thức Thanh Tẩy (Aura Cleansing)** | `/reading/cleansing` (Micro-step) | Màn hình 3 giây hít thở sâu, thanh tẩy tâm trí trước khi xáo bài |
| 4 | **Bói Đôi: Phòng Đợi Người Ấy** | `/couple/room/[code]` | Màn hình đếm ngược 48h với lời nhắn bí mật dành riêng cho nửa kia |
| 5 | **Bộ Sưu Tập Sticker Story** | Trong `/reading/story` | Cho phép dán các huy hiệu chốt hạ như: `Red Flag 85%`, `Lụy Tình Cấp Độ 5`, `Bà Cố Phán` |
| 6 | **Chi Tiết Nạp Sao & Lịch Sử Giao Dịch** | `/me/wallet` | Xem chi tiết số dư Sao, gói ưu đãi và sao kê nạp PayOS minh bạch |

---

## 4. Kế Hoạch Triển Khai Nâng Cấp (Action Plan)

### Giai đoạn A: Nâng cấp Hệ Thống Thẩm Mỹ & Visual Tokens (Design System Overhaul)
- [ ] Bổ sung hiệu ứng hạt sao chuyển động mượt mà (`StarCanvas` / Canvas Particle) nhẹ tải, không giật lag.
- [ ] Định nghĩa lại bộ Typography: Sử dụng `Playfair Display` serif chuẩn editorial cho tất cả tiêu đề/quote lớn và `Be Vietnam Pro` cho nội dung đọc dễ chịu.
- [ ] Chuẩn hóa bảng màu nhung tối: Nền `#0B0A12` mực tím than, viền vàng kim `#D9B36A`, điểm nhấn son đỏ `#E5624A` cho Red Flag.

### Giai đoạn B: Đại Tu Từng Trang Con (Page-by-Page Redesign)
- [ ] **Landing (`/`)**: Thay mặt bài thật, thiết kế Bento Grid Reader phá cách.
- [ ] **Chọn Reader (`/reading/reader`)**: Biến thành 4 lều thần bí với không gian âm thanh/hình ảnh riêng.
- [ ] **Tâm sự (`/reading/tam-su`)**: Thay thế các ô dropdown thô cứng bằng vòng chọn Cung Hoàng Đạo dạng chip và hộp thư phong ấn.
- [ ] **Rút bài (`/reading/rut-bai`)**: Thiết kế bộ bài xòe quạt 3D cong vuốt chạm mượt mà (Haptic Fan Touch).
- [ ] **Kết quả (`/reading/ket-qua`)**: Tách làm 2 nhịp: Lễ lật bài huyền bí 3D + Cuộn giải mã lời phán.
- [ ] **Thêm trang `/me/history` & `/reading/codex`**: Bổ sung chiều sâu trải nghiệm cho người dùng quay lại hàng ngày.

### Giai đoạn C: Kiểm Thử & Tối Ưu Hiệu Năng
- [ ] Đảm bảo 100% animations tôn trọng `prefers-reduced-motion`.
- [ ] Kiểm tra tương thích màn hình nhỏ iPhone SE (375px) đến iPhone 16 Pro Max (430px).
- [ ] Đo đạc FPS duy trì 60fps trên thiết bị di động, không gây giật lag khi gõ văn bản.
