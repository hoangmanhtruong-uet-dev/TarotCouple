# 🔮 Báo Cáo Kiểm Toán & Kế Hoạch Giai Đoạn 3 (Phase 3 Multi-Agent Audit Report)

> **Dự án:** Tarot Couple  
> **Thời gian:** 12/10/2026  
> **Người thực hiện:** Multi-Agent Team (`team` skill)  
> **Tài liệu đặc tả:** [specs/PLAN_GD3.md](file:///d:/MyProjects/MyProjectToMoney/TarotCouple/specs/PLAN_GD3.md)

---

## 1. Kết Quả Audit Tổng Quan
- **Trạng thái kiểm thử:** 50/50 bài kiểm thử Vitest đạt 100% (bao gồm Shuffler CSPRNG, Safety Guardrails, Quota Engine, PayOS Idempotency, Satori 9:16 Story Card).
- **Trạng thái TypeScript:** Strict Type Checking thông suốt không lỗi.
- **Tình trạng tích hợp:** Đã bổ sung cơ chế Multi-model Fallback (`gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-1.5-flash`) phòng trường hợp Google AI Studio key chưa hỗ trợ model 2.5.

## 2. 5 Lỗ Hổng & Điểm Cần Nâng Cấp Giai Đoạn 3
1. **Minh bạch tuổi & Giọng xưng Reader:** Giải quyết triệt để sự cố người dùng bị chuyển sang xưng "Bà Ngoại" bằng việc hiển thị badge trạng thái lứa tuổi rõ ràng ở bước Về Bạn và Cho phép xem hồ sơ chi tiết.
2. **Nhật ký Tarot đa phiên (Multi-Session Journal):** Xây dựng kho lưu trữ 20 lượt trải bài gần nhất trong `localStorage`, cho phép xem lại chi tiết và xuất lại ảnh Story 9:16 bất kỳ lúc nào tại `/me/history`.
3. **Đồng bộ Ví Sao & Lượt bói thời gian thực (Real-time Quota):** Tạo hook `useQuotaSync` tự động cập nhật số dư Sao trên Header và các modal nạp/thưởng.
4. **Nghi thức giác quan đa chiều (Audio-Haptic Ritual):** Tích hợp âm thanh huyền bí (chuông gió, tiếng lật bài) bằng Web Audio API không tốn băng thông.
5. **Nâng cấp Bói Đôi Co-op 2.0:** Bổ sung QR Code quét nhanh từ camera điện thoại để mời bạn vào phòng tức thì, hiệu ứng thước đo Hợp Cạ / Red Flag sinh động.

## 3. Lộ Trình Thực Thi
Kế hoạch chi tiết từng bước, ma trận rủi ro và tiêu chí hoàn thành đã được lưu tại file đặc tả:  
👉 **[specs/PLAN_GD3.md](file:///d:/MyProjects/MyProjectToMoney/TarotCouple/specs/PLAN_GD3.md)**
