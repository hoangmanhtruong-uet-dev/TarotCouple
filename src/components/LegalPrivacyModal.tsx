'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Trash2,
  RotateCcw,
  Lock,
  Sparkles,
  CheckCircle2,
  PhoneCall,
} from 'lucide-react';
import { useModalA11y } from '@/lib/use-modal-a11y';

export interface LegalPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  onResetSession: () => void;
}

export function LegalPrivacyModal({
  isOpen,
  onClose,
  onClearHistory,
  onResetSession,
}: LegalPrivacyModalProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // M4: Escape-to-close + body scroll lock + Tab focus trap while open
  const dialogRef = useModalA11y(isOpen, onClose);

  const handleClearLocalHistory = () => {
    onClearHistory();
    setFeedbackMessage(
      'Đã xóa toàn bộ lịch sử bốc bài và câu hỏi lưu trên thiết bị này.'
    );
  };

  const handleResetAccountSession = () => {
    onResetSession();
    setFeedbackMessage(
      'Đã đặt lại toàn bộ dữ liệu phiên, biệt danh và tùy chọn cá nhân về mặc định.'
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Điều khoản sử dụng và Chính sách quyền riêng tư"
          ref={dialogRef}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 14 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 14 }}
            className="relative w-full max-w-2xl rounded-3xl bg-[#14111C] border border-[#C9A24A]/40 shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9A24A]/20 bg-[#09080D]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#C9A24A]" />
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#F8F5F0]">
                  Điều Khoản, Quyền Riêng Tư & Bảo Vệ Dữ Liệu (P24)
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-[#F8F5F0] transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm text-[#D8D2E7] leading-relaxed">
              {/* Section 1: Positioning */}
              <div className="p-4 rounded-2xl bg-[#1D1829] border border-[#C9A24A]/25 space-y-1.5">
                <p className="font-semibold text-[#F3E5AB] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C9A24A]" />
                  1. Định vị dịch vụ: Giải trí & Tự phản chiếu tâm lý
                </p>
                <p className="text-xs sm:text-sm text-[#A39BB5]">
                  Tarot Couple là ứng dụng trò chơi giải trí và tự phản chiếu tâm lý (Journaling / Self-reflection) dựa trên hệ biểu tượng 78 lá bài Rider-Waite-Smith 1909. Mọi thông điệp hoàn toàn mang tính chất tham khảo tinh thần, không khẳng định tương lai tuyệt đối và không thay thế tư vấn y tế, tâm lý, pháp lý hay tài chính chuyên nghiệp.
                </p>
              </div>

              {/* Section 2: Privacy & PDPD Decree 13/2023/ND-CP */}
              <div className="p-4 rounded-2xl bg-[#1D1829] border border-white/10 space-y-1.5">
                <p className="font-semibold text-[#F8F5F0] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  2. Bảo vệ dữ liệu cá nhân (Tuân thủ Nghị định 13/2023/NĐ-CP)
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm text-[#A39BB5] space-y-1">
                  <li>
                    <strong className="text-[#F8F5F0]">Ẩn danh hóa trước khi gọi AI:</strong> Hệ thống tuyệt đối không gửi email, số điện thoại hay định danh cá nhân (PII) tới nhà cung cấp mô hình AI; chỉ gửi biệt danh và nội dung câu hỏi đã lọc thẻ bảo mật.
                  </li>
                  <li>
                    <strong className="text-[#F8F5F0]">Bảo mật câu hỏi riêng tư Bói Đôi:</strong> Trong phòng Bói Đôi 48h, câu hỏi riêng tư của người tạo phòng được giữ bí mật tuyệt đối trên máy chủ và không bao giờ hiển thị sang máy đối phương.
                  </li>
                  <li>
                    <strong className="text-[#F8F5F0]">Mặc định ẩn câu hỏi khi chia sẻ:</strong> Trên ảnh Story 9:16, công tắc <em>“Ẩn câu hỏi của tôi”</em> luôn được bật mặc định để bảo vệ bí mật riêng tư.
                  </li>
                </ul>
              </div>

              {/* Section 3: Age Policy */}
              <div className="p-4 rounded-2xl bg-[#1D1829] border border-white/10 space-y-1.5">
                <p className="font-semibold text-[#F8F5F0]">
                  3. Phân tầng bảo vệ theo độ tuổi & Rào chắn thanh toán
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm text-[#A39BB5] space-y-1">
                  <li>
                    <strong className="text-amber-300">Rào chắn thanh toán (&lt;11 tuổi):</strong> Trẻ em dưới 11 tuổi được khóa 100% tính năng tạo mã VietQR và nạp tiền ngân hàng; chỉ tích lũy Sao miễn phí qua Điểm danh hàng ngày hoặc Chia sẻ.
                  </li>
                  <li>
                    <strong className="text-emerald-300">Chế độ Học Đường Trong Sáng (&lt;16 tuổi):</strong> Tự động chuyển sang biến thể học sinh ấm áp, giảm mỉa mai, tập trung vào chủ đề học tập, bạn bè trong sáng.
                  </li>
                  <li>
                    <strong className="text-[#F3E5AB]">Trần chi tiêu bảo vệ:</strong> Áp dụng hạn mức chi tiêu có trách nhiệm tối đa 50.000đ/ngày để bảo vệ túi tiền người dùng.
                  </li>
                </ul>
              </div>

              {/* Section 4: Crisis Support & National Hotline 111 */}
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-400/35 space-y-2">
                <p className="font-semibold text-rose-200 flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-rose-400" />
                  4. Đường dây nóng hỗ trợ khẩn cấp & Bảo vệ trẻ em 24/7
                </p>
                <p className="text-xs text-rose-100/90 leading-relaxed">
                  Nếu bạn hoặc người thân đang trải qua khủng hoảng tâm lý, bạo lực hoặc cần sự trợ giúp khẩn cấp, hãy liên hệ ngay các tổng đài miễn phí:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  <a
                    href="tel:111"
                    className="p-2.5 rounded-xl bg-[#09080D]/80 border border-rose-400/30 text-rose-200 hover:border-rose-400 transition-colors flex items-center justify-between"
                  >
                    <span>Tổng đài Quốc gia Bảo vệ Trẻ em:</span>
                    <strong className="text-sm font-mono text-white">111 (24/7)</strong>
                  </a>
                  <a
                    href="tel:0963061414"
                    className="p-2.5 rounded-xl bg-[#09080D]/80 border border-rose-400/30 text-rose-200 hover:border-rose-400 transition-colors flex items-center justify-between"
                  >
                    <span>Đường dây nóng Ngày Mai:</span>
                    <strong className="text-sm font-mono text-white">096 306 1414</strong>
                  </a>
                </div>
              </div>

              {/* Feedback Toast */}
              {feedbackMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-400/40 flex items-center gap-2.5 text-xs text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feedbackMessage}</span>
                </div>
              )}

              {/* Data Management Controls per Section 8.4 */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C9A24A]">
                  Quyền kiểm soát & Xóa dữ liệu của bạn
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleClearLocalHistory}
                    className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-400/35 text-rose-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa lịch sử bốc bài trên thiết bị này</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetAccountSession}
                    className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#1D1829] hover:bg-[#282238] border border-[#C9A24A]/35 text-[#F3E5AB] text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Đặt lại dữ liệu tài khoản / phiên</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
