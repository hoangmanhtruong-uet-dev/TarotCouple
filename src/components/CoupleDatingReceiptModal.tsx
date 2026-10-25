'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  X,
  Share2,
  Copy,
  Check,
  Heart,
  Sparkles,
  QrCode,
  Download,
} from 'lucide-react';
import { soundManager } from '@/lib/sound-effects';

export interface CoupleDatingReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerNickname: string;
  partnerNickname: string;
  relationshipLabel: string;
  compatScore: number;
  redFlagLevel: number;
  readerName: string;
  vibeTag: string;
  verdictSnippet: string;
  savageQuote: string;
  c1Name: string;
  c2Name: string;
  c3Name: string;
}

export function CoupleDatingReceiptModal({
  isOpen,
  onClose,
  ownerNickname,
  partnerNickname,
  relationshipLabel,
  compatScore,
  redFlagLevel,
  readerName,
  vibeTag,
  verdictSnippet,
  savageQuote,
  c1Name,
  c2Name,
  c3Name,
}: CoupleDatingReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeStr = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const receiptText = `🧾 HÓA ĐƠN TÌNH DUYÊN • TAROT COUPLE
Khách hàng: @${ownerNickname} & @${partnerNickname}
Thời gian: ${timeStr} - ${todayStr}
Trạng thái: ${relationshipLabel}
----------------------------------------
01. Rung động đầu tiên           0 VND
02. Thao thức vì tin nhắn        999.000 VND
03. Độ hợp cạ tần số             ${compatScore}%
04. Chỉ số Red Flag              ${redFlagLevel}%
05. Lá bài kết nối               ${c3Name}
06. Lời khuyên của ${readerName}      VÔ GIÁ
----------------------------------------
✨ Vibe: ${vibeTag}
🔮 Chốt hạ: "${savageQuote}"
----------------------------------------
👉 Bốc bài đôi tại: tarotcouple.vercel.app`;

  const handleCopy = async () => {
    soundManager.playCrispClick();
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    soundManager.playCrispClick();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Hóa Đơn Tình Duyên: @${ownerNickname} & @${partnerNickname}`,
          text: receiptText,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    handleCopy();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Hóa Đơn Tình Duyên Cặp Đôi"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-sm rounded-3xl bg-[#FAF8F5] text-[#13111E] p-6 shadow-2xl font-mono text-xs overflow-hidden border-t-8 border-[#C9A24A]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hóa đơn"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/5 hover:bg-black/10 text-black/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Receipt Top Header */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-black/20">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#13111E] text-[#C9A24A] mb-1">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm tracking-widest uppercase">
              TAROT COUPLE SANCTUARY
            </h3>
            <p className="text-[10px] text-black/60 uppercase">
              HÓA ĐƠN NĂNG LƯỢNG ĐÔI • VN-2026
            </p>
            <div className="pt-1 text-[10px] text-black/50 flex justify-between">
              <span>{todayStr} {timeStr}</span>
              <span>READER: {readerName.toUpperCase()}</span>
            </div>
            <div className="text-[10px] text-left text-black/70 pt-1 font-semibold">
              KHÁCH: @{ownerNickname} & @{partnerNickname}
            </div>
            <div className="text-[10px] text-left text-black/50">
              TRẠNG THÁI: {relationshipLabel}
            </div>
          </div>

          {/* Itemized list */}
          <div className="py-3 space-y-1.5 border-b border-dashed border-black/20 text-[11px]">
            <div className="flex justify-between">
              <span>1x Rung Động Đầu Tiên</span>
              <span className="font-semibold">0 VND</span>
            </div>
            <div className="flex justify-between">
              <span>1x Thao Thức Đêm Muộn</span>
              <span className="font-semibold">999.000 VND</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>1x Độ Hợp Cạ Tần Số</span>
              <span>{compatScore}%</span>
            </div>
            <div className="flex justify-between text-amber-700">
              <span>1x Chỉ Số Red Flag 🚩</span>
              <span>{redFlagLevel}%</span>
            </div>
            <div className="flex justify-between text-black/70">
              <span>Lá của @{ownerNickname}</span>
              <span className="truncate max-w-[120px]">{c1Name}</span>
            </div>
            <div className="flex justify-between text-black/70">
              <span>Lá của @{partnerNickname}</span>
              <span className="truncate max-w-[120px]">{c2Name}</span>
            </div>
            <div className="flex justify-between text-[#8E6916] font-bold">
              <span>Cầu Nối Định Mệnh</span>
              <span className="truncate max-w-[120px]">{c3Name}</span>
            </div>
            <div className="flex justify-between font-bold pt-1">
              <span>Lời Khuyên Của {readerName}</span>
              <span className="text-[#C9A24A]">VÔ GIÁ</span>
            </div>
          </div>

          {/* Total & Verdict */}
          <div className="py-3 space-y-2 border-b border-dashed border-black/20">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>TỔNG KẾT NĂNG LƯỢNG:</span>
              <span className="px-2 py-0.5 rounded bg-[#C9A24A]/20 text-[#8E6916] text-[10px]">
                {vibeTag}
              </span>
            </div>
            <p className="text-[10px] text-black/80 leading-relaxed italic bg-black/5 p-2 rounded-xl">
              "{savageQuote}"
            </p>
          </div>

          {/* Barcode Mock & Footer */}
          <div className="pt-3 text-center space-y-2">
            <div className="flex justify-center items-center gap-0.5 h-8 opacity-80">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 4].map(
                (w, idx) => (
                  <span
                    key={idx}
                    className="bg-black h-full inline-block"
                    style={{ width: `${w * 1.5}px` }}
                  />
                )
              )}
            </div>
            <p className="text-[9px] text-black/40 tracking-widest font-mono">
              TC-2026-COUPLE-RESONANCE-PASS
            </p>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-black/5 hover:bg-black/10 text-black font-semibold text-[11px] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép text' : 'Sao chép'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#13111E] hover:bg-[#27233D] text-[#C9A24A] font-semibold text-[11px] transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ Story</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
