# Báo Cáo Sprint 3B: P11 Xuất Thẻ Story 9:16 & P16 Điểm Danh Daily Streak

## 1. Mục tiêu Sprint 3B
- **P11 Thẻ Story 9:16 (`/reading/story` & `/api/story-card`)**:
  - Hỗ trợ theme riêng biệt cho 4 Readers chuẩn (`ba_ngoai`, `chi_dai`, `ban_than`, `thay_cu_meo`) trên bộ render ảnh 1080×1920 Satori (`next/og`).
  - Truyền chỉ số tương thích Bói Đôi (`compatScore`, `redFlag`) vào ảnh Story khi xuất từ màn hình Bói Đôi.
  - Khi người dùng bấm **Chia sẻ** hoặc **Tải ảnh Story 9:16**, tự động gọi `PUT /api/reading` (`action: 'share_bonus'`) cộng **+1 lượt rút bài miễn phí** trong ngày và cập nhật Quota tức thì.
- **P16 Lá Bài Hằng Ngày & Chuỗi Điểm Danh Streak (`DailyStreakModal` & `/api/daily`)**:
  - Thưởng **+2 Sao ⭐** vào các ngày thường (Ngày 1–6) và thưởng **+5 Sao ⭐** vào mỗi mốc ngày thứ 7 liên tiếp (`streakDays % 7 === 0`).
  - Phát âm thanh lật bài `soundManager.playCardFlip()` và chuông mừng `soundManager.playMysticChime()` khi nhận Sao điểm danh.
  - Đồng bộ Design Tokens `--gold: #C9A24A`, `--surface: #14111C`, `--surface-2: #1D1829`.

---

## 2. Các Thay Đổi Chi Tiết

### 2.1. Hằng số & Logic Streak 7 Ngày (`src/lib/quota-store.ts` & `src/app/api/daily/route.ts`)
- Bổ sung hằng số `DAILY_STREAK_DAY7_REWARD = 5`.
- Cập nhật `recordDailyPullCompletion`:
  ```ts
  const reward =
    wallet.streakDays % 7 === 0
      ? DAILY_STREAK_DAY7_REWARD
      : DAILY_PULL_STAR_REWARD;
  ```
- Đồng bộ `previewReward` trong `POST /api/daily` để AI sinh lời chúc khớp số Sao thưởng.

### 2.2. Modal Điểm Danh Hàng Ngày (`src/components/DailyStreakModal.tsx`)
- Đọc chính xác trường `data.daily` từ API `/api/daily`.
- Tích hợp `soundManager.playCardFlip()` khi lật bài và `soundManager.playMysticChime()` khi nhận thưởng.
- Thanh tiến trình 7 ngày (`completedInCycle = ((streakDays - 1) % 7) + 1`) hiển thị chính xác chu kỳ 1–7 ngày.

### 2.3. Xuất Ảnh Story 9:16 (`src/app/(reading)/reading/story/page.tsx` & `src/app/api/story-card/route.tsx`)
- Bổ sung bảng màu và badge cho 4 Readers chuẩn trong `getPersonaTheme(persona)`:
  - `ba_ngoai`: `#EAB308` (`BÀ NGOẠI • GÓC BẾP ẤM ÁP`)
  - `chi_dai`: `#E11D48` (`CHỊ ĐẠI • THẲNG MÀ THƯƠNG`)
  - `ban_than`: `#EC4899` (`BẠN THÂN • HỘI BÀ TÁM ĐÊM KHUYA`)
  - `thay_cu_meo`: `#3B82F6` (`THẦY CÚ MÈO • GÓC NHÌN THÔNG THÁI`)
- Tự động gọi `claimShareBonus()` khi người dùng tải hoặc chia sẻ ảnh Story, hiển thị thông báo đã cộng +1 lượt rút bài miễn phí.
- Hỗ trợ nút quay lại thông minh: Nếu trải bài là Bói Đôi (`rd_couple_...`), quay về `/couple`; nếu trải bài đơn, quay về `/reading/ket-qua`.

---

## 3. Kết Quả Kiểm Thử & Xác Minh (Stage Gate)

1. **Kiểm thử tự động (Vitest)**:
   - Tạo test suite mới [`tests/sprint3b_story_daily_streak.test.ts`](file:///d:/MyProjects/MyProjectToMoney/TarotCouple/tests/sprint3b_story_daily_streak.test.ts) kiểm thử 4 kịch bản:
     - Điểm danh ngày 1 nhận +2 Sao và chống cộng trùng lặp trong cùng ngày.
     - Điểm danh mốc ngày thứ 7 nhận +5 Sao chính xác.
     - Render ảnh PNG 1080×1920 cho cả 4 Readers chuẩn kèm chỉ số Couple.
     - Chia sẻ Story cộng +1 lượt rút bài miễn phí (`bonusDraws: 1`, `remainingToday: 4`).
   - **Kết quả**: **16/16 test files passed**, **78/78 tests passed (100% green)**.

2. **Kiểm tra biên dịch sản phẩm (Next.js Production Build)**:
   - Chạy `npm run build`: **Thành công (Exit code 0)** trên toàn bộ 38 static & dynamic routes.
