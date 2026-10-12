# 🌌 Master Plan: Ý Tưởng & Kiến Trúc Three.js Toàn Diện Cho Toàn Bộ Dự Án Tarot Couple

> **Loại tài liệu:** Thiết Kế Ý Tưởng & Kế Hoạch Kỹ Thuật (Ideation & Technical Architecture Blueprint)  
> **Trạng thái:** **ĐÃ ĐỒNG BỘ 4 READERS CHUẨN & ĐANG VẬN HÀNH TRÊN PRODUCTION (v2.0)**  
> **Định hướng công nghệ đã chọn:** **Vanilla Three.js Modules + Hybrid 2D/CSS Fallback** (Kiểm soát 100% VRAM, tối ưu bundle siêu nhẹ, 60 FPS mượt mà trên smartphone Gen Z).

---

## 🔮 1. Tầm Nhìn Nghệ Thuật & Triết Lý Không Gian 3D (Art Direction & Spatial Concept)

### 1.1. Tại sao Tarot Couple cần Three.js?
Các ứng dụng bói toán thông thường trên thị trường hiện nay đa phần mang giao diện phẳng 2D, khiến trải nghiệm giống như đang "điền một biểu mẫu hành chính" rồi đọc văn bản từ bot.

Trong thế giới thực, bói bài Tarot là một **nghi thức đa giác quan (Multi-sensory Ritual)**:
- **Xúc giác & Bề mặt:** Mặt bàn phủ nhung đen tuyền (`#09080D`), chất liệu giấy bài dập vân dày dặn (350–400gsm), viền cạnh lá bài được mạ vàng lá (`--gold #C9A24A`) bắt sáng lấp lánh khi đổi góc nhìn.
- **Ánh sáng & Không khí:** Ánh nến lung linh chập chờn tạo bóng đổ mềm, làn khói trầm hương và bụi sao lượn lờ trong không gian tĩnh mịch lúc nửa đêm (22:00 – 02:00).
- **Hành vi rút bài:** Động tác xào bài, chẻ bài (riffle shuffle), xòe bài hình cánh quạt 3D và cảm giác hồi hộp nín thở khi ngón tay lướt qua mép từng lá bài trước khi lật mở định mệnh.

**Three.js biến Tarot Couple thành một Ngôi Đền Huyền Bí Số (Digital Mystic Sanctuary)**: Mọi thao tác từ lướt bài, lật bài, kết nối đôi đến chiêm ngưỡng năng lượng của 4 Readers chuẩn đều diễn ra trong không gian 3 chiều sống động, có ánh sáng, độ sâu và cảm xúc.

---

## 🏛️ 2. Kiến Trúc Kỹ Thuật: Vanilla Three.js Modular Engine (`src/lib/three/`)

### 2.1. Mô Hình Triển Khai (Isolated Canvas Leaf Components + Hybrid Fallback)
Không lạm dụng các wrapper cồng kềnh, toàn bộ đồ họa 3D được xây dựng theo mô hình **Vanilla Three.js Controllers** độc lập, nhúng vào Next.js 15 Client Leaf Components kèm cơ chế tự động chuyển đổi sang 2D/CSS 3D khi thiết bị yếu hoặc mất WebGL Context.

### 2.2. Lợi Thế Vượt Trội Của Vanilla Three.js Với Dự Án Mobile
1. **Không xung đột phiên bản React 19:** Chạy độc lập hoàn toàn với React DOM reconciler.
2. **Không re-render React thừa thãi:** Vòng lặp chuyển động 60 FPS chạy trực tiếp trên WebGL Canvas, không kích hoạt state re-render của React.
3. **Quản lý bộ nhớ VRAM chặt chẽ (`disposeThreeScene`):** Tự động gọi `.dispose()` trên geometry, material, texture khi người dùng chuyển trang.
4. **Cơ chế Dirty-Flag & Idle Sleep (`IdleAwareRenderLoop`) + `webglcontextlost` Recovery:** Tự động tạm dừng vòng lặp render khi cảnh đứng yên quá 3 giây hoặc khi người dùng ẩn tab (`document.hidden`), tiết kiệm 80% pin điện thoại; tự động chuyển về 2D khi gặp sự kiện `webglcontextlost`.
5. **Procedural Sacred Card Textures (`createSacredCardBackTexture`):** Tự động sinh họa tiết mặt lưng Bát Giác Thiêng (Octagram) mạ vàng `#C9A24A` bằng Offscreen Canvas, chống lỗi CORS tuyệt đối.

---

## 🗺️ 3. Bản Đồ Hệ Sinh Thái Three.js Toàn Diện (Đồng Bộ 4 Readers Chuẩn)

### 🌌 Module 1: Bầu Trời Sao & Khí Quyển Vũ Trụ Toàn Cục (`CelestialSkyCanvas.tsx`)
- **Hệ Thống 3 Tầng Sao Thị Sai (3D Parallax Starfield):**
  - Khởi tạo các hạt sao bằng `THREE.Points` với `BufferGeometry` tùy biến, chia làm 3 lớp độ sâu trục Z ($Z = -300, -150, -30$).
  - Hạt sao chuyển động thị sai mượt mà theo chuột và cảm biến nghiêng điện thoại (`deviceorientation`).
- ** Tinh Vân Đổi Màu Theo 4 Readers Chuẩn:**
  - `ba_ngoai` (**Bà Ngoại**): Hào quang Vàng Ấm & Hổ Phách (`#EAB308` / `#D97706`).
  - `chi_dai` (**Chị Đại**): Hào quang Đỏ Rượu Vang & Vàng Kim (`#E11D48` / `#C9A24A`).
  - `ban_than` (**Bạn Thân**): Hào quang Hồng Cánh Sen & Tím Sao (`#EC4899` / `#8B5CF6`).
  - `thay_cu_meo` (**Thầy Cú Mèo**): Hào quang Xanh Đêm Thiên Văn (`#3B82F6` / `#6366F1`).
- **Sao Băng Thực Thể:** Xuất hiện định kỳ mỗi 14 giây lướt chéo qua bầu trời đêm.

---

### 🃏 Module 2: Trang Chủ & Hero Bộ Bài 3D Tương Tác (`HeroTarotDeck3D.tsx` - P01)
- **Xấp Bài Tarot 3D Nổi & Bung Quạt 5 Lá Major Arcana:**
  - Khối bài Tarot 3D với cạnh mạ vàng cổ (`#C9A24A`) phản chiếu ánh sáng nến ấm áp.
  - Khi người dùng chạm hoặc di chuột vào: 5 lá bài Ẩn Chính đại diện (*The Fool, The Magician, The Sun, The Lovers, The World*) tự động xòe thành vòng cung 3D có chiều sâu trục Z và nghiêng theo góc nhìn.

---

### 🕯️ Module 3: Không Gian Bàn Thờ 4 Readers Chuẩn (Reader Altar Totems - P02)

| Reader ID | Tên Reader | Bảo vật 3D biểu tượng (Totem) | Hiệu ứng chuyển động & Ánh sáng | Cảm xúc mang lại |
| :--- | :--- | :--- | :--- | :--- |
| **`ba_ngoai`** | **Bà Ngoại** *(Ấm áp, thương con cháu)* | **Đèn Trà Sen Gốm Cổ & Nến Ấm** | Ánh sáng vàng ấm `#EAB308` tỏa ra từ đài sen gốm cổ, hạt bụi vàng bay lơ lửng dịu dàng. | Vỗ về, bình yên, gần gũi |
| **`chi_dai`** | **Chị Đại** *(Thẳng thắn, hơi gắt mà thương)* | **Ly Rượu Vang Pha Lê & Hoa Hồng Đỏ** | Pha lê khúc xạ ánh đỏ rượu `#E11D48`, tàn lửa vàng kim `#C9A24A` bừng sáng mạnh mẽ. | Thức tỉnh, tự tôn, bản lĩnh |
| **`ban_than`** | **Bạn Thân** *(Lầy lội, đồng cảm Gen Z)* | **Tinh Cầu Ngôi Sao Hồng Lấp Lánh** | Khối sao pha lê hồng `#EC4899` xoay nhẹ cùng các vòng hạt năng lượng lấp lánh. | Vui vẻ, thấu hiểu, sẻ chia |
| **`thay_cu_meo`** | **Thầy Cú Mèo** *(Điềm tĩnh, phân tích sâu)* | **La Bàn Thiên Văn Đồng Thau (Armillary Sphere)** | Các vòng khuyên đồng thau xoay đồng tâm đa trục quanh lăng kính sao đêm `#3B82F6`. | Sâu sắc, logic, sáng tỏ |

---

### 🎴 Module 5: Nghi Thức Rút Bài 3D Đỉnh Cao (`TactileArcFan.tsx` - P07)
- **Tọa độ Parabolic Cylindrical (`computeParabolicArcTransform`):** Vị trí của $N$ lá bài (22 hoặc 78 lá) được tính trên mặt trụ parabol 3D ôm lấy góc nhìn camera.
- **Tương tác Vuốt Quán Tính & Raycaster:** Khi lướt ngón tay qua từng lá bài, bộ bài xoay mượt theo quán tính, lá bài dưới ngón tay nhấc cao và phát sáng viền vàng `#C9A24A`.
- **Quỹ đạo bay (`evaluateCubicBezier3D`):** Lá bài được chọn bay vút theo đường cong Bézier 3D đáp vào vị trí trải bài kèm âm thanh `playCardFlip()` và rung Haptic.
- **Hybrid 3D / 2D Toggle:** Hỗ trợ chuyển đổi tức thì giữa chế độ Không Gian 3D (WebGL) và Dải Bài 2D mượt mà.

---

### 👁️ Module 6: Lễ Lật Bài Thần Thánh 3D & Ánh Xà Cừ Holographic (`TarotCardVisual.tsx` - P08 & P09)
- **Độ dày vật lý & Viền Mạ Vàng (`#C9A24A`):** Hiệu ứng cạnh vát 3D và bóng đổ theo góc nghiêng.
- **Holographic Iridescent Foil:** Ánh xà cừ cầu vồng chuyển dịch mượt mà theo chuyển động chuột/cảm ứng thông qua `useMotionValue` & `useTransform` (tuân thủ `design-taste-frontend`, không re-render React).

---

### 🤝 Module 7: Bói Đôi 3D - Cầu Năng Lượng & Điểm Hợp Cạ (`CoupleResonanceBridge3D.tsx` - P12 đến P15)
- Hai lá bài 3D của Bạn (Sắc tím `#8B5CF6`) và Người Ấy (Sắc hồng `#E879A8`) đặt đối xứng hai bên, kết nối vào lá bài Cầu Nối thứ 3 (`#C9A24A`) bằng luồng hạt năng lượng **The Resonance Bridge**.
- Tốc độ hạt năng lượng và sắc thái ánh sáng phản ánh trực tiếp `% Độ Hợp Cạ` và cảnh báo `Red Flag`.
