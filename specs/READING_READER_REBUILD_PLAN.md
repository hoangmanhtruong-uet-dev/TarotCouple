# 🔮 Tarot Couple — Đặc Tả Chi Tiết Rebuild Frontend: Trang Reading / Reader

**Ngày tạo:** 23/10/2026 · **Tác giả:** AI Architect  
**Phạm vi:** Rebuild toàn bộ UI/UX, hiệu ứng, logic và tính năng mới cho flow `/reading/*` và `/reading/reader/*`

---

## Mục lục

1. [Tổng quan hiện trạng & Vấn đề](#1-tổng-quan-hiện-trạng--vấn-đề)
2. [Mục tiêu Rebuild](#2-mục-tiêu-rebuild)
3. [Kiến trúc Trang & Routing](#3-kiến-trúc-trang--routing)
4. [UI/UX Redesign — Reader Profile Page](#4-uiux-redesign--reader-profile-page)
5. [UI/UX Redesign — Reading Flow (Stepper)](#5-uiux-redesign--reading-flow-stepper)
6. [Hệ thống Hiệu ứng & Animation](#6-hệ-thống-hiệu-ứng--animation)
7. [Tính năng mới — Reader Page](#7-tính-năng-mới--reader-page)
8. [Tính năng mới — Reading Flow](#8-tính-năng-mới--reading-flow)
9. [Logic & State Management](#9-logic--state-management)
10. [Performance & Bundle Optimization](#10-performance--bundle-optimization)
11. [Responsive & Mobile-First](#11-responsive--mobile-first)
12. [Accessibility (A11y)](#12-accessibility-a11y)
13. [Component Architecture](#13-component-architecture)
14. [Phân pha triển khai](#14-phân-pha-triển-khai)

---

## 1. Tổng quan hiện trạng & Vấn đề

### 1.1 Cấu trúc hiện tại
```
src/app/(reading)/
├── layout.tsx          — Layout chung + Stepper 4 bước
├── template.tsx        — Template wrapper
└── reading/
    ├── reader/
    │   ├── page.tsx        — Redirect → /reader/[slug]
    │   └── [slug]/page.tsx — Server component, render ReaderProfileViewLazy
    ├── chu-de/page.tsx     — Bước 2a: Chọn chủ đề
    ├── noi-niem/page.tsx   — Bước 2b: Nhập tâm sự
    ├── bo-bai/page.tsx     — Bước 2c: Chọn bộ bài
    ├── ve-ban/page.tsx     — Intro về bạn
    ├── tam-su/page.tsx     — Tâm sự chi tiết
    ├── rut-bai/page.tsx    — Bước 3: Rút 3 lá
    ├── ket-qua/page.tsx    — Bước 4: Kết quả AI
    └── story/page.tsx      — Xem Story Card 9:16
```

### 1.2 Vấn đề chính cần giải quyết

| # | Vấn đề | Mức độ | Ghi chú |
|---|--------|--------|---------|
| P1 | **ReaderProfileView.tsx quá lớn** (1252 dòng, monolithic) | 🔴 Critical | Khó maintain, test, lazy-load |
| P2 | **Bundle size quá nặng** — Three.js, GSAP, Framer Motion load cùng lúc | 🔴 Critical | First Load JS ~439KB |
| P3 | **Stepper UI cứng nhắc** — không có animation chuyển bước, không responsive tốt trên mobile nhỏ | 🟡 High | UX kém trên 360px |
| P4 | **Thiếu micro-interactions** — chuyển trang không có transition, các card không có hover/tap feedback đủ tốt | 🟡 High | Cảm giác "flat" |
| P5 | **Không có skeleton loading** — chỉ có text "Đang chuẩn bị..." | 🟡 High | Perceived performance kém |
| P6 | **Reader gallery không có** — user phải biết slug, không có trang browse tất cả readers | 🟡 High | Discovery kém |
| P7 | **Thiếu swipe gesture** trên mobile cho reader carousel, card fan | 🟠 Medium | Touch UX kém |
| P8 | **Sound effects rời rạc** — không có hệ thống audio cohesive | 🟠 Medium | Immersion thiếu |
| P9 | **Couple mode UX chưa tốt** — chỉ có link ở footer, không integrate vào flow chính | 🟠 Medium | Feature discovery kém |
| P10 | **Không có dark/light theme toggle** — chỉ có dark | 🟢 Low | Phù hợp thể loại, ưu tiên thấp |

---

## 2. Mục tiêu Rebuild

### 2.1 North Star Metrics
- **First Contentful Paint (FCP):** < 1.2s
- **Largest Contentful Paint (LCP):** < 2.5s  
- **First Load JS (Reader page):** ≤ 150KB (giảm từ ~439KB)
- **Interaction to Next Paint (INP):** < 200ms
- **Lighthouse Performance:** ≥ 90
- **Lighthouse Accessibility:** ≥ 95

### 2.2 UX Goals
- **"Mystical Immersion"** — Mỗi tương tác phải có cảm giác huyền bí, purposeful
- **"One-Thumb Reachable"** — 100% thao tác chính trong thumb zone trên mobile
- **"3-Second Reader Pick"** — Từ lúc vào trang reader đến lúc chọn xong ≤ 3 tương tác
- **"Seamless Flow"** — Chuyển giữa các bước mượt mà, không có "hard cut"

---

## 3. Kiến trúc Trang & Routing

### 3.1 Routing mới (đề xuất)
```
src/app/(reading)/
├── layout.tsx              — Shared layout (stepper + ambient bg)
├── template.tsx            — Page transition wrapper (Framer AnimatePresence)
└── reading/
    ├── reader/
    │   ├── page.tsx            — ✨ MỚI: Reader Gallery (browse all readers)
    │   └── [slug]/
    │       ├── page.tsx        — Reader Profile (server component + client islands)
    │       └── loading.tsx     — ✨ MỚI: Skeleton loader cho reader profile
    ├── chu-de/
    │   ├── page.tsx            — Chọn chủ đề + nhập tâm sự (gộp flow)
    │   └── loading.tsx
    ├── rut-bai/
    │   ├── page.tsx            — Ritual rút bài (3D card fan + haptic)
    │   └── loading.tsx
    ├── ket-qua/
    │   ├── page.tsx            — Kết quả AI (reveal animation)
    │   ├── loading.tsx
    │   └── [id]/page.tsx       — ✨ MỚI: Xem lại kết quả cũ bằng shareToken
    └── story/
        ├── page.tsx            — Story Card editor & share
        └── loading.tsx
```

### 3.2 Thay đổi chính
| Hiện tại | Sau rebuild | Lý do |
|----------|-------------|-------|
| 5 sub-pages cho Step 2 (ve-ban, tam-su, chu-de, noi-niem, bo-bai) | **1 page** `chu-de/` với internal tabs/stepper | Giảm friction, giữ context |
| `/reader/page.tsx` chỉ redirect | **Reader Gallery** page — grid/carousel tất cả readers | Discovery, browsable |
| Không có loading.tsx | **Skeleton loaders** cho mỗi route segment | Perceived performance |
| Stepper hard-coded 4 step | **Dynamic stepper** có sub-step indicator + progress bar animated | Flexibility |

---

## 4. UI/UX Redesign — Reader Profile Page (`/reading/reader/[slug]`)

### 4.1 Layout Structure (Mobile-First)

```
┌─────────────────────────────┐
│       AMBIENT HEADER        │  ← Particle canvas + reader accent glow
│   [← Back]  Reader Name    │
├─────────────────────────────┤
│                             │
│    ┌───────────────────┐    │
│    │                   │    │
│    │   3D TAROT CARD   │    │  ← Signature card, flip-able
│    │   (Signature)     │    │
│    │                   │    │
│    └───────────────────┘    │
│                             │
│    ✦ keyword1  ✦ keyword2   │  ← Animated reveal tags
│         ✦ keyword3          │
│                             │
├─────────────────────────────┤
│                             │
│   READER NAME               │
│   "Title / Role"            │  ← Editorial serif typography
│   ● Sẵn sàng tiếp đón      │
│                             │
│   ┌─────┬─────┬─────┐      │
│   │Totem│Sound│Style│      │  ← 3 info cards (tappable)
│   └─────┴─────┴─────┘      │
│                             │
│   "Sample quote..."         │  ← Expandable quote + sample reading
│   [Thử giọng đọc →]        │
│                             │
│   ┌──────────┬──────────┐   │
│   │ ✓ Hợp    │ ✗ Không  │   │  ← Compatibility cards
│   │   với    │   hợp    │   │
│   └──────────┴──────────┘   │
│                             │
│   CHUYÊN MÔN & TƯƠNG THÍCH │
│   ████████░░ 85% Tình duyên│  ← Animated progress bars
│   ██████░░░░ 72% Sự nghiệp │
│   ████░░░░░░ 60% Tài chính │
│                             │
│   ┌─── REVIEW CAROUSEL ──┐ │  ← ✨ MỚI: User reviews
│   │ "Bà bói chuẩn quá!"  │ │
│   │ ★★★★★  — @user123     │ │
│   └───────────────────────┘ │
│                             │
├─────────────────────────────┤
│ [★ Vào Lều Reader_Name ★]  │  ← Fixed CTA bottom bar
│  ♥ Muốn bói đôi? →         │
└─────────────────────────────┘
```

### 4.2 Desktop Layout (≥1024px)
- **2-column grid (5/12 + 7/12)** — giữ nguyên tỷ lệ hiện tại nhưng:
  - Cột trái: 3D Card + keywords — **sticky** khi scroll
  - Cột phải: Editorial dossier — scrollable
  - Thêm **parallax subtle** khi scroll

### 4.3 Design Tokens mới

```css
/* Reader Profile Design Tokens */
--rp-bg-primary: #09080D;
--rp-bg-secondary: #0E0D17;
--rp-bg-card: #14111C;
--rp-border: #262235;
--rp-border-hover: #3B354D;
--rp-text-primary: #F8F5F0;
--rp-text-secondary: #9E96B0;
--rp-text-muted: #5E5873;
--rp-gold: #C9A24A;
--rp-gold-light: #E5C687;
--rp-radius-sm: 8px;
--rp-radius-md: 16px;
--rp-radius-lg: 24px;
--rp-shadow-glow: 0 0 40px var(--reader-accent, #C9A24A);

/* Typography Scale */
--rp-font-display: 'Playfair Display', serif;
--rp-font-body: 'Inter', system-ui, sans-serif;
--rp-text-hero: clamp(2rem, 5vw, 3.5rem);
--rp-text-title: clamp(1.25rem, 3vw, 2rem);
--rp-text-body: clamp(0.8125rem, 2vw, 0.9375rem);
--rp-text-caption: clamp(0.625rem, 1.5vw, 0.75rem);
```

### 4.4 Component Breakdown (thay thế monolithic ReaderProfileView.tsx)

```
ReaderProfileView (1252 lines)  →  Tách thành:

components/reader/
├── ReaderProfilePage.tsx          — Container/orchestrator (~100 lines)
├── ReaderAmbientCanvas.tsx        — Particle/glow background (~80 lines)
├── ReaderSignatureCard3D.tsx      — 3D flippable card (lazy-loaded) (~150 lines)
├── ReaderKeywordTags.tsx          — Animated keyword badges (~40 lines)
├── ReaderEditorialHeader.tsx      — Name, title, status badge (~60 lines)
├── ReaderInfoCards.tsx            — Totem, Sound, Spread style (~80 lines)
├── ReaderQuoteSection.tsx         — Quote + sample reading expand (~90 lines)
├── ReaderCompatibilityCards.tsx   — Hợp / Không hợp cards (~50 lines)
├── ReaderMasteryBars.tsx          — Animated progress bars (~70 lines)
├── ReaderReviewCarousel.tsx       — ✨ MỚI: User testimonials (~100 lines)
├── ReaderBottomCTA.tsx            — Fixed bottom action bar (~80 lines)
└── ReaderProfileSkeleton.tsx      — Loading skeleton (~60 lines)
```

---

## 5. UI/UX Redesign — Reading Flow (Stepper)

### 5.1 Stepper Redesign

**Hiện tại:** Thanh ngang 4 bước với chấm tròn + connector lines, sub-step dots  
**Sau rebuild:**

```
┌─────────────────────────────────────┐
│  ← Back        Step 2 / 4          │  ← Compact mobile header
│  ═══════════════■■■■░░░░░░░░░░░░░  │  ← Continuous progress bar (accent color)
│  Chọn Reader → Tâm sự → Rút → KQ  │  ← Text labels (chỉ show current + next)
└─────────────────────────────────────┘
```

**Đặc điểm mới:**
- **Continuous progress bar** thay vì discrete steps — mượt hơn, thấy tiến trình rõ
- **Gradient fill** dùng `--reader-accent` color
- **Auto-collapse** trên mobile nhỏ: chỉ hiện step hiện tại + progress %
- **Micro-animation:** Progress bar fill có spring easing khi chuyển step
- **Back gesture:** Swipe right để quay lại step trước (mobile)

### 5.2 Page Transitions

```typescript
// template.tsx — Page transition config
const pageTransitionVariants = {
  initial: { opacity: 0, x: 30, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: -30, filter: 'blur(4px)' },
};

// Transition timing
const transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};
```

### 5.3 Từng Step — UI Redesign

#### Step 1: Reader Gallery (MỚI — `/reading/reader`)

```
┌───────────────────────────────┐
│   🔮 Chọn người đọc bài      │
│   "Mỗi Reader mang một       │
│    năng lượng riêng..."       │
│                               │
│  ┌─────────┐ ┌─────────┐     │
│  │ Avatar  │ │ Avatar  │     │  ← Horizontal scroll carousel
│  │ Bà Ngoại│ │ Tiên Tử │     │     hoặc Grid 2x2
│  │ ★★★★★  │ │ ★★★★☆  │     │
│  │[Xem ▸]  │ │[Xem ▸]  │     │
│  └─────────┘ └─────────┘     │
│  ┌─────────┐ ┌─────────┐     │
│  │ Tổng Tài│ │ Pháp Sư │     │
│  │ ★★★★☆  │ │ ★★★★★  │     │
│  │[Xem ▸]  │ │[Xem ▸]  │     │
│  └─────────┘ └─────────┘     │
│                               │
│  🎲 Để vũ trụ chọn giúp?     │  ← Random reader button
│  [Chọn ngẫu nhiên ✨]         │
└───────────────────────────────┘
```

**Đặc điểm:**
- Mỗi reader card có: avatar/icon, tên, badge, tagline ngắn, accent color border
- **Hover/tap effect:** Card nhẹ nhàng nổi lên + glow accent color
- **Swipe** để browse trên mobile
- **"Chọn ngẫu nhiên"** button với spin animation

#### Step 2: Tâm Sự (Gộp chu-de + noi-niem + bo-bai)

```
┌───────────────────────────────┐
│  Reader Avatar mini + name    │  ← Context: reader đã chọn
│                               │
│  ── Chọn chủ đề ──           │
│  ┌────────┐┌────────┐        │
│  │💕 Tình │ │📚 Công │        │  ← 3 topic cards, tap to select
│  │ duyên  │ │ việc   │        │
│  └────────┘└────────┘        │
│  ┌────────┐                   │
│  │🍀 Vận  │                   │
│  │  may   │                   │
│  └────────┘                   │
│                               │
│  ── Tâm sự với Reader ──     │
│  ┌──────────────────────┐    │
│  │ Viết tâm sự của bạn  │    │  ← Textarea với character count
│  │ (tối đa 300 ký tự)   │    │     Auto-grow, glow border on focus
│  │                      │    │
│  │                 78/300│    │
│  └──────────────────────┘    │
│                               │
│  ── Chọn bộ bài ──           │  ← Nếu có nhiều bộ, nếu không auto-select
│  ○ Rider-Waite Classic       │
│  ○ Full 78 lá (Premium)      │
│                               │
│  [Tiếp tục → Rút bài ✨]     │  ← CTA, disabled nếu chưa chọn topic
└───────────────────────────────┘
```

**Logic mới:**
- **Progressive disclosure:** Topic → Textarea hiện ra → Bộ bài tự chọn
- **Smart placeholder** trong textarea thay đổi theo topic đã chọn
- **Character counter** đổi màu khi gần giới hạn
- **Auto-save draft** vào sessionStorage

#### Step 3: Rút Bài (Ritual)

```
┌───────────────────────────────┐
│                               │
│   "Hít thở sâu...            │
│    Để trực giác dẫn lối"      │  ← Ritual intro text (fade in/out)
│                               │
│        ┌─┐┌─┐┌─┐┌─┐          │
│       ┌┤ ├┤ ├┤ ├┤ ├┐         │  ← Card fan / arc spread
│      ┌┤ ├┤ ├┤ ├┤ ├┤ ├┐       │     22/78 cards face-down
│     ┌┤ ├┤ ├┤ ├┤ ├┤ ├┤ ├┐     │     Swipe/tap to select
│     └─┘└─┘└─┘└─┘└─┘└─┘└─┘    │
│                               │
│   Đã chọn: ■ ■ □              │  ← 3 slot indicator
│   Lá 1: ✓  Lá 2: ✓  Lá 3: ?  │
│                               │
│   ┌─────┐  ┌─────┐  ┌───┐    │  ← Selected cards preview (mini)
│   │Card1│  │Card2│  │ ? │    │
│   └─────┘  └─────┘  └───┘    │
│                               │
│   [Lật bài & Xem kết quả 🔮] │  ← Enabled khi chọn đủ 3
└───────────────────────────────┘
```

**Hiệu ứng ritual:**
- **Breathing guide:** Vòng tròn phát sáng nhịp thở trước khi hiện bài
- **Card spread animation:** Bài tung ra từ deck thành arc fan
- **Selection haptic:** Rung nhẹ khi chạm chọn lá (Vibration API)
- **Hold-to-confirm:** Giữ 1.5s trên lá để xác nhận (progress ring quanh ngón tay)
- **Card flip reveal:** Lá lật 3D reveal mặt trước khi chọn xong
- **Ambient sound:** Shuffle sound khi xào, chime khi chọn

#### Step 4: Kết Quả

```
┌───────────────────────────────┐
│   ✨ KẾT QUẢ TỪ [READER] ✨  │
│                               │
│   ── Lời mở đầu ──           │  ← Typewriter effect
│   "Hmm... tao thấy mày..."   │
│                               │
│   ── 3 Lá Của Bạn ──         │
│   ┌─────┐ ┌─────┐ ┌─────┐   │  ← Staggered flip reveal
│   │ Lá1 │ │ Lá2 │ │ Lá3 │   │     + position labels
│   │     │ │     │ │     │   │
│   └─────┘ └─────┘ └─────┘   │
│   Năng    Đối     Kết        │
│   lượng   phương  cục        │
│                               │
│   ── Giải nghĩa từng lá ──   │
│   📖 Lá 1: The Lovers (Xuôi) │  ← Expandable accordion
│   "Năng lượng của bạn đang..."│
│                               │
│   ── Chốt hạ ──              │
│   "Tóm lại là..."            │  ← Bold, accent color
│                               │
│   ── Câu savage ──           │
│   ╔═══════════════════════╗  │  ← Highlight box
│   ║ "Đừng có ngồi đợi    ║  │     Swipe để đổi (3 options)
│   ║  tin nhắn nữa..."    ║  │
│   ╚═══════════════════════╝  │
│   ← 1/3 →                    │  ← Quote selector dots
│                               │
│   ⚠️ Tarot chỉ là giải trí  │  ← Disclaimer
│                               │
│   [📱 Chia sẻ Story Card]    │  ← Primary CTA
│   [🔮 Lá làm rõ — 5K ⭐]    │  ← Clarifier upsell
│   [💬 Hỏi thêm Reader]       │  ← Follow-up chat
│   [🏠 Về trang chủ]          │
└───────────────────────────────┘
```

**Hiệu ứng kết quả:**
- **Typewriter effect** cho greeting hook — từng ký tự hiện ra
- **Staggered card reveal** — lá 1 lật trước → delay 0.5s → lá 2 → lá 3
- **Scroll-triggered animations** cho mỗi section (fade up + blur)
- **Quote swiper** — swipe hoặc tap dots để đổi savage_quote
- **Confetti burst** nhẹ khi kết quả hoàn tất
- **Sound:** Mystical reveal chord khi lá lật

---

## 6. Hệ thống Hiệu ứng & Animation

### 6.1 Animation Stack (tinh gọn)

| Thư viện | Dùng cho | Load strategy |
|----------|----------|---------------|
| **Framer Motion** | Page transitions, UI micro-interactions, layout animations | Import tĩnh (nhẹ ~30KB) |
| **CSS Animations/Transitions** | Hover states, focus rings, progress bars, shimmer | Native, 0 JS overhead |
| **Three.js (R3F)** | 3D card flip, particle canvas | `next/dynamic` lazy load, chỉ ở reader profile |
| **GSAP** | ❌ **LOẠI BỎ** — thay bằng Framer Motion + CSS | Giảm ~50KB |
| **Lenis** | ❌ **LOẠI BỎ** — dùng native `scroll-behavior: smooth` | Giảm ~10KB |

### 6.2 Catalog Hiệu ứng

#### Ambient Effects
| Effect | Mô tả | Trigger | Component |
|--------|--------|---------|-----------|
| **Particle Float** | Các hạt nhỏ trôi chậm, màu accent reader | Luôn chạy khi ở reader page | `ReaderAmbientCanvas` |
| **Accent Glow** | Vùng sáng mờ gradient ở background theo accent color | Luôn chạy | CSS `radial-gradient` |
| **Star Field** | Các ngôi sao nhỏ nhấp nháy ở background chung | Luôn chạy trên reading flow | CSS `@keyframes twinkle` |

#### Interaction Effects  
| Effect | Mô tả | Trigger | Implementation |
|--------|--------|---------|----------------|
| **Card Hover Lift** | Card nhẹ nhàng nổi lên 4px + shadow increase | Hover/Focus | CSS `transform + box-shadow transition` |
| **Tap Ripple** | Ripple effect từ điểm chạm | Touch/Click on buttons | CSS `::after` pseudo + animation |
| **Button Glow Pulse** | CTA button phát sáng nhịp nhàng | Idle state of primary CTA | CSS `@keyframes glow-pulse` |
| **Progress Fill** | Progress bar fill với spring easing | Step change | Framer Motion `animate` |
| **Tag Stagger In** | Keywords xuất hiện lần lượt | Scroll into view | Framer Motion `staggerChildren` |

#### Transition Effects
| Effect | Mô tả | Trigger | Implementation |
|--------|--------|---------|----------------|
| **Page Slide + Blur** | Trang hiện tại blur+slide trái, trang mới slide+blur phải | Navigate between steps | Framer `AnimatePresence` |
| **Card Flip 3D** | Lá bài lật 180° quanh trục Y | User taps to flip / reveal | CSS `transform: rotateY()` hoặc R3F |
| **Stagger Reveal** | Nhiều elements hiện lần lượt từ dưới lên | Section enters viewport | Framer `staggerChildren + IntersectionObserver` |
| **Typewriter** | Text hiện từng ký tự | Kết quả AI stream | Custom hook `useTypewriter` |
| **Morph Number** | Số % đếm lên animated | Progress bars enter view | Framer `useMotionValue + animate` |

#### Sound Effects
| Sound | Trigger | File |
|-------|---------|------|
| `shuffle.mp3` | Bắt đầu rút bài ritual | Existing |
| `card-select.mp3` | Chọn 1 lá | Existing |
| `reveal-chime.mp3` | Lá lật reveal | Existing |
| `persona-chord.mp3` | Bấm nghe tần số reader | Existing |
| `success.mp3` | ✨ MỚI: Hoàn thành reading | New |
| `tap-soft.mp3` | ✨ MỚI: General button tap | New |

### 6.3 Performance Rules cho Animations
1. **Chỉ animate `transform` và `opacity`** — tránh layout/paint triggers
2. **`will-change`** chỉ set khi animation sắp chạy, remove sau khi xong
3. **`prefers-reduced-motion`** — tắt tất cả animation/particle, giữ instant state changes
4. **Particle canvas** dùng `OffscreenCanvas` nếu browser hỗ trợ
5. **Three.js dispose** — cleanup geometry/material/texture khi unmount

---

## 7. Tính năng mới — Reader Page

### F-R1: Reader Gallery / Browse Page
- **Route:** `/reading/reader` (thay thế redirect hiện tại)
- **Mô tả:** Grid/carousel tất cả readers, mỗi reader là 1 card nhỏ
- **Filter:** Theo phong cách (Sắc bén / Chữa lành / Lý trí / Huyền bí)
- **Sort:** Phổ biến nhất / Mới nhất / Ngẫu nhiên
- **UX:** Tap card → navigate to `/reading/reader/[slug]`

### F-R2: Reader Comparison
- **Trigger:** Long-press hoặc checkbox trên 2 reader cards
- **UI:** Bottom sheet so sánh side-by-side 2 readers (specialties, quote, accent)
- **Goal:** Giúp user quyết định nhanh hơn

### F-R3: "Vũ Trụ Chọn Giúp" — Random Reader
- **Button** trên gallery page
- **Animation:** Spin roulette qua tất cả readers → dừng ở reader ngẫu nhiên
- **Sound:** Wheel spin → ding khi dừng
- **Auto-navigate** sau 2s delay

### F-R4: Reader Testimonials / Reviews
- **Section** cuối reader profile page
- **Data:** Hardcoded ban đầu, sau lấy từ Supabase
- **UI:** Horizontal scroll carousel, mỗi review có avatar, tên, rating, text
- **Animation:** Slide in từ phải

### F-R5: Reader "Thẻ Năng Lượng Hôm Nay"
- **Mô tả:** Mỗi reader có 1 lá bài đại diện năng lượng ngày hôm nay (random seed = date)
- **UI:** Small card widget ở đầu reader profile
- **Goal:** Tạo lý do quay lại xem hàng ngày, tăng engagement

### F-R6: Couple Mode Quick Entry
- **Hiện tại:** Chỉ có link nhỏ ở footer bottom bar
- **Sau rebuild:** 
  - Toggle switch ở đầu reader profile: "Solo 🔮 / Đôi 💕"
  - Khi bật Couple: UI thay đổi — hiện 2 avatar slots, invite link generator
  - Reader gallery cũng có filter "Hợp bói đôi"

---

## 8. Tính năng mới — Reading Flow

### F-F1: Smart Topic Suggestions
- Dựa trên giờ trong ngày + reader đã chọn → gợi ý topic
  - 22h-2h + Bà Ngoại → "Tình duyên" highlight
  - Sáng + Tổng Tài → "Công việc" highlight
- UI: Badge "Gợi ý ✨" trên topic card phù hợp

### F-F2: Textarea Voice Input
- **Microphone button** cạnh textarea tâm sự
- Dùng Web Speech API (SpeechRecognition)
- Fallback: ẩn button nếu browser không hỗ trợ
- **Goal:** Reduce typing friction trên mobile

### F-F3: Ritual Breathing Guide
- Trước khi hiện bài rút: **3 nhịp thở** (hít 4s, giữ 4s, thở 4s)
- UI: Expanding/contracting circle + text guide
- **Skip button** sau 1 nhịp
- **Goal:** Tạo cảm giác ritual, immersion

### F-F4: Card Selection Undo
- Đã chọn 1 lá → có thể tap lại lá đó để bỏ chọn (trước khi submit)
- **Animation:** Card flip ngược lại vào deck
- **Limit:** Tối đa undo 2 lần để tránh gaming

### F-F5: Result Streaming (Typewriter)
- AI response stream real-time (SSE/streaming API)
- Kết quả hiện từng phần: greeting → card 1 analysis → card 2 → card 3 → verdict → quote
- **Progressive reveal** tạo cảm giác reader đang "đọc bài" live
- **Fallback:** Nếu non-streaming, dùng fake typewriter delay

### F-F6: Clarifier In-Context
- Nút "Hỏi rõ thêm" ngay dưới mỗi lá bài analysis
- Mở inline chat bubble (không phải modal riêng)
- Trừ Stars khi gửi câu hỏi clarifier
- **Max 3 clarifier questions** per reading

### F-F7: Reading History Quick Access
- Floating pill ở góc: "📜 3 readings gần đây"
- Tap mở → mini list → tap item → navigate đến kết quả cũ
- Lưu trong localStorage + sync Supabase khi logged in

### F-F8: Story Card Preview Live
- Trên trang kết quả, thumbnail nhỏ ở góc cho thấy Story Card sẽ trông thế nào
- Tap để mở full Story Card editor/share page
- **Goal:** Tăng share conversion

---

## 9. Logic & State Management

### 9.1 Reading Store Redesign

```typescript
// lib/reading-store.ts — Zustand store (restructured)
interface ReadingState {
  // Step tracking
  currentStep: 1 | 2 | 3 | 4;
  maxReachedStep: number;
  
  // Reader selection
  selectedReaderId: string;
  readerAccentColor: string;
  isCoupleMode: boolean;
  
  // Topic & question
  selectedTopic: 'tinh-duyen' | 'cong-viec' | 'van-may' | null;
  questionText: string;
  displayName: string;
  birthYear: number | null;
  
  // Deck & cards
  selectedDeckType: 'major-only' | 'full-78';
  selectedCardPositions: number[];  // max 3
  drawnCards: DrawnCard[];          // populated after server shuffle
  
  // Result
  readingId: string | null;
  resultJSON: ReadingResult | null;
  selectedQuoteIndex: number;
  
  // UI state
  isRitualComplete: boolean;
  isResultLoading: boolean;
  isResultStreaming: boolean;
  
  // Actions
  setReader: (id: string) => void;
  setTopic: (topic: string) => void;
  setQuestion: (text: string) => void;
  selectCardPosition: (pos: number) => void;
  undoCardSelection: (pos: number) => void;
  submitReading: () => Promise<void>;
  reset: () => void;
  goToStep: (step: number) => void;
}
```

### 9.2 Navigation Guards
```typescript
// Middleware-level guards trong (reading)/layout.tsx
const STEP_REQUIREMENTS = {
  '/reading/chu-de': () => !!store.selectedReaderId,
  '/reading/rut-bai': () => !!store.selectedTopic && store.questionText.length > 0,
  '/reading/ket-qua': () => store.drawnCards.length === 3,
  '/reading/story': () => !!store.resultJSON,
};
```

### 9.3 Session Persistence
- **sessionStorage** cho draft state (topic, question text) — mất khi đóng tab
- **localStorage** cho reading history, preferences
- **Supabase** cho authenticated users — sync readings, wallet

### 9.4 Error Boundaries
- Mỗi step page wrap trong `ErrorBoundary` riêng
- Fallback UI: "Đã có lỗi xảy ra" + "Thử lại" button + "Về trang chủ" link
- Sentry error tracking cho production

---

## 10. Performance & Bundle Optimization

### 10.1 Code Splitting Strategy

| Module | Hiện tại | Sau rebuild | Cách |
|--------|----------|-------------|------|
| Three.js + R3F | Loaded cùng page | **Lazy load** chỉ khi reader profile visible | `next/dynamic({ ssr: false })` |
| Framer Motion | Full import | **Tree-shake** chỉ import `motion`, `AnimatePresence` | Named imports |
| GSAP | ~50KB loaded | **Xóa hoàn toàn** | Replace với Framer + CSS |
| Lenis | ~10KB | **Xóa** | Native CSS smooth scroll |
| Tarot dataset (78 lá) | Full ~170KB in bundle | **Server-only** cho full data; client chỉ có id + image_url | API route |
| Sound files | Eager load | **Lazy load** khi user tương tác lần đầu | Dynamic import on interaction |

### 10.2 Image Optimization
- Card images: WebP format, responsive `srcset` (200w, 400w, 600w)
- Reader avatars: `next/image` với `blur` placeholder
- Priority loading: chỉ cho above-fold images

### 10.3 Font Optimization
- `next/font/google` cho Playfair Display + Inter
- `font-display: swap` 
- Subset: chỉ Latin + Vietnamese characters

---

## 11. Responsive & Mobile-First

### 11.1 Breakpoints

| Breakpoint | Target | Layout |
|------------|--------|--------|
| `< 360px` | Small phones | Single column, compact spacing, text truncate |
| `360–430px` | Standard phones | **Primary target** — full mobile layout |
| `431–768px` | Large phones / small tablets | Wider cards, bigger touch targets |
| `769–1024px` | Tablets | 2-column starts appearing |
| `> 1024px` | Desktop | Full 2-column layout, hover effects |

### 11.2 Thumb Zone Optimization
- **Primary CTA** luôn ở bottom (fixed bar hoặc bottom of viewport)
- **Navigation** ở top nhưng thin/compact
- **Card selection** ở middle — natural thumb area
- **Swipe gestures** cho horizontal navigation (reader carousel, quote selector)

### 11.3 Safe Area
- `env(safe-area-inset-bottom)` cho bottom bar trên iPhone notch
- `env(safe-area-inset-top)` cho status bar

---

## 12. Accessibility (A11y)

### 12.1 Requirements

| Requirement | Implementation |
|-------------|---------------|
| **Focus management** | Auto-focus vào content mới sau page transition |
| **Keyboard navigation** | Tab order logic cho stepper, card selection, buttons |
| **Screen reader** | `aria-label` cho tất cả icon buttons, `role="progressbar"` cho stepper |
| **Modal trap** | Focus trap trong modals (dùng Radix Dialog) |
| **Escape** | Close modal/sheet on Escape key |
| **Reduced motion** | `prefers-reduced-motion` → tắt animation, instant transitions |
| **Color contrast** | WCAG AA minimum (4.5:1 text, 3:1 large text) |
| **Touch target** | Minimum 44x44px cho tất cả interactive elements |
| **Skip link** | "Bỏ qua navigation" link ở đầu page |

---

## 13. Component Architecture

### 13.1 Shared UI Components (mới / cải tiến)

```
src/components/ui/
├── GlowButton.tsx          — Primary CTA button với glow effect
├── GhostButton.tsx         — Secondary/tertiary button
├── ProgressBar.tsx         — Animated progress bar (stepper)
├── SkeletonCard.tsx        — Loading skeleton cho card-shaped content
├── SkeletonText.tsx        — Loading skeleton cho text blocks
├── BottomSheet.tsx         — Mobile-friendly bottom sheet (thay modal)
├── SwipeCarousel.tsx       — Touch-friendly horizontal carousel
├── AnimatedCounter.tsx     — Number count-up animation
├── TypewriterText.tsx      — Typewriter text reveal effect
├── RippleButton.tsx        — Button với ripple effect on tap
├── FadeInView.tsx          — Wrapper: fade + slide in khi enter viewport
├── AccentGlow.tsx          — Background glow effect component
└── HapticButton.tsx        — Button trigger haptic feedback
```

### 13.2 File Structure tổng thể

```
src/
├── components/
│   ├── ui/                    — Shared UI primitives
│   ├── reader/                — Reader profile components
│   ├── reading/               — Reading flow components
│   │   ├── StepperBar.tsx
│   │   ├── TopicSelector.tsx
│   │   ├── QuestionInput.tsx
│   │   ├── RitualBreathing.tsx
│   │   ├── CardFanSpread.tsx
│   │   ├── CardSlotIndicator.tsx
│   │   ├── ResultReveal.tsx
│   │   ├── ResultCardFlip.tsx
│   │   ├── QuoteSwiper.tsx
│   │   ├── ClarifierInline.tsx
│   │   └── StoryCardPreview.tsx
│   └── layout/                — Layout components
│       ├── CleanHeader.tsx
│       └── ReadingLayout.tsx
├── hooks/
│   ├── useTypewriter.ts
│   ├── useHaptic.ts
│   ├── useInViewAnimation.ts
│   ├── useSwipeGesture.ts
│   └── useSoundEffect.ts
├── lib/
│   ├── reading-store.ts       — Zustand store (restructured)
│   ├── animation-config.ts    — ✨ MỚI: Centralized animation constants
│   ├── sound-manager.ts       — ✨ MỚI: Sound effect manager (lazy)
│   └── reader-utils.ts        — ✨ MỚI: Reader data helpers
└── styles/
    └── design-tokens.css      — ✨ MỚI: CSS custom properties
```

---

## 14. Phân pha triển khai

### Phase A — Foundation (3-4 ngày)
- [ ] Tách `ReaderProfileView.tsx` thành 12 sub-components
- [ ] Tạo shared UI components (`GlowButton`, `SkeletonCard`, `ProgressBar`, etc.)
- [ ] Setup `design-tokens.css` và typography scale
- [ ] Implement page transition trong `template.tsx` (Framer AnimatePresence)
- [ ] Redesign Stepper bar (continuous progress)
- [ ] Tạo `loading.tsx` skeleton cho mỗi route segment
- [ ] Remove GSAP + Lenis dependencies
- [ ] Move Tarot dataset sang server-only

### Phase B — Reader Page Rebuild (3-4 ngày)
- [ ] Build Reader Gallery page (`/reading/reader`)
- [ ] Rebuild Reader Profile page với component mới
- [ ] Lazy-load Three.js 3D card component
- [ ] Implement ambient particle canvas (lightweight)
- [ ] Implement Reader keyword tags stagger animation
- [ ] Implement Reader mastery bars animated
- [ ] Build Reader testimonials carousel
- [ ] Build "Vũ Trụ Chọn Giúp" random reader feature
- [ ] Couple mode toggle integration

### Phase C — Reading Flow Rebuild (4-5 ngày)
- [ ] Gộp Step 2 sub-pages thành single page với internal flow
- [ ] Build TopicSelector component với smart suggestions
- [ ] Build QuestionInput với voice input + auto-save
- [ ] Build RitualBreathing guide component
- [ ] Rebuild CardFanSpread với swipe + haptic
- [ ] Implement card selection undo
- [ ] Build ResultReveal với typewriter + staggered card flip
- [ ] Build QuoteSwiper cho savage_quote selection
- [ ] Build ClarifierInline cho follow-up questions
- [ ] Build StoryCardPreview widget

### Phase D — Polish & Performance (2-3 ngày)
- [ ] Audit bundle size — target ≤ 150KB first load
- [ ] Implement `prefers-reduced-motion` cho tất cả animations
- [ ] A11y audit — focus management, aria labels, keyboard nav
- [ ] Responsive testing: 360px, 390px, 430px, 768px, 1024px, 1440px
- [ ] Sound effects integration + lazy loading
- [ ] Error boundaries cho mỗi step
- [ ] E2E test cho full reading flow
- [ ] Lighthouse audit — target: Performance ≥90, A11y ≥95

### Phase E — New Features (3-4 ngày)
- [ ] Reader "Thẻ Năng Lượng Hôm Nay" widget
- [ ] Result streaming (SSE typewriter)
- [ ] Reading history quick access pill
- [ ] Reader comparison bottom sheet
- [ ] Story Card live preview trên kết quả page

---

**Tổng thời gian ước tính:** 15–20 ngày (1 người)

**Ưu tiên nếu bị gấp:** Phase A → Phase B (Reader page) → Phase C (Reading flow) → Phase D (Polish). Phase E có thể defer.

---

> **Ghi chú:** Plan này tập trung 100% vào frontend. Backend APIs (AI, shuffle, payment) giả định đã hoạt động hoặc sẽ được develop song song. Mọi thay đổi routing phải backward-compatible với existing bookmarks/links.