# Tarot Couple — Project Overview & Architecture 🔮

## Tech Stack
- **Core Runtime**: Node.js 20+, TypeScript 5.8
- **Framework**: Next.js 15.3 (App Router), React 19
- **Styling & Tokens**: Tailwind CSS 4, Design Tokens khoá (`--bg #09080D`, `--surface #14111C`, `--surface-2 #1D1829`, `--gold #C9A24A`, `--violet #8B5CF6`, `--rose #E879A8`, `--danger #E5566D`)
- **Animations & 3D Graphics**: Framer Motion 12 + Vanilla Three.js (`three` + `@types/three`) với Hybrid 2D Fallback, `IdleAwareRenderLoop`, và `attachWebGLContextLostGuard`
- **State Management**: Zustand 5 với `persist` middleware (chống mất trạng thái khi F5)
- **AI Engine**: Google Gemini API (`@google/genai`) với Structured JSON Output Schema (`zod`)
- **Testing**: Vitest 3.2 (104 tests passing trên 19 test suites)
- **Payment & Security**: VietQR (PayOS) + HMAC Signature Webhook, Age Guardrails (<11 tuổi chặn nạp tiền, 11+ mở nạp tiền với hạn mức bảo vệ 50k/ngày)
- **P07 Rút bài**: Riffle shuffle 3D 1.2s + haptic ngắt quãng, bàn xòe bài 3D Parabolic Arc Fan (`TactileArcFan.tsx`), lật 3 lá 3D xen kẽ 350ms, trạng thái chờ đổi thoại 2s theo Reader
- **P08 Kết quả & P09 Lá 4**: Lá bài ánh xà cừ Holographic (`TarotCardVisual.tsx`), mở lá thứ 4 (5 Sao) 1-click reveal, 2 câu hỏi sâu miễn phí trọn đời tài khoản (từ câu 3 tốn 2 Sao/câu), tích hợp OutOfStarsSheet nạp PayOS/điểm danh tức thì
- **Sprint 2 P18 Modal PayOS**: Modal VietQR động, tự động polling 2.5s, countdown 600s, âm thanh mystic chime, copy 1-click, rào chắn <11t bảo vệ trẻ em
- **Sprint 3A P12-P15 Bói Đôi (Couple Mode)**: Dynamic route `/couple/[roomCode]`, tự động polling 3s phòng chờ cho Người A, nút kiểm tra thủ công, bảo mật câu hỏi riêng tư, cầu năng lượng 3D (`CoupleResonanceBridge3D.tsx`), máy đo độ hợp cạ & Red flag, xuất ảnh Story 9:16.
- **Sprint 3B P11 Story 9:16 & P16 Daily Streak**: Render ảnh Story 1080x1920 theo theme 4 Readers chuẩn + chỉ số Couple, tự động cộng +1 lượt rút bài khi chia sẻ/tải ảnh; Điểm danh hàng ngày tặng +2 Sao và mốc 7 ngày tặng +5 Sao kèm âm thanh lật bài & chuông mừng.
- **Sprint 4 P22-P24 SEO 78 Lá SSG & Go-Live Hardening**: Pre-render tĩnh 78 trang lá bài `/cards/[slug]` kèm JSON-LD (`Article` + `FAQPage`), `/sitemap.xml`, `/robots.txt`, và cập nhật Pháp lý P24 (Tổng đài 111, Đường dây nóng Ngày Mai 096 306 1414, chính sách `<11t`).
- **Go-Live Final Polish & Production Database Readiness**: Quét sạch 100% mã màu cũ `#D9B36A` trên toàn bộ 24 file phụ trợ, chuẩn hóa TikTok Studio & Growth Engine theo 4 Readers chuẩn, tạo `supabase/migrations/001_tarot_couple_golive_schema.sql` (6 bảng + RLS + append-only trigger + RPC `atomic_star_transaction`), `src/lib/supabase-hybrid.ts` và `.env.example`.
- **Three.js 3D UI Enhancement & Specs Synchronization**: Chuẩn hóa 3 file `specs/` (`PLAN_THREEJS.md`, `THREEJS_SPECIFICATIONS.md`, `threejs_master_plan.md`) theo 4 Readers chuẩn; triển khai Core Three.js Engine (`src/lib/three/core.ts`, `src/lib/three/card-textures.ts`) và 5 điểm chạm 3D: `CelestialSkyCanvas.tsx` (3 tầng sao Z + Reader Nebula), `HeroTarotDeck3D.tsx` (Bộ bài 3D & 4 Bảo vật Readers), `TactileArcFan.tsx` (Parabolic 3D Arc Fan + Cubic Bézier), `TarotCardVisual.tsx` (Holographic Foil Shimmer), và `CoupleResonanceBridge3D.tsx` (Cầu năng lượng Bói Đôi 3D).

## 4 Canonical Readers (TarotCouple_Plan_GoLive.pdf)
1. **`ba_ngoai` (Bà Ngoại)**: Ấm áp, hay kể chuyện xưa, nhắc ăn cơm, giọng nhẹ nhàng, "con", ví von đời thường. Màu nhấn `#EAB308`, Bảo vật 3D: *Đèn Trà Sen Gốm Cổ & Nến Ấm*.
2. **`chi_dai` (Chị Đại)**: Thẳng thắn, hơi gắt, thương thật. Ngắn, mạnh, hơi mắng yêu, nhắc yêu bản thân. Màu nhấn `#E11D48`, Bảo vật 3D: *Ly Rượu Vang Pha Lê & Hoa Hồng Đỏ*.
3. **`ban_than` (Bạn Thân)**: Hài hước, lầy lội, đồng cảm, slang Gen Z, nghe hết mọi bí mật không phán xét. Màu nhấn `#EC4899`, Bảo vật 3D: *Tinh Cầu Ngôi Sao Hồng Lấp Lánh*.
4. **`thay_cu_meo` (Thầy Cú Mèo)**: Điềm tĩnh, phân tích có logic, từ tốn, câu hỏi gợi mở sâu sắc. Màu nhấn `#3B82F6`, Bảo vật 3D: *La Bàn Thiên Văn Đồng Thau (Armillary Sphere)*.

## Single Source of Truth
- `resolveReader(readerId, birthYear)` trong `src/data/tarot-cards.ts`: Nguồn duy nhất quyết định persona. Dưới 16 tuổi tự động áp dụng biến thể học sinh (`isStudentVariant = true`, giảm mỉa mai, không chủ đề tình cảm nặng, không nhắc chất kích thích).

## Key Verification Commands
- `npm test`: Chạy 104 unit & integration tests trên 19 test suites (Vitest)
- `npm run build`: Biên dịch production bundle cho 118 static pages & routes (bao gồm 78 trang `/cards/[slug]`, `/sitemap.xml`, `/robots.txt`)
- `npm run dev`: Chạy dev server tại `http://localhost:3000`
