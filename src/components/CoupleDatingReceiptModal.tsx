'use client';

import React, { useState, useRef } from 'react';
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
  Flame,
  CheckCircle2,
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
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const receiptCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const now = new Date();
  const todayStr = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeStr = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const billCode = `TC-${Math.abs(compatScore * 137 + redFlagLevel * 41) % 90000 + 10000}`;

  const receiptText = `🧾 TIỆM TẠP HÓA DUYÊN NỢ • TAROT COUPLE
Số hóa đơn: #${billCode}
Khách A: @${ownerNickname}  |  Khách B: @${partnerNickname}
Mối quan hệ: ${relationshipLabel}
Thời gian: ${timeStr} - ${todayStr}
Thu ngân: Reader ${readerName}
------------------------------------------------
01. Ánh mắt đầu tiên & Phút bối rối         0đ
02. Thao thức đêm khuya suy nghĩ         99.000đ
03. Lá bài Người A (${c1Name})           Năng lượng mở
04. Lá bài Người B (${c2Name})           Năng lượng đón
05. Lá cầu nối (${c3Name})               Sợi chỉ đỏ
06. VAT Tình Cảm (Thuế yêu thương)        +100%
07. Voucher "Duyên Nợ Trời Ban"          -99.000đ
------------------------------------------------
TỔNG CỘNG: THÀNH ĐÔI HOẶC BỎ QUA
✦ Độ Hợp Cạ: ${compatScore}%
🚩 Máy Đo Red Flag: ${redFlagLevel}%
🔮 Tần Số Vibe: ${vibeTag}
------------------------------------------------
Lời dặn: "${savageQuote || verdictSnippet}"
👉 Bói đôi cùng người ấy tại: tarotcouple.vercel.app`;

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

  /**
   * Generates high-res Vintage Paper PNG image using HTML5 Canvas directly in browser
   */
  const handleDownloadPNG = () => {
    soundManager.playCrispClick();
    setIsExporting(true);

    try {
      const width = 640;
      const height = 980;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background Vintage Paper
      ctx.fillStyle = '#F8F5EE';
      ctx.fillRect(0, 0, width, height);

      // Paper grain subtle lines
      ctx.fillStyle = '#EDE8DC';
      for (let i = 0; i < height; i += 6) {
        if (i % 12 === 0) {
          ctx.fillRect(0, i, width, 1);
        }
      }

      // Top Serrated Tear Border (Răng cưa cắt giấy trên)
      ctx.fillStyle = '#14111C';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const teeth = 32;
      const toothWidth = width / teeth;
      for (let i = 0; i < teeth; i++) {
        ctx.lineTo((i + 0.5) * toothWidth, 12);
        ctx.lineTo((i + 1) * toothWidth, 0);
      }
      ctx.closePath();
      ctx.fill();

      // Bottom Serrated Tear Border (Răng cưa cắt giấy dưới)
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let i = 0; i < teeth; i++) {
        ctx.lineTo((i + 0.5) * toothWidth, height - 12);
        ctx.lineTo((i + 1) * toothWidth, height);
      }
      ctx.closePath();
      ctx.fill();

      // Inner receipt boundary border
      ctx.strokeStyle = '#D5CEBC';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 24, width - 40, height - 48);

      // Header Typography
      ctx.fillStyle = '#1F1A28';
      ctx.textAlign = 'center';

      // Icon / Store Name
      ctx.font = 'bold 22px "Courier New", Courier, monospace';
      ctx.fillText('TIỆM TẠP HÓA DUYÊN NỢ', width / 2, 60);

      ctx.font = '13px "Courier New", Courier, monospace';
      ctx.fillStyle = '#787063';
      ctx.fillText('✦ TAROT COUPLE SANCTUARY • BIÊN NHẬN ĐÔI ✦', width / 2, 82);

      ctx.fillStyle = '#2A2533';
      ctx.font = 'bold 15px "Courier New", Courier, monospace';
      ctx.fillText(`HÓA ĐƠN #${billCode}`, width / 2, 108);

      ctx.font = '12px "Courier New", Courier, monospace';
      ctx.fillStyle = '#666055';
      ctx.fillText(`${timeStr} - ${todayStr}  •  Thu ngân: Reader ${readerName}`, width / 2, 128);

      // Dotted Divider Helper
      const drawDotted = (y: number) => {
        ctx.strokeStyle = '#999283';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(width - 40, y);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawDotted(146);

      // Customer Info Row
      ctx.textAlign = 'left';
      ctx.font = 'bold 13px "Courier New", Courier, monospace';
      ctx.fillStyle = '#1F1A28';
      ctx.fillText(`KHÁCH A: @${ownerNickname}`, 42, 170);
      ctx.fillText(`KHÁCH B: @${partnerNickname}`, width / 2 + 10, 170);

      ctx.font = '12px "Courier New", Courier, monospace';
      ctx.fillStyle = '#787063';
      ctx.fillText(`Trạng thái: ${relationshipLabel}`, 42, 192);
      ctx.fillText(`Thời hạn: Lưu trữ 48 giờ`, width / 2 + 10, 192);

      drawDotted(208);

      // Table Header
      ctx.font = 'bold 12px "Courier New", Courier, monospace';
      ctx.fillStyle = '#4A4335';
      ctx.fillText('MẶT HÀNG DUYÊN NỢ', 42, 230);
      ctx.textAlign = 'right';
      ctx.fillText('ĐƠN GIÁ', width - 42, 230);

      // Line Items
      const items = [
        { label: '01. Ánh mắt đầu tiên & Phút bối rối', price: '0 VNĐ' },
        { label: '02. Phí thao thức đêm suy nghĩ', price: '99.000 VNĐ' },
        { label: `03. Lá bài Bạn: ${c1Name}`, price: 'Năng lượng mở' },
        { label: `04. Lá bài Người ấy: ${c2Name}`, price: 'Năng lượng đón' },
        { label: `05. Lá kết nối: ${c3Name}`, price: 'Sợi chỉ đỏ' },
        { label: '06. Thuế VAT Tình Cảm', price: '+100%' },
        { label: '07. Voucher "Duyên Nợ Trời Ban"', price: '-99.000 VNĐ' },
      ];

      ctx.font = '12px "Courier New", Courier, monospace';
      let currentY = 260;
      items.forEach((item, idx) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = idx === 6 ? '#2A7221' : '#2C2735';
        ctx.fillText(item.label, 42, currentY);

        ctx.textAlign = 'right';
        ctx.fillText(item.price, width - 42, currentY);
        currentY += 26;
      });

      drawDotted(currentY + 5);
      currentY += 30;

      // Score Metrics Big Box
      ctx.fillStyle = '#ECE6D6';
      ctx.fillRect(40, currentY, width - 80, 80);
      ctx.strokeStyle = '#C9A24A';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(40, currentY, width - 80, 80);

      // Compatibility
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1B7340';
      ctx.font = 'bold 28px "Courier New", Courier, monospace';
      ctx.fillText(`${compatScore}%`, width / 4 + 20, currentY + 45);
      ctx.font = 'bold 11px "Courier New", Courier, monospace';
      ctx.fillText('ĐỘ HỢP CẠ', width / 4 + 20, currentY + 65);

      // Red Flag
      ctx.fillStyle = '#A31D1D';
      ctx.font = 'bold 28px "Courier New", Courier, monospace';
      ctx.fillText(`${redFlagLevel}%`, (width * 3) / 4 - 20, currentY + 45);
      ctx.font = 'bold 11px "Courier New", Courier, monospace';
      ctx.fillText('MÁY ĐO RED FLAG 🚩', (width * 3) / 4 - 20, currentY + 65);

      currentY += 105;

      // Vibe Badge
      ctx.fillStyle = '#C9A24A';
      ctx.font = 'bold 14px "Courier New", Courier, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`✦ ${vibeTag} ✦`, width / 2, currentY);

      currentY += 28;

      // Savage Quote Box
      ctx.fillStyle = '#F0EBDE';
      ctx.fillRect(40, currentY, width - 80, 75);
      ctx.strokeStyle = '#D5CEBC';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, currentY, width - 80, 75);

      ctx.fillStyle = '#1F1A28';
      ctx.font = 'italic 12px "Courier New", Courier, monospace';
      ctx.textAlign = 'center';

      const quote = savageQuote || verdictSnippet;
      const quoteWords = quote.split(' ');
      let line1 = '';
      let line2 = '';
      quoteWords.forEach((w) => {
        if ((line1 + w).length < 42) {
          line1 += (line1 ? ' ' : '') + w;
        } else {
          line2 += (line2 ? ' ' : '') + w;
        }
      });

      ctx.fillText(`"${line1}"`, width / 2, currentY + 32);
      if (line2) {
        ctx.fillText(`"${line2}"`, width / 2, currentY + 52);
      }

      currentY += 100;
      drawDotted(currentY);
      currentY += 20;

      // Barcode Representation
      ctx.fillStyle = '#1A1624';
      const barcodeY = currentY;
      const barPattern = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3];
      let barX = width / 2 - 120;
      barPattern.forEach((w) => {
        ctx.fillRect(barX, barcodeY, w, 38);
        barX += w + 2;
      });

      ctx.font = '11px "Courier New", Courier, monospace';
      ctx.fillStyle = '#554F42';
      ctx.textAlign = 'center';
      ctx.fillText(`* ${billCode} • TAROTCOUPLE *`, width / 2, barcodeY + 54);

      // Footer
      ctx.font = '10px "Courier New", Courier, monospace';
      ctx.fillStyle = '#776F60';
      ctx.fillText('Cảm ơn quý khách đã tin tưởng vào nhân duyên vũ trụ!', width / 2, height - 38);

      // Download file
      const link = document.createElement('a');
      link.download = `hoa-don-tinh-duyen-${ownerNickname}-${partnerNickname}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      soundManager.playMysticChime();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2800);
    } catch {
      // ignore
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Hóa Đơn Tình Duyên Cặp Đôi"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-md my-auto"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hóa đơn"
            className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-[#1C182A] border border-[#C9A24A]/60 text-[#F8F5F0] hover:text-[#C9A24A] flex items-center justify-center transition shadow-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* THE VINTAGE RECEIPT CONTAINER */}
          <div
            ref={receiptCardRef}
            className="rounded-3xl bg-[#FAF8F5] text-[#1E1A29] p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] font-mono text-xs relative overflow-hidden border-t-8 border-[#C9A24A]"
            style={{
              backgroundImage: 'radial-gradient(#EDE8DC 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-black/25">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#14111C] text-[#C9A24A] mb-1 shadow-md">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm sm:text-base tracking-widest uppercase text-[#14111C]">
                TIỆM TẠP HÓA DUYÊN NỢ
              </h3>
              <p className="text-[10px] text-black/60 uppercase tracking-wider">
                TAROT COUPLE SANCTUARY • BIÊN NHẬN ĐÔI
              </p>
              <div className="pt-2 text-[10px] text-black/65 flex items-center justify-between font-bold">
                <span>MÃ: #{billCode}</span>
                <span>{timeStr} • {todayStr}</span>
              </div>
              <div className="text-[10px] text-black/55 text-right">
                Thu ngân: Reader {readerName}
              </div>
            </div>

            {/* Customers & Relationship Info */}
            <div className="py-3 border-b border-dashed border-black/25 space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="font-bold text-black">{`KHÁCH: @${ownerNickname} & @${partnerNickname}`}</span>
                <span className="text-black/60 text-[10px]">Lưu: 48 Giờ</span>
              </div>
              <div className="flex justify-between text-black/70">
                <span>Mối quan hệ: <strong>{relationshipLabel}</strong></span>
              </div>
            </div>

            {/* Receipt Table Items */}
            <div className="py-3 border-b border-dashed border-black/25 space-y-2">
              <div className="flex justify-between text-[10px] text-black/50 font-bold uppercase">
                <span>Mặt hàng duyên nợ</span>
                <span>Đơn giá</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>01. Ánh mắt đầu tiên & Lúng túng</span>
                  <span>0đ</span>
                </div>
                <div className="flex justify-between">
                  <span>02. Thao thức đêm suy nghĩ lung tung</span>
                  <span>99.000đ</span>
                </div>
                <div className="flex justify-between text-[#8B5CF6]">
                  <span className="truncate max-w-[210px]">03. Lá Bạn: {c1Name}</span>
                  <span>Mở</span>
                </div>
                <div className="flex justify-between text-[#E879A8]">
                  <span className="truncate max-w-[210px]">04. Lá Người ấy: {c2Name}</span>
                  <span>Đón</span>
                </div>
                <div className="flex justify-between text-[#C9A24A] font-bold">
                  <span className="truncate max-w-[210px]">05. Lá kết nối: {c3Name}</span>
                  <span>Sợi chỉ đỏ</span>
                </div>
                <div className="flex justify-between text-black/60">
                  <span>06. VAT Tình Cảm (Thuế yêu thương)</span>
                  <span>+100%</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>07. Voucher "Duyên Nợ Trời Ban"</span>
                  <span>-99.000đ</span>
                </div>
              </div>
            </div>

            {/* Score & Vibe Box */}
            <div className="my-3.5 p-3 rounded-2xl bg-white/90 border border-black/15 shadow-sm space-y-2">
              <div className="grid grid-cols-2 gap-2 text-center divide-x divide-black/10">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                    Độ Hợp Cạ
                  </span>
                  <div className="text-2xl font-black text-emerald-600">
                    {compatScore}%
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-rose-700 flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-rose-600" />
                    Red Flag 🚩
                  </span>
                  <div className="text-2xl font-black text-rose-600">
                    {redFlagLevel}%
                  </div>
                </div>
              </div>

              <div className="text-center pt-1 border-t border-dashed border-black/10">
                <span className="text-[11px] font-bold text-[#8B5CF6]">
                  ✦ {vibeTag} ✦
                </span>
              </div>
            </div>

            {/* Quote Box */}
            <div className="p-2.5 rounded-xl bg-black/5 text-center text-[11px] italic text-black/80 my-3">
              "{savageQuote || verdictSnippet}"
            </div>

            {/* Barcode SVG representation */}
            <div className="text-center pt-2 space-y-1">
              <div className="h-9 w-48 mx-auto flex items-center justify-between px-2 bg-black/5 rounded">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 1, 4, 2, 1, 3].map((w, i) => (
                  <span
                    key={i}
                    className="h-7 bg-black inline-block rounded-xs"
                    style={{ width: `${w * 1.5}px` }}
                  />
                ))}
              </div>
              <p className="text-[9px] text-black/50 tracking-widest uppercase">
                * {billCode} • TAROTCOUPLE *
              </p>
            </div>

            {/* Bottom tear aesthetic footer */}
            <div className="pt-3 text-center text-[9px] text-black/45">
              Cảm ơn quý khách đã tin tưởng vào nhân duyên vũ trụ!
            </div>
          </div>

          {/* Feedback alerts */}
          {downloadSuccess && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đã tải Hóa Đơn PNG về máy thành công!</span>
            </div>
          )}

          {/* Action Buttons Toolbar */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPNG}
              className="py-3 px-3.5 rounded-2xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(201,162,74,0.4)] hover:brightness-110 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Đang tạo...' : 'Tải Ảnh PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="py-3 px-3.5 rounded-2xl bg-[#14111C] hover:bg-[#1E192B] border border-[#C9A24A]/40 text-[#F8F5F0] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép text!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#C9A24A]" />
                  <span>Sao chép Bill</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CoupleDatingReceiptModal;
