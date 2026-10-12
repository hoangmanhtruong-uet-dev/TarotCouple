# 📐 Đặc Tả Kỹ Thuật Three.js (THREEJS_SPECIFICATIONS.md)

> **Dự án:** Tarot Couple — Nền tảng Bói Tarot AI & Bói Đôi  
> **Người thực hiện:** Multi-Agent Engineering Team (3D Graphics & Shader Specialist)  
> **Tài liệu tham chiếu:** [PLAN_THREEJS.md](file:///d:/MyProjects/MyProjectToMoney/TarotCouple/specs/PLAN_THREEJS.md)  
> **Thời gian cập nhật:** 12/10/2026  
> **Trạng thái:** **TÀI LIỆU ĐẶC TẢ KỸ THUẬT SẢN XUẤT (PRODUCTION SPECIFICATION v2.0)**

---

## 1. HỆ THỐNG MÃ NGUỒN VÀ QUẢN LÝ BỘ NHỚ (`src/lib/three/core.ts`)

### 1.1. Chuẩn Quản Lý VRAM (Deterministic Disposal Protocol)
Để đảm bảo không bao giờ bị rò rỉ VRAM khi người dùng chuyển trang nhiều lần, mỗi module Three.js phải tuân thủ nghiêm ngặt giao thức giải phóng tài nguyên sau:

```typescript
export function disposeThreeScene(scene: THREE.Scene, renderer?: THREE.WebGLRenderer | null): void {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh | THREE.Points | THREE.Line;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => disposeMaterial(mat));
      } else {
        disposeMaterial(mesh.material);
      }
    }
  });

  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  }
}

export function disposeMaterial(material: THREE.Material): void {
  material.dispose();
  for (const key of Object.keys(material)) {
    const value = (material as unknown as Record<string, unknown>)[key];
    if (value && typeof value === 'object' && 'isTexture' in value) {
      (value as THREE.Texture).dispose();
    }
  }
}
```

### 1.2. Vòng Lặp Render Tối Ưu Pin (`IdleAwareRenderLoop`)
- Tự động ngủ đông khi không có tương tác sau `maxIdleSeconds` (mặc định `3s`).
- Tự động dừng khi `document.hidden === true` (ẩn tab / khóa màn hình điện thoại).
- Tự động bắt sự kiện `webglcontextlost` trên trình duyệt nhúng Zalo/TikTok/Messenger để kích hoạt callback `onContextLost()` chuyển sang chế độ 2D Fallback ngay lập tức.

---

## 2. ĐẶC TẢ HÌNH HỌC & TEXTURE LÁ BÀI TAROT 3D (`src/lib/three/card-textures.ts`)

### 2.1. Cấu Trúc Khối 3D (Double-Sided Beveled Box Geometry)
Lá bài Tarot có kích thước vật lý chuẩn tỉ lệ $1 : 1.75$ (chiều rộng $0.7\text{m}$, chiều cao $1.225\text{m}$, độ dày $0.014\text{m}$):

- **Geometry:** `THREE.BoxGeometry(0.7, 1.225, 0.014)`
- **Multi-Material Array (6 mặt khối hộp):**
  - Mặt 0, 1, 2, 3 (4 cạnh viền): `GildedGoldMaterial` (`#C9A24A`, `metalness: 0.85`, `roughness: 0.22`).
  - Mặt 4 (Mặt trước - Card Face): `CardFaceMaterial` (Procedural RWS Emblem / Artwork + Gold Frame).
  - Mặt 5 (Mặt sau - Card Back): `CardBackMaterial` (Họa tiết hình học thiêng Octagram & Moon Phases mạ vàng `#C9A24A` trên nền nhung `#14111C`).

### 2.2. Procedural Sacred Geometry Card Texture (Chống Lỗi CORS 100%)
Để loại bỏ hoàn toàn hiện tượng mặt bài bị đen trên WebGL khi mạng di động yếu hoặc bị chặn CORS bởi CDN ngoài:
- Sử dụng HTML5 Canvas 2D (`createSacredCardBackCanvas`) sinh trực tiếp họa tiết **Bát Giác Thiêng (Sacred Octagram)**, **Chu Kỳ Mặt Trăng (Lunar Phases)** và viền đôi mạ vàng `#C9A24A` ở độ phân giải `256x448`, đóng gói thành `THREE.CanvasTexture`.
- Tương tự, mặt trước lá bài (`createProceduralCardFrontCanvas`) luôn có lớp nền hoàng kim & số La Mã chuẩn xác ngay lập tức, sau đó nạp chồng ảnh RWS 1909 (`crossOrigin = 'anonymous'`) nếu khả dụng.

---

## 3. PHƯƠNG TRÌNH TOÁN HỌC & CHUYỂN ĐỘNG (`MATHEMATICAL KINEMATICS`)

### 3.1. Phương Trình Vòng Cung Xòe Bài 3D (`computeParabolicArcTransform`)
Với số lượng lá bài $N$ (22 hoặc 78), góc mở toàn dải $\Omega$ (radian), và độ lệch cuộn ngang `scrollOffset` $\in [-1, 1]$, mỗi lá bài thứ $i$ ($0 \le i < N$) có tham số chuẩn hóa:
$$t_i = \frac{i - \frac{N-1}{2}}{\max\left(1, \frac{N-1}{2}\right)} - \text{scrollOffset}$$
$$\theta_i = t_i \cdot \frac{\Omega}{2}$$

Tọa độ vị trí và góc xoay của lá bài trong không gian 3D:
$$x_i = R_{\text{cyl}} \cdot \sin(\theta_i)$$
$$z_i = -R_{\text{cyl}} \cdot (1 - \cos(\theta_i))$$
$$y_i = -C_{\text{dip}} \cdot t_i^2$$
$$\text{Rotation}_Y = -\theta_i, \quad \text{Rotation}_Z = -t_i \cdot \alpha_{\text{tilt}}$$

Trong đó:
- $R_{\text{cyl}} = 2.6$: Bán kính mặt trụ cong.
- $C_{\text{dip}} = 0.22$: Độ võng parabol ở hai mép ngoài giúp các lá bài hạ thấp dần tạo thế cánh chim.
- $\alpha_{\text{tilt}} = 0.24\text{ rad} \approx 13.7^\circ$: Độ nghiêng sườn bài.

### 3.2. Quỹ Đạo Bay Đón Thẻ Vào Altar Slot (`evaluateCubicBezier3D`)
Khi người dùng chọn lá thứ $k$, lá bài tách khỏi vòng cung và bay đến vị trí Slot $\mathbf{P}_3$:
$$\mathbf{B}(t) = (1-t)^3 \mathbf{P}_0 + 3(1-t)^2 t \mathbf{P}_1 + 3(1-t) t^2 \mathbf{P}_2 + t^3 \mathbf{P}_3, \quad t \in [0, 1]$$
- $\mathbf{P}_0$: Vị trí hiện tại trên vòng cung 3D.
- $\mathbf{P}_1$: Điểm nhấc bổng lên cao ($z + 0.65, y + 0.35$).
- $\mathbf{P}_2$: Điểm định hướng trước Slot đích ($z + 0.3, y + 0.18$).
- $\mathbf{P}_3$: Điểm đáp xuống mặt bàn Slot đích (*Quá khứ / Hiện tại / Tương lai*).

---

## 4. BẢNG MÀU KHÍ QUYỂN 4 READERS CHUẨN & ÁNH SÁNG MÔI TRƯỜNG (`LIGHTING RIG`)

| Reader ID | Tên Hiển Thị | Màu Nhấn Chính | Màu Tinh Vân Phụ | Bảo Vật Bàn Thờ 3D (Totem) |
| :--- | :--- | :--- | :--- | :--- |
| **`ba_ngoai`** | **Bà Ngoại** | `#EAB308` (Vàng ấm) | `#D97706` (Hổ phách) | Đèn Trà Sen Gốm Cổ & Nến Ấm |
| **`chi_dai`** | **Chị Đại** | `#E11D48` (Đỏ rượu) | `#C9A24A` (Vàng kim) | Ly Rượu Vang Pha Lê & Hoa Hồng Đỏ |
| **`ban_than`** | **Bạn Thân** | `#EC4899` (Hồng sen) | `#8B5CF6` (Tím sao) | Tinh Cầu Ngôi Sao Hồng Lấp Lánh |
| **`thay_cu_meo`** | **Thầy Cú Mèo** | `#3B82F6` (Xanh đêm) | `#6366F1` (Chàm) | La Bàn Thiên Văn Đồng Thau |

| Nguồn Sáng | Loại Light | Màu Sắc | Cường Độ | Vị Trí Không Gian | Mục Đích Nghệ Thuật |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Candle Key Light** | `PointLight` | `#FFA64D` (Cam nến ấm) | 1.8 | $(0.0, 1.2, 2.2)$ dao động $\pm 5\%$ | Tái hiện ánh nến chập chờn trên bàn bói |
| **Celestial Rim Light** | `DirectionalLight` | Theo Reader (`#EAB308` / `#E11D48` / `#EC4899` / `#3B82F6`) | 1.1 | $(2.0, 3.0, 1.5)$ | Chiếu sáng đường viền mạ vàng `#C9A24A` của các lá bài |
| **Altar Fill Light** | `AmbientLight` | `#1D1829` (Tím tối) | 0.65 | Toàn không gian | Nâng chi tiết vùng tối của mặt bàn nhung |

---

## 5. BẢO VỆ HIỆU NĂNG & PHỤC HỒI WEBGL CONTEXT

1. **Kiểm tra ngữ cảnh WebGL & Phân tầng phần cứng (`detectHardwareTier`):**
   - Kiểm tra `navigator.hardwareConcurrency`, `prefers-reduced-motion` và khả năng khởi tạo `webgl` / `experimental-webgl`.
   - Nếu không hỗ trợ WebGL hoặc người dùng bật `prefers-reduced-motion`, trả về `tier3` để sử dụng giao diện 2D/CSS 3D tức thì.
2. **Xử lý `webglcontextlost` trên Mobile In-App Browsers:**
   - Gắn listener `canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onContextLost(); })` để tự động chuyển sang chế độ 2D Fallback không giật lag.
