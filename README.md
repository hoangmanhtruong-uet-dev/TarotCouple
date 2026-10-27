# 🔮 Tarot Couple — Super-App Bói Tarot AI & Bói Đôi (RWS 1909)

[![Next.js 15](https://img.shields.io/badge/Next.js-15.3.0-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.1.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.1.3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-472%20passed-success?logo=vitest)](https://vitest.dev/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Multi--Key%20Chain-8E75C4?logo=google)](https://ai.google.dev/)
[![PayOS](https://img.shields.io/badge/VietQR-PayOS-00b14f)](https://payos.vn/)

**Tarot Couple** là nền tảng Progressive Web App (PWA) phản chiếu tâm lý và giải trí thế hệ mới dựa trên chuẩn bài **Rider-Waite-Smith 1909 (Public Domain)**. Ứng dụng tích hợp **4 AI Reader đa cá tính**, chế độ **Bói Đôi thời gian thực (Co-op Live Room 48h)** kèm hóa đơn tình yêu **Vintage Dating Receipt**, cơ chế xáo bài chuẩn mật mã server-side, hệ thống hạn ngạch chống spam bằng **Device Fingerprinting**, cổng thanh toán tự động **VietQR PayOS**, cùng **giáp đạo đức & khủng hoảng tâm lý** toàn diện.

---

## 🌟 Tính Năng Nổi Bật

### 1. Trải Bài Cá Nhân & Nghi Thức Rút Bài Chuyên Sâu
- **Bộ bài chuẩn RWS 1909:** Hỗ trợ linh hoạt giữa **22 Lá Ẩn Chính (Major Arcana)** cô đọng và **Trọn Bộ 78 Lá (22 Major + 56 Minor Arcana: Gậy, Cốc, Kiếm, Tiền)** với đầy đủ biểu tượng và văn bản luận giải chuẩn mực.
- **Xáo bài CSPRNG Fisher-Yates Server-Side:** Rút ngẫu nhiên bảo mật cao thông qua `crypto.getRandomValues()` với tỷ lệ lá ngược (Reversed) mặc định `30%`. AI chỉ giải nghĩa dựa trên lá bài thực tế đã bốc, tuyệt đối không bịa đặt lá bài.
- **Lá Làm Rõ Thứ 4 (`Clarifier Card` — `/api/clarifier`):** Bốc thêm 1 lá bổ trợ để soi chiếu sâu hơn vào điểm mù sau trải bài 3 lá (`Past - Present - Future`).
- **Hội thoại Đào sâu (`Interactive Follow-up Modal`):** Hỏi đáp trực tiếp với AI Reader về trải bài vừa rút.

### 2. Bói Đôi Thế Hệ Mới (Tarot Couple Mode V2)
- **2 Chế độ linh hoạt:**
  - **Solo Couple:** Tự chọn bài cho Bạn & Người ấy kèm 1 lá kết nối năng lượng.
  - **Co-op Live Room (48h):** Người A tạo phòng và chia sẻ link (`?coupleRoom=XYZ`). Người B truy cập chỉ thấy lời mời rút bài, **tuyệt đối không bị lộ câu hỏi riêng tư của Người A**. Kết quả đồng bộ và hiển thị hiệu ứng Sợi Chỉ Đỏ (Red-Thread) khi cả hai cùng hoàn tất.
- **Chỉ số Tương thích & Thấu cảm:**
  - Tỷ lệ hòa hợp tâm linh (`Resonance %`).
  - Phân tích Ngôn ngữ tình yêu (`Love Language`) & Radar cảnh báo Red Flag 🚩.
  - Lời khuyên bí mật (`Secret Advice`) & Chuỗi thử thách 7 ngày gắn kết (`7-Day Quest`).
- **Hóa đơn Tình yêu Cổ điển (`Vintage Dating Receipt`):** Xuất ảnh biên nhận kết quả tình cảm dạng hóa đơn retro vintage (PNG) tải về lưu niệm hoặc khoe lên Story.

### 3. 4 AI Reader Độc Quyền & Persona Thông Minh
Hệ thống xoay vòng mô hình đa khóa (Multi-Key Rotation & Failover: `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.6-flash`, `gemini-3-flash-preview`) kèm bộ fallback giải nghĩa dự phòng chất lượng cao khi ngoại tuyến:
1. **Bà Cố Mỏ Hỗn** (*Sắc sảo, phũ phàng nhưng thấu hiểu, vỗ mặt tỉnh mộng lụy tình*).
2. **Tiên Tử Chữa Lành** (*Ôm ấp vỗ về, chữa lành tổn thương và manifest năng lượng bình an*).
3. **Tổng Tài Lý Trí** (*Tư duy logic, phân tích xác suất, quản trị rủi ro và chiến lược hành động*).
4. **Pháp Sư Tối Cổ** (*Huyền học cổ điển, giải mã biểu tượng Rider-Waite-Smith chuyên sâu*).
- **AI Voice Reader Bar:** Hỗ trợ đọc thông điệp bằng giọng nói truyền cảm (`/api/voice`).

### 4. Quản Trị Hạn Ngạch & Chống Gian Lận (Anti-Spam)
- **Device Fingerprinting:** Nhận diện thiết bị dựa trên chữ ký phần cứng (`Canvas`, `WebGL`, `AudioContext`, `Hardware Concurrency`) lưu tại `src/lib/device-fingerprint.ts`.
- **Hạn mức 3 Lượt Bốc Bài Miễn Phí Mỗi Ngày:** Tự động reset vào 00:00 hàng ngày; khóa hành vi farm lượt bằng ẩn danh hay đổi session.
- **Ví Sao (Star Wallet):** Điểm danh nhận thưởng (`Daily Streak`), xem quảng cáo thưởng (`Rewarded Ads`), hoặc nạp Sao/Gói lượt để tiếp tục trải bài khi hết hạn mức miễn phí.

### 5. Cổng Thanh Toán Tự Động VietQR PayOS
- Tạo mã thanh toán QR động tức thì thông qua **PayOS VietQR** (`/api/payment`).
- Xác thực chữ ký số bảo mật cao qua **HMAC-SHA256**.
- Cơ chế **Idempotent Webhook** chống cộng trùng sao/lượt khi nhận nhiều callback.
- **Trần chi tiêu có trách nhiệm:** Giới hạn tối đa `50.000đ/ngày/người dùng`.
- Tự động kích hoạt cơ chế PayOS Sandbox mô phỏng khi chạy trong môi trường phát triển cục bộ.

### 6. Giáp Đạo Đức & An Toàn Tâm Lý (Safety Guardrails)
- **Bộ lọc Ngăn ngừa Khủng hoảng (Crisis Intervention):** Quét từ khóa nhạy cảm (tự hại, bế tắc, khủng hoảng tâm lý nghiêm trọng) trước khi gọi AI. Khi kích hoạt, hệ thống lập tức ngắt phiên bói bài, tắt tính năng thu phí và chuyển sang màn hình trợ giúp khẩn cấp:
  - **Tổng đài Quốc gia 111** (Bảo vệ trẻ em).
  - **Cấp cứu Y tế 115**.
  - **Đường dây nóng Ngày Mai 096 306 1414** (Hỗ trợ người trầm cảm & khủng hoảng tâm lý).
- **Chính sách Độ tuổi 3 Tầng (10+ Age Tiered Policy):**
  - **10–15 tuổi (Chế độ Học Đường Trong Sáng):** Giới hạn chủ đề (Tình bạn, Học tập, Thi cử); tự động chuyển giọng `Bà Cố Mỏ Hỗn` thành **Bà Ngoại Vui Tính**; khóa toàn bộ chức năng nạp tiền.
  - **16–17 tuổi:** Mở chủ đề giải trí nhưng khóa thanh toán VietQR ngân hàng.
  - **18+ tuổi:** Mở toàn bộ tính năng kèm trần chi tiêu trách nhiệm `50.000đ/ngày`.

### 7. Tăng Trưởng Lan Truyền & Xưởng Ảnh Viral (Growth Hub)
- **Server-Side Story Card (`1080×1920` — `/api/story-card`):** Render ảnh Story 9:16 đồng nhất trên server, căn chỉnh vùng an toàn `250px` trên/dưới cho Instagram Story và TikTok.
- **TikTok 3-Slide Carousel Studio:** Tự động biên tập trải bài thành kịch bản 3 ảnh Photo Mode kèm Caption chuẩn SEO, bộ hashtag thịnh hành và kịch bản thuyết minh CapCut TTS.
- **Hồ Sơ Tâm Linh Cuối Tháng (`Spiritual Wrapped` — `/api/wrapped-card`):** Thống kê tổng lượt bốc bài đêm muộn, khung giờ suy nhất, lá bài hộ mệnh và 4 chỉ số tiến hóa tâm linh.
- **Nhật Ký Tâm Linh & Tìm Kiếm (`/me/history`):** Lưu trữ trải bài vào LocalStorage/Supabase, tìm kiếm tức thì theo câu hỏi, tên lá bài, kèm trình soạn thảo ghi chú phản chiếu (`Personal Reflection Note`).

### 8. Đồ Họa 3D WebGL & Hiệu Ứng Âm Thanh Huyền Bí
- **Đồ họa Three.js WebGL:** Khung bài 3D tương tác (`HeroTarotDeck3D`, `CoupleResonanceBridge3D`, `SingleCardRevealModal`) tối ưu mượt mà 60 FPS trên thiết bị di động.
- **Web Audio Cohesive Sound Engine:** Bộ âm thanh huyền bí thực tế (`ambient`, `card-hover`, `card-flip`, `celestial-sparkle`, `mystic-chime`) kết hợp phản hồi rung (Haptic).

---

## 🛠️ Kiến Trúc Công Nghệ

| Lĩnh vực | Ngăn xếp Công nghệ |
| :--- | :--- |
| **Giao diện (Frontend)** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, GSAP, Lucide Icons |
| **Đồ họa 3D & Animation** | Three.js (WebGL Shaders, Card Textures, Custom Celestial Canvas), Lenis Scroll |
| **Xử lý Backend & API** | Next.js Route Handlers (`/api/reading`, `/api/couple`, `/api/clarifier`, `/api/payment`, `/api/story-card`, `/api/daily`, `/api/health`, `/api/voice`, `/api/growth`) |
| **Trí tuệ Nhân tạo (AI)** | Google Gemini (`@google/genai`) với chuỗi luân chuyển Multi-Key + Zod Validation + Bộ giải nghĩa RWS 1909 Deterministic Fallback |
| **Cơ sở Dữ liệu & Lưu trữ** | Supabase PostgreSQL (12 bảng kèm RLS, Serverless Hybrid Read-Through Cache) |
| **Thanh toán & Ví** | PayOS VietQR SDK (`@payos/node`) + Xác thực Webhook HMAC-SHA256 |
| **Kiểm thử & An ninh** | Vitest (472 tests passing), Playwright E2E, Gitleaks Security Secret Scanning |

---

## 📁 Cấu Trúc Dự Án

```
tarot-couple/
├── src/
│   ├── app/
│   │   ├── (admin)/            # Trang quản trị & chẩn đoán hệ thống (/admin/funnel)
│   │   ├── (app)/              # Thư viện lá bài (/cards), nhật ký (/me), wrapped
│   │   ├── (couple)/           # Bói đôi Tarot Couple Live (/couple, /couple/room)
│   │   ├── (reading)/          # Luồng bói bài chính (/reading/reader, /chu-de, /rut-bai, /ket-qua)
│   │   ├── api/                # 11 Route Handlers xử lý AI, thanh toán, ảnh, âm thanh
│   │   ├── globals.css         # Tailwind v4 theme & CSS tokens huyền bí
│   │   └── layout.tsx          # Root layout với Dark Mystic Palette (#13111E, #C9A24A)
│   ├── components/
│   │   ├── reader/             # Component Reader Dossier, Voice Preview, Signature Card 3D
│   │   ├── reading/            # HeroClarifierCard, InteractiveFollowupCard, OutOfQuotaDrawSheet
│   │   ├── ui/                 # Thiết kế nút bấm, thẻ bài, modal trợ năng chuẩn A11y
│   │   ├── CoupleModeView.tsx  # Giao diện Bói đôi V2 (Solo + Co-op Live Room)
│   │   ├── CoupleDatingReceiptModal.tsx # Xuất hóa đơn Vintage Dating Receipt
│   │   ├── WalletPayOSModal.tsx# Modal thanh toán VietQR PayOS
│   │   └── ...
│   ├── data/
│   │   ├── tarot-cards.ts      # Toàn bộ 78 lá bài RWS 1909 (văn bản tiếng Việt & tiếng Anh)
│   │   ├── tarot-card-prose.ts # Kho từ điển phân tích biểu tượng chuyên sâu
│   │   └── topic-interpretations.ts # Mẫu giải nghĩa dự phòng 4 Reader
│   └── lib/
│       ├── ai-provider.ts      # Bộ điều phối Gemini AI (5-key rotation, fallback)
│       ├── couple-interpretation.ts # Động cơ tính điểm tương thích cặp đôi
│       ├── device-fingerprint.ts    # Nhận diện phần cứng thiết bị chống spam
│       ├── payos.ts            # Tích hợp PayOS VietQR & xác minh HMAC
│       ├── quota-store.ts      # Quản trị 3 lượt miễn phí, số dư sao, lịch sử giao dịch
│       ├── safety.ts           # Giáp lọc từ khóa khủng hoảng & phân tầng độ tuổi 10+
│       ├── sound-effects.ts    # Web Audio API âm thanh tương tác
│       ├── supabase-hybrid.ts  # Kết nối Supabase PostgreSQL kèm cache bộ nhớ
│       └── three/              # Khởi tạo WebGL Three.js, Shaders & Textures lá bài
├── supabase/
│   └── migrations/             # Schema migration 12 bảng PostgreSQL kèm chính sách RLS
├── tests/                      # 45 file kiểm thử Vitest bao phủ toàn diện 472 test cases
├── specs/                      # Hồ sơ đặc tả kiến trúc kỹ thuật & thiết kế
└── package.json
```

---

## 🚀 Hướng Dẫn Cài Đặt & Phát Triển Cục Bộ

### 1. Yêu Cầu Môi Trường
- **Node.js:** Phiên bản `>= 18.18.0` (Khuyến nghị Node 20 LTS hoặc 22).
- **Trình quản lý gói:** `npm` (hoặc `pnpm`).

### 2. Cài Đặt Thư Viện
```bash
git clone https://github.com/hoangmanhtruong-uet-dev/tarotcouple_2007.git
cd tarotcouple_2007
npm install
```

### 3. Cấu Hình Biến Môi Trường (`.env.local`)
Tạo file `.env.local` ở thư mục gốc (hoặc sao chép từ `.env.example`). Ứng dụng đã tích hợp sẵn cơ chế **Deterministic Fallback & PayOS Sandbox**, cho phép trải nghiệm đầy đủ ngay cả khi chưa có các API keys ngoại vi:

```env
# 1. Google Gemini AI API (Khuyến nghị để AI sinh câu trả lời trực tiếp)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# (Tùy chọn) Danh sách nhiều khóa AI để tự động cân bằng tải & chuyển đổi dự phòng
# GEMINI_API_KEYS=key1,key2,key3,key4,key5

# 2. Supabase PostgreSQL (Tùy chọn - tự động dùng bộ nhớ ram khi chạy cục bộ)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 3. PayOS VietQR Gateway (Tùy chọn - tự động chạy chế độ PayOS Sandbox nếu để trống)
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# 4. Hạn mức ngân sách AI & An toàn
DAILY_AI_BUDGET_CAP_VND=50000
```

### 4. Khởi Chạy Ứng Dụng
```bash
npm run dev
```
Truy cập ứng dụng tại: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Kiểm Thử & Kiểm Soát Chất Lượng

Dự án sở hữu bộ kiểm thử tự động toàn diện nhằm đảm bảo tính ổn định cao nhất trước khi phát hành:

```bash
# Chạy toàn bộ 472 bài kiểm thử Vitest
npm test

# Kiểm tra kiểu dữ liệu TypeScript nghiêm ngặt (Strict Mode)
npx tsc --noEmit

# Chạy kiểm thử End-to-End bằng Playwright
npm run test:e2e

# Quét phát hiện lộ lọt Secrets/Khóa bí mật bằng Gitleaks
npm run secrets:scan

# Dọn dẹp cache Next.js và khởi động sạch
npm run dev:clean
```

---

## ☁️ Hướng Dẫn Triển Khai Production (Vercel & Supabase)

1. **Khởi tạo Database trên Supabase:**
   - Đăng nhập [Supabase Dashboard](https://supabase.com).
   - Mở mục **SQL Editor**, thực thi toàn bộ script trong file `supabase/migrations/20261011000000_tarot_couple_v2_schema.sql` để thiết lập 12 bảng và phân quyền Row Level Security (RLS).
2. **Triển khai lên Vercel:**
   - Kết nối repository với tài khoản [Vercel](https://vercel.com).
   - Thêm các biến môi trường (`GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYOS_*`).
   - Cấu hình file `vercel.json` đã đặt sẵn khu vực máy chủ `sin1` (Singapore) cho độ trễ kết nối tối ưu tại Việt Nam.
   - Bấm **Deploy**.

---

## ⚖️ Tuyên Bố Đạo Đức, Quyền Riêng Tư & Pháp Lý

- **Định vị Trò chơi & Phản chiếu Tâm lý:** Tarot Couple là ứng dụng phục vụ mục đích giải trí, kết nối tình cảm và viết nhật ký phản chiếu bản thân (**Self-reflection & Journaling**). Ứng dụng **không thay thế** bất kỳ tư vấn y tế, tâm lý, tài chính hoặc pháp lý chuyên nghiệp nào.
- **Tuân thủ Nghị định 13/2023/NĐ-CP:** Dữ liệu người dùng được ẩn danh hóa trước khi gửi tới các dịch vụ AI. Lịch sử bốc bài được lưu trữ cục bộ trên trình duyệt của người dùng hoặc mã hóa an toàn trên Supabase, cho phép người dùng tự do xóa toàn bộ lịch sử bất cứ lúc nào.
- **Tiêu chuẩn Rider-Waite-Smith 1909:** Toàn bộ hình ảnh và biểu tượng bộ bài Tarot Rider-Waite-Smith xuất bản năm 1909 thuộc phạm vi **Public Domain** trên toàn cầu.

---

<p align="center">
  Tạo nên bằng tất cả sự thấu cảm và nhiệt huyết dành cho cộng đồng yêu thích Tarot Việt Nam 🇻🇳
</p>
