# TarotCouple — Kế hoạch Fix Audit + Feature mới

Nguồn: báo cáo audit (8 CRITICAL, 11 HIGH, 13 MEDIUM). Mục tiêu: an toàn để lên production → ổn định/nhanh → thêm tính năng tăng tăng trưởng & doanh thu.

## Nguyên tắc
1. **Không thêm feature tiền bạc nào trước khi xong Phase 0–2** (feature mới đứng trên danh tính + quota; nền sai thì feature nào cũng bị khai thác).
2. Mỗi PR nhỏ, có test hành vi (không test grep nội dung file).
3. Mọi route AI đi qua **một** wrapper: `withAuth → withQuota → withBudget → zod validate`.
4. Fail-closed mặc định: thiếu secret/config → từ chối, không "sandbox".

---

## Phase 0 — Cầm máu (Hôm nay, ~2–3h)
| PR | Việc | Mã lỗi | Done khi |
|---|---|---|---|
| P0-1 | Rotate Supabase `service_role` key; thay `.env.example` bằng placeholder; `git filter-repo --invert-paths --path .env.example`; force-push; thêm gitleaks vào CI + pre-commit | C1 | Key cũ vô hiệu; gitleaks pass; kiểm tra log Supabase xem có truy cập lạ |
| P0-2 | Xoá `x-bypass-quota` ở `reading/route.ts` và `clarifier/route.ts` | C2 | grep `x-bypass-quota` = 0 |
| P0-3 | Xoá `PUT /api/payment` + nút "Xác nhận thủ công (Test webhook)" ở `WalletPayOSModal.tsx` | C3 | PUT trả 405; UI không còn nút |
| P0-4 | `verifyPayOsWebhookData` fail-closed: thiếu `checksumKey` → `verified:false`; sandbox chỉ khi `NODE_ENV!=='production' && PAYOS_SANDBOX==='true'`; sửa test `payos_integration.test.ts:41` | C4 | Test: payload không chữ ký bị reject |
| P0-5 | Webhook: 404 nếu order lạ; bắt buộc `code==='00'`; so `amount` với `amountVnd` đã lưu; `starsToCredit` lấy từ package đã lưu | C5 | Test 4 case: order lạ / code≠00 / sai amount / replay |
| P0-6 | Xoá `reset_demo_quota` | C6 | action trả 400 |
| P0-7 | Xoá default `'tarot_bypass'` ở `middleware.ts`; thiếu env → tắt bypass | H6 | grep = 0 |
| P0-8 | Sửa Rules-of-Hooks `/reading/story` (đưa 2 `useMemo` lên trước early return) | C8 | Không còn màn trắng khi rehydrate |

**Sau P0:** rà `star_transactions` tìm Stars bất thường đã mint; nếu cần thì điều chỉnh/reset ví.

---

## Phase 1 — Nền tảng Auth & Ownership (Tuần 1)
Gốc rễ của H1–H5, H10, C7: không có danh tính thật.

1. **Session ẩn danh có ký**: cookie `tc_sid` httpOnly + Secure + SameSite=Lax, giá trị là id opaque + HMAC (`SESSION_SECRET`). Khách vãng lai vẫn dùng được (giữ funnel), nhưng id do server cấp, không phải header client tự khai. IP chỉ làm tín hiệu chống abuse.
2. **Đăng nhập thật (Supabase Auth)**: Google + magic link. Liên kết `tc_sid` → `user_id` khi đăng nhập (merge ví/lịch sử). Quota "tài khoản free" trong plan gốc cần cái này.
3. **Ownership**: thêm `owner_id` cho `readings`, `couple_rooms`, `followups`; mọi GET/PUT kiểm owner. `readingId` trong URL share chuyển sang `shareToken` riêng, chỉ trả bản **công khai đã lọc** (không có `questionText`, followup). (H1, H2)
4. **Gate admin**: dùng `isAdminRequest`, fail-closed khi thiếu `ADMIN_SECRET`; chặn `(admin)/layout.tsx` và `funnel/budget/unitEconomics`. (H3)
5. **Chuyển state ra Postgres/Redis** (Supabase + Upstash): quota, wallet, idempotency, rate limit. Bỏ `globalThis`. Giao dịch Stars dùng bảng ledger append-only + unique `(order_code)` + RPC atomic. (H10)
6. **Zod cho mọi route mutating** (dùng lại `CoupleReadingRequestSchema`, `ClarifierRequestSchema`). (M7)

**Done khi:** test e2e "user A không đọc/ghi được reading của user B"; cold start không reset quota.

---

## Phase 2 — Khoá kinh tế (Tuần 1–2)
1. **Wrapper `guardAiRoute()`** áp cho `reading`, `clarifier`, `followup`, `couple` (2 chỗ gọi Gemini), `growth`: auth → quota → trừ Stars atomic → `DAILY_AI_BUDGET_VND` → gọi AI → hoàn Stars nếu AI lỗi. (C7, H11)
2. **Couple**: chặn `join_room` khi `completed`; mỗi lượt AI tính quota cho owner. (C7)
3. **Referral**: bảng `referral_codes` thật; mỗi người dùng 1 lần; người giới thiệu cần tài khoản đã xác thực; thưởng chỉ khi người được mời hoàn thành 1 reading; chống tự giới thiệu theo thiết bị/IP. (H4, M10)
4. **Rewarded ad / share bonus**: chỉ cộng khi có token xác nhận từ ad provider hoặc sự kiện share đã verify; có trần/ngày; bỏ ghi doanh thu quảng cáo giả. (H5, M10)
5. **Chống prompt injection**: dùng `sanitizedText`, bọc input bằng delimiter an toàn + escape tag; giới hạn độ dài. (M8)
6. **Dashboard chi phí**: chi Gemini/ngày, chi/user, cảnh báo Telegram khi vượt 80% budget.

**Done khi:** script "attacker" (lặp lại mọi lỗ hổng C2–C7, H4–H5) đều bị chặn, chạy trong CI.

---

## Phase 3 — Hiệu năng & chất lượng (Tuần 2–3)
| Việc | Mục tiêu |
|---|---|
| `next/dynamic` cho three.js, gsap, lenis, framer-motion; chỉ load ở route cần (H7) | First Load JS `/reading/reader/[slug]` 439 kB → ≤150 kB |
| Tách dataset 78 lá: chỉ ship id/ảnh ở client, nội dung chi tiết lấy server/lazy theo lá (H8) | Bỏ 170KB khỏi bundle đầu |
| Bỏ `useSearchParams` ở root layout (đọc ở component lá + Suspense cục bộ) (H9) | Không còn double-mount/double-fetch |
| JSON-LD escape `<`; thêm CSP + `frame-ancestors`; bỏ tracker `http://localhost:4000` (M1, M2) | Không mixed content |
| Bỏ fallback `NEXT_PUBLIC_PAYOS_API_KEY` (M3) | Không secret trong client bundle |
| A11y: modal focus trap + Escape + khoá scroll (dùng Radix Dialog), label cho 14 input, sửa arrow-key handler ở window (M4–M6) | Lighthouse a11y ≥ 95 |
| `isUnder18` dùng `CURRENT_REFERENCE_YEAR`; `clearAllJournal()` thay `localStorage.clear()` (M9, M11) | — |
| `npm audit fix` (vitest, next/postcss) trên nhánh riêng + chạy lại build/test (M12) | 0 critical/high |
| Test: thêm jsdom + testing-library; thay assertion `toContain('gsap')` bằng test hành vi; đưa `tests/e2e_3d_journey` vào `testMatch`; xoá `expect(true)` (M13) | Coverage luồng thanh toán/quota/ownership ≥ 80% |

---

## Phase 4 — Feature mới (Tuần 3–6)
Ưu tiên theo: tăng trưởng viral > doanh thu > giữ chân. Mỗi feature đã đi qua `guardAiRoute()` và có chi phí AI ước tính.

### F1. Spiritual Wrapped (ưu tiên cao — viral)
Tổng kết tuần/tháng/năm: lá bài xuất hiện nhiều nhất, chủ đề hay hỏi, "năng lượng" của bạn; xuất card 9:16 để share TikTok/Threads. Dữ liệu lấy từ journal có sẵn, chỉ 1 lần gọi AI/kỳ → rẻ. Free xem bản tóm tắt, Pro xem bản đầy đủ.

### F2. Daily Card + Streak + Web Push
Mỗi ngày 1 lá miễn phí (không AI, dùng nội dung có sẵn), streak, nhắc qua PWA push. Kéo người dùng quay lại; chỉ nâng cấp lên giải nghĩa AI bằng Stars.

### F3. Couple Mode 2.0
Rút bài đồng bộ real-time (Supabase Realtime), hai người cùng thấy, thêm "độ hợp" + câu hỏi cho nhau; share link mời có `shareToken`. Quota tính cho owner (fix C7 trước).

### F4. Gói Pro / Subscription
Gộp Stars lẻ thành gói tháng (đã có `vip_month_69k`): follow-up nhiều hơn, 78 lá không giới hạn, tắt quảng cáo. Webhook PayOS đã verify + gia hạn thủ công bằng nhắc nhở (chưa auto-renew ở MVP).

### F5. Reader Personas mở rộng + Voice
Thêm persona theo mùa/sự kiện (Halloween, Valentine); TTS đọc kết quả (gói Pro). Bán theo Stars.

### F6. Nhật ký & Theo dõi kết quả ("Tarot có đúng không?")
Sau N ngày hỏi người dùng sự việc có xảy ra không → thống kê cá nhân. Tăng gắn bó, dữ liệu để cải thiện prompt.

### F7. Chia sẻ & Referral thật
Card kết quả có QR/link mời; đạt mốc referral thật (Phase 2) → nhận Stars. Gắn UTM để đo kênh TikTok/Threads/IG.

### F8. Hộp công cụ Admin
Trang `(admin)`: funnel, doanh thu, chi AI, danh sách giao dịch đáng ngờ, nút khoá user. Dùng lại dữ liệu H3 đã được bảo vệ.

**Thứ tự đề xuất:** F2 → F1 → F7 → F3 → F4 → F6 → F5 → F8.

---

## Lịch tổng
| Tuần | Nội dung |
|---|---|
| Hôm nay | Phase 0 |
| Tuần 1 | Phase 1 (session, ownership, admin gate, state ra DB) |
| Tuần 1–2 | Phase 2 (guardAiRoute, referral/ads, injection, budget) |
| Tuần 2–3 | Phase 3 (perf, a11y, CSP, test, audit) |
| Tuần 3–4 | F2 + F1 |
| Tuần 5–6 | F7 + F3 + F4 |

**Cổng go-live:** chỉ mở thanh toán thật & quảng bá TikTok/Threads sau khi Phase 0–2 xong và bộ "attacker test" xanh.

---

## Prompt mẫu giao cho AI coding agent (Phase 0)
```
Bạn đang làm việc trên repo TarotCouple (Next.js App Router). Thực hiện lần lượt, mỗi mục một commit:
1. Xoá nhánh x-bypass-quota ở src/app/api/reading/route.ts và src/app/api/clarifier/route.ts.
2. Xoá handler PUT trong src/app/api/payment/route.ts và nút "Xác nhận chuyển khoản thủ công" ở WalletPayOSModal.tsx.
3. src/lib/payos.ts: verifyPayOsWebhookData phải fail-closed khi thiếu checksumKey; sandbox chỉ khi NODE_ENV!=='production' && PAYOS_SANDBOX==='true'. Cập nhật tests/payos_integration.test.ts.
4. src/app/api/pay/webhook/route.ts: reject order không tồn tại (404), yêu cầu data.code==='00', so amount với amountVnd đã lưu, lấy starsToCredit từ package đã lưu.
5. Xoá action reset_demo_quota ở quota-store.ts và route reading.
6. middleware.ts: bỏ default 'tarot_bypass'.
7. reading/story/page.tsx: đưa các useMemo lên trước early return.
Với mỗi mục viết test hành vi (vitest) chứng minh lỗ hổng cũ không còn tái hiện. Chạy tsc --noEmit, npm run build, vitest trước khi báo xong. Không đụng vào việc khác.
```
