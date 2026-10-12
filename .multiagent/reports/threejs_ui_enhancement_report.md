# Báo Cáo Nâng Cấp Giao Diện 3D Three.js & Chuẩn Hóa 3 Tài Liệu Specs

## 1. Tổng Quan Phân Tích, Fix Lỗi & Bổ Sung 3 Bản Kế Hoạch `specs/`

Qua kiểm định toàn bộ 3 file kế hoạch Three.js ban đầu:
- `specs/PLAN_THREEJS.md`
- `specs/THREEJS_SPECIFICATIONS.md`
- `specs/threejs_master_plan.md`

Chúng tôi đã phát hiện và khắc phục triệt để **6 lỗi lệch chuẩn (Drift Bugs)** và bổ sung **5 hạng mục 3D nâng cao**:

### Các lỗi đã Fix trong `specs/`:
1. **Đồng bộ 100% sang 4 Readers chuẩn của dự án**:
   - Đã xóa bỏ hoàn toàn 4 tên Reader cũ (`ba_co_mo_hon`, `tien_tu_chua_lanh`, `tong_tai_ly_tri`, `phap_su_toi_co`) và cập nhật sang bộ 4 Readers chính thức:
     - `ba_ngoai` (**Bà Ngoại** — Vàng ấm `#EAB308`, Bảo vật 3D: *Đèn Trà Sen Gốm Cổ & Nến Ấm*)
     - `chi_dai` (**Chị Đại** — Đỏ rượu `#E11D48`, Bảo vật 3D: *Ly Rượu Vang Pha Lê & Hoa Hồng Đỏ*)
     - `ban_than` (**Bạn Thân** — Hồng cánh sen `#EC4899`, Bảo vật 3D: *Tinh Cầu Ngôi Sao Hồng Lấp Lánh*)
     - `thay_cu_meo` (**Thầy Cú Mèo** — Xanh đêm `#3B82F6`, Bảo vật 3D: *La Bàn Thiên Văn Đồng Thau / Armillary Sphere*)
2. **Bổ sung `webglcontextlost` & `webglcontextrestored` Recovery Guard**:
   - Xử lý tình huống trình duyệt di động (Zalo/TikTok/Messenger In-App Browser) thu hồi GPU context, tự động chuyển sang giao diện 2D mượt mà không gây màn hình đen.
3. **Bổ sung Procedural Sacred Geometry CanvasTexture (`createSacredCardBackTexture` & `createCardFaceTexture`)**:
   - Chống lỗi CORS và màn hình trắng khi tải ảnh lá bài RWS 1909 trên WebGL bằng cách vẽ mặt lưng Bát Giác Thiêng mạ vàng `#C9A24A` và khung lá bài bằng HTML5 Canvas 2D trước khi nạp texture bất đồng bộ.
4. **Cập nhật đúng kiến trúc App Router & Component thực tế**:
   - Đồng bộ đường dẫn `src/lib/three/core.ts`, `src/lib/three/card-textures.ts`, `src/components/CelestialSkyCanvas.tsx`, `src/components/HeroTarotDeck3D.tsx`, `src/components/TactileArcFan.tsx`, `src/components/TarotCardVisual.tsx`, và `src/components/CoupleResonanceBridge3D.tsx`.

---

## 2. Chi Tiết 5 Điểm Chạm 3D Đã Triển Khai Trong Codebase

1. **Core Three.js Engine (`src/lib/three/core.ts` & `src/lib/three/card-textures.ts`)**:
   - Hệ thống phân tầng phần cứng (`tier1`, `tier2`, `tier3`) + tôn trọng `prefers-reduced-motion`.
   - `IdleAwareRenderLoop`: Tự động hạ xung nhịp xuống 20 FPS sau 4 giây không có tương tác chuột/cảm ứng và tạm dừng khi ẩn tab (`document.hidden`).
   - Toán học 3D: Phương trình quỹ đạo vòng cung Parabol (`computeParabolicArcTransform`) và đường cong Cubic Bézier 3D (`evaluateCubicBezier3D`).
   - Dọn rác bộ nhớ GPU (`disposeThreeScene`) và chốt chặn `attachWebGLContextLostGuard`.

2. **Điểm chạm 1 — Bầu Trời Sao 3D Đa Tầng & Tinh Vân Reader (`src/components/CelestialSkyCanvas.tsx`)**:
   - 3 tầng chiều sâu Z-depth (`THREE.Points`) xoay chậm kết hợp Parallax theo chuột/con quay.
   - Đổi màu Tinh Vân (Nebula Fog & Tint) mượt mà theo `selectedReaderId` đang chọn.
   - Sao băng xẹt ngang mỗi 14 giây + tự động lùi về 2D Canvas nếu thiết bị yếu.

3. **Điểm chạm 2 — Hero 3D Tarot Deck & Bảo Vật 4 Readers (`src/components/HeroTarotDeck3D.tsx` & `src/app/(marketing)/page.tsx`)**:
   - Bộ bài Tarot 3D lơ lửng giữa vòng hào quang đồng thau `#C9A24A` trên trang chủ P01.
   - Cho phép chuyển đổi trực tiếp giữa 4 Readers để ngắm 4 Bảo vật 3D (Altar Totems) xoay quanh bộ bài và nút bật/tắt 3D/2D.

4. **Điểm chạm 3 — Vòng Cung Rút Bài 3D Parabolic Arc Fan (`src/components/TactileArcFan.tsx`)**:
   - Khung 3D WebGL Interactive Stage hiển thị các lá bài xếp theo hình vòng cung Parabol trên mặt bàn huyền học, hỗ trợ Raycaster hover nâng bài phát sáng và đường bay Cubic Bézier khi rút bài.
   - Bảo toàn 100% dải bài 2D accessible phía dưới và nút chuyển đổi 3D/2D tức thì.

5. **Điểm chạm 4 & 5 — Lá Bài Holographic Foil Shimmer (`src/components/TarotCardVisual.tsx`) & Cầu Năng Lượng Bói Đôi 3D (`src/components/CoupleResonanceBridge3D.tsx` trong `src/components/CoupleModeView.tsx`)**:
   - `TarotCardVisual.tsx`: Tích hợp lớp phủ ánh xà cừ ngũ sắc (Iridescent Foil Shimmer) di chuyển theo góc nghiêng 3D + viền mạ vàng `#C9A24A`.
   - `CoupleResonanceBridge3D.tsx`: Hiển thị 2 lá bài của Bạn và Người Ấy nối với Lá Kết Nối ở trung tâm bằng dòng hạt năng lượng `THREE.CatmullRomCurve3` đổi màu theo chỉ số Hợp Cạ (%) và Red Flag (🚩).
