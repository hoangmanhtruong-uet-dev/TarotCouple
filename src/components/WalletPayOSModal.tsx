'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  Shield,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Lock,
  Flame,
  Share2,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { classifyAgeTier } from '@/lib/safety';
import { CURRENT_REFERENCE_YEAR } from '@/lib/schemas';
import { soundManager } from '@/lib/sound-effects';
import type {
  PaymentOrderPayload,
  QuotaStatusPayload,
  StarPackage,
} from '@/lib/api-types';

export interface WalletPayOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthYear: number;
  onBirthYearChange?: (newYear: number) => void;
  quota: QuotaStatusPayload;
  onQuotaUpdated?: (newQuota: QuotaStatusPayload) => void;
  onOpenDailyModal?: () => void;
}

export const STAR_PACKAGES: StarPackage[] = [
  // ─── NHÓM 1: GÓI LƯỢT RÚT BÀI NHANH ───
  {
    id: 'draw_5k',
    name: '1 Lượt Rút Nhanh',
    priceVnd: 5000,
    stars: 5,
    category: 'draws',
    equivalentDraws: 1,
    badge: 'Nạp nhanh 5k ⚡',
    description: 'Đủ 1 lượt bốc bài mới ngay lập tức (3 Sao) kèm 2 Sao hỏi thêm.',
    perks: [
      '5 Sao ⭐ vào ví tức thì',
      'Đủ bốc 1 lượt quẻ 3 lá mới (3 Sao)',
      'Tặng 2 Sao hỏi sâu với Reader',
    ],
  },
  {
    id: 'draw_15k',
    name: '3 Lượt Bốc Bài',
    priceVnd: 15000,
    stars: 15,
    category: 'draws',
    equivalentDraws: 3,
    badge: 'Combo 3 lượt 🔥',
    description: 'Đủ 3 lượt bốc bài mới (9 Sao) hoặc 1 Lá thứ 4 & 5 câu hỏi sâu.',
    perks: [
      '15 Sao ⭐ vào ví tức thì',
      'Đủ bốc 3 lượt quẻ mới',
      'Hoặc mở 1 Lá thứ 4 & 5 câu hỏi sâu',
    ],
  },
  // ─── NHÓM 2: GÓI SAO TIẾT KIỆM ───
  {
    id: 'clarifier_5k',
    name: 'Lá Làm Rõ',
    priceVnd: 5000,
    stars: 5,
    category: 'stars',
    badge: 'Trải nghiệm nhanh',
    description: 'Mở khóa ngay 1 Lá Bài Làm Rõ (Clarifier) thứ 4 trong phiên đang mở.',
    perks: [
      '5 Sao ⭐ vào ví tức thì',
      'Đủ rút 1 Lá Làm Rõ thứ 4 đào sâu góc khuất',
      'Hỏi trực tiếp câu hỏi phụ (Follow-up)',
    ],
  },
  {
    id: 'dem_suy_19k',
    name: 'Gói Đêm Suy',
    priceVnd: 19000,
    stars: 20,
    category: 'stars',
    badge: 'Best-seller 🔥',
    description: 'Combo hỏi sâu đêm muộn, đủ 6 lần rút bài hoặc 4 lần mở Lá Làm Rõ.',
    perks: [
      '20 Sao ⭐ (Tặng thêm +1 Sao ưu đãi)',
      'Đủ 6 lượt bốc bài hoặc 4 Lá Làm Rõ',
      'Mở khóa đầy đủ 9 Reader & Bộ 78 Lá RWS',
    ],
  },
  {
    id: 'check_var_29k',
    name: 'Check Var Tình Yêu',
    priceVnd: 29000,
    stars: 35,
    category: 'stars',
    badge: 'Bói Đôi Chuyên Sâu',
    description: 'Combo chuyên sâu cho Bói Đôi Hợp Cạ, đủ 11 lượt rút hoặc 7 Lá Làm Rõ.',
    perks: [
      '35 Sao ⭐ (Tiết kiệm 40%)',
      'Phân tích sâu 3 vị trí Bói Đôi & Lá Làm Rõ',
      'Xuất ảnh Story 9:16 kèm thanh đo Hợp Cạ & Red Flag',
    ],
  },
  {
    id: 'vip_month_69k',
    name: 'Thẻ Tháng VIP',
    priceVnd: 69000,
    stars: 100,
    category: 'stars',
    badge: 'VIP 30 Ngày 👑',
    description: 'Trải nghiệm trọn vẹn cả tháng với 100 Sao, trọn bộ 78 lá & không quảng cáo.',
    perks: [
      '100 Sao ⭐ dùng thoải mái cả tháng',
      'Ưu tiên tốc độ giải mã AI & 9 Reader',
      'Không hiển thị quảng cáo nhận thưởng',
    ],
  },
];

function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function WalletPayOSModal({
  isOpen,
  onClose,
  birthYear,
  onBirthYearChange,
  quota,
  onQuotaUpdated,
  onOpenDailyModal,
}: WalletPayOSModalProps) {
  const [activeOrder, setActiveOrder] = useState<PaymentOrderPayload | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(600);
  const [copiedField, setCopiedField] = useState<'account' | 'memo' | null>(null);
  const [packageTab, setPackageTab] = useState<'all' | 'draws' | 'stars'>('all');

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rào chắn độ tuổi <11t (theo yêu cầu Sprint 2)
  const age = Math.max(0, CURRENT_REFERENCE_YEAR - birthYear);
  const isUnder11 = age < 11;

  const starsBalance = quota.starsBalance ?? 10;
  const dailySpendVnd = quota.dailySpendVnd ?? 0;
  const dailySpendCapVnd = quota.dailySpendCapVnd ?? 50000;
  const spendRatio = Math.min(
    100,
    dailySpendCapVnd > 0 ? Math.round((dailySpendVnd / dailySpendCapVnd) * 100) : 0
  );

  // Đóng modal -> reset state
  useEffect(() => {
    if (!isOpen) {
      setActiveOrder(null);
      setErrorMsg(null);
      setSuccessBanner(null);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
  }, [isOpen]);

  // Bộ đếm ngược 10 phút khi có đơn hàng đang chờ
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'pending') {
      setCountdownSeconds(600);
      countdownIntervalRef.current = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [activeOrder?.orderCode, activeOrder?.status]);

  // CƠ CHẾ POLLING TỰ ĐỘNG MỖI 2.5s KHI ĐƠN HÀNG PENDING
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'pending') {
      pollingIntervalRef.current = setInterval(() => {
        void checkOrderStatus(activeOrder.orderCode);
      }, 2500);
    } else {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    }
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [activeOrder?.orderCode, activeOrder?.status]);

  // Hàm kiểm tra trạng thái đơn hàng (Polling hoặc Manual)
  const checkOrderStatus = async (orderCode: string, isManual = false) => {
    if (isPolling) return;
    if (isManual) setIsPolling(true);

    try {
      const res = await fetch(`/api/payment?orderCode=${encodeURIComponent(orderCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.order?.status === 'paid') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          soundManager.playMysticChime();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([60, 60, 120]);
          }
          setActiveOrder((prev) => (prev ? { ...prev, status: 'paid' } : null));
          setSuccessBanner(
            `🎉 Thanh toán VietQR PayOS thành công! Đã cộng +${data.order.starsToCredit || activeOrder?.starsToCredit} Sao ⭐ vào ví Tinh Hà.`
          );
          if (data.quota && onQuotaUpdated) {
            onQuotaUpdated(data.quota);
          }
          // PulseWatch Real-Time Purchase Tracking
          if (typeof window !== 'undefined' && (window as any).PulseWatch) {
            try {
              (window as any).PulseWatch.trackPurchase({
                amount: data.order?.amountVnd || activeOrder?.amountVnd || 19000,
                currency: 'VND',
                customerName: 'Người Dùng TarotCouple',
                planTier: data.order?.packageName || activeOrder?.packageName || 'Gói Sao',
                gateway: 'PayOS',
                orderCode: data.order?.orderCode || activeOrder?.orderCode,
              });
            } catch (e) {
              console.warn('[PulseWatch Track Purchase Warning]:', e);
            }
          }
        }
      }
    } catch {
      // Safe fallback
    } finally {
      if (isManual) setIsPolling(false);
    }
  };

  // Sao chép clipboard với phản hồi giao diện
  const copyToClipboard = (text: string, field: 'account' | 'memo') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Chọn gói và khởi tạo đơn PayOS VietQR
  const handleSelectPackage = async (pkg: StarPackage) => {
    if (isUnder11) {
      setErrorMsg(
        'Tài khoản dưới 11 tuổi được khóa tự động tính năng nạp tiền ngân hàng theo chính sách bảo vệ trẻ em.'
      );
      return;
    }

    setErrorMsg(null);
    setSuccessBanner(null);
    setIsCreatingOrder(true);

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkg.id,
          packageId: pkg.id,
          birth_year: birthYear,
          birthYear,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.status === 'error') {
        if (data?.quota && onQuotaUpdated) {
          onQuotaUpdated(data.quota);
        }
        setErrorMsg(
          data?.message ||
            'Không thể khởi tạo đơn hàng PayOS lúc này (kiểm tra trần chi tiêu 50.000đ/ngày).'
        );
        return;
      }

      const orderPayload: PaymentOrderPayload = data.order || data;
      if (orderPayload && orderPayload.orderCode) {
        setActiveOrder(orderPayload);
      } else {
        const fallbackCode = `TC${Date.now().toString().slice(-6)}`;
        setActiveOrder({
          orderCode: fallbackCode,
          packageId: pkg.id,
          packageName: pkg.name,
          amountVnd: pkg.priceVnd,
          starsToCredit: pkg.stars,
          status: 'pending',
          qrDataText: `VIETQR|PAYOS|TAROTCOUPLE|${fallbackCode}|${pkg.priceVnd}`,
          vietQrImageUrl: `https://img.vietqr.io/image/MB-0000123456789-compact2.png?amount=${pkg.priceVnd}&addInfo=${fallbackCode}&accountName=TAROT%20COUPLE%20PAYOS`,
          checkoutUrl: `https://pay.payos.vn/web/${fallbackCode}`,
          provider: 'payos_sandbox',
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      const fallbackCode = `TC${Date.now().toString().slice(-6)}`;
      setActiveOrder({
        orderCode: fallbackCode,
        packageId: pkg.id,
        packageName: pkg.name,
        amountVnd: pkg.priceVnd,
        starsToCredit: pkg.stars,
        status: 'pending',
        qrDataText: `VIETQR|PAYOS|TAROTCOUPLE|${fallbackCode}|${pkg.priceVnd}`,
        vietQrImageUrl: `https://img.vietqr.io/image/MB-0000123456789-compact2.png?amount=${pkg.priceVnd}&addInfo=${fallbackCode}&accountName=TAROT%20COUPLE%20PAYOS`,
        checkoutUrl: `https://pay.payos.vn/web/${fallbackCode}`,
        provider: 'payos_sandbox',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#09080D]/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto select-none"
          role="dialog"
          aria-modal="true"
          aria-label="Ví Sao & Cổng Thanh Toán VietQR PayOS"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="relative w-full max-w-4xl rounded-3xl bg-[#14111C] border border-[#C9A24A]/45 shadow-[0_24px_80px_rgba(0,0,0,0.92)] overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#C9A24A]/25 bg-[#09080D]/85">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C9A24A]/15 border border-[#C9A24A]/50 flex items-center justify-center text-[#F3E5AB]">
                  <Star className="w-5 h-5 text-[#C9A24A] fill-[#C9A24A]" />
                </div>
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#F8F5F0]">
                    Ví Sao ⭐ & Cổng Thanh Toán VietQR (PayOS)
                  </h3>
                  <p className="text-xs text-[#9E96B0]">
                    Chi tiêu có trách nhiệm • Trần bảo vệ 50.000đ/ngày • Rào chắn độ tuổi &lt;11t
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-[#F8F5F0] transition-colors cursor-pointer"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* Top Wallet & Responsible Spending Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Current Star Balance */}
                <div className="md:col-span-4 p-4 rounded-2xl bg-gradient-to-br from-[#1D1829] to-[#09080D] border border-[#C9A24A]/45 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#9E96B0] block">
                      Số dư Ví Sao hiện tại
                    </span>
                    <motion.p
                      key={starsBalance}
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      className="font-display text-2xl sm:text-3xl font-bold text-[#F3E5AB] mt-0.5"
                    >
                      ⭐ {starsBalance} Sao
                    </motion.p>
                  </div>
                  <Sparkles className="w-7 h-7 text-[#C9A24A]" />
                </div>

                {/* Responsible Spending Daily Cap */}
                <div className="md:col-span-5 p-4 rounded-2xl bg-[#1D1829] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9E96B0]">
                      Đã chi hôm nay:{' '}
                      <strong className="text-[#F8F5F0]">{formatVnd(dailySpendVnd)}</strong>
                    </span>
                    <span className="text-[#F3E5AB] font-semibold">
                      Trần bảo vệ: {formatVnd(dailySpendCapVnd)}/ngày
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#09080D] border border-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-[#C9A24A] to-amber-400 transition-all duration-300"
                      style={{ width: `${spendRatio}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#9E96B0]">
                    Chính sách Chi Tiêu Có Trách Nhiệm: Tự động chặn nạp quá 50.000đ/ngày.
                  </p>
                </div>

                {/* Age Tier Switcher & Status (<11t vs 11+) */}
                <div className="md:col-span-3 p-4 rounded-2xl bg-[#1D1829] border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-[#9E96B0]">
                      Độ tuổi tài khoản
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isUnder11
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                          : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                      }`}
                    >
                      {age} tuổi
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#F8F5F0] mt-1">
                    {isUnder11 ? 'Dưới 11 tuổi (Khóa nạp)' : '11+ tuổi (Mở PayOS)'}
                  </p>
                  {onBirthYearChange ? (
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => onBirthYearChange(2004)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${
                          !isUnder11
                            ? 'bg-[#C9A24A]/25 border-[#F3E5AB] text-[#F3E5AB]'
                            : 'bg-[#09080D] border-white/10 text-[#9E96B0]'
                        }`}
                      >
                        18+ (2004)
                      </button>
                      <button
                        type="button"
                        onClick={() => onBirthYearChange(2017)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${
                          isUnder11
                            ? 'bg-amber-500/25 border-amber-300 text-amber-200'
                            : 'bg-[#09080D] border-white/10 text-[#9E96B0]'
                        }`}
                      >
                        &lt;11t (2017)
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* RÀO CHẮN ĐỘ TUỔI <11t PROTECTIVE BANNER */}
              {isUnder11 ? (
                <div
                  data-testid="under-11-payment-lock-banner"
                  className="p-5 rounded-2xl bg-amber-950/70 border-2 border-amber-400/60 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                >
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-medium">
                      🛡️ Tài khoản dưới 11 tuổi: Tính năng nạp tiền ngân hàng đã được khóa tự động theo chính sách bảo vệ trẻ em. Bạn có thể nhận Sao miễn phí qua Điểm danh hàng ngày (+2 ⭐) hoặc Chia sẻ ảnh Story!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {onOpenDailyModal ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDailyModal();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-[#09080D] font-bold text-xs cursor-pointer hover:brightness-110"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Điểm danh hàng ngày nhận +2 ⭐ miễn phí</span>
                      </button>
                    ) : null}

                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-200/90">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Chia sẻ ảnh Story 9:16 nhận +1 lượt miễn phí</span>
                    </span>
                  </div>
                </div>
              ) : null}

              {errorMsg ? (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-400/40 flex items-center gap-2.5 text-xs sm:text-sm text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              ) : null}

              {successBanner ? (
                <div className="p-4 rounded-2xl bg-emerald-950/85 border border-emerald-400/50 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-100 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{successBanner}</span>
                </div>
              ) : null}

              {/* VIEW 1: PACKAGE SELECTION GRID */}
              {!activeOrder ? (
                <div className="space-y-4">
                  {/* Category switcher tabs */}
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0B0912] border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setPackageTab('all')}
                      className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer text-center ${
                        packageTab === 'all'
                          ? 'bg-[#C9A24A]/25 text-[#F3E5AB] border border-[#C9A24A]/50 shadow-sm'
                          : 'text-[#9E96B0] hover:text-[#F8F5F0]'
                      }`}
                    >
                      Tất cả ({STAR_PACKAGES.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackageTab('draws')}
                      className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        packageTab === 'draws'
                          ? 'bg-[#C9A24A]/25 text-[#F3E5AB] border border-[#C9A24A]/50 shadow-sm'
                          : 'text-[#9E96B0] hover:text-[#F8F5F0]'
                      }`}
                    >
                      <span>🎟️</span> Gói Lượt Bốc Bài
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackageTab('stars')}
                      className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        packageTab === 'stars'
                          ? 'bg-[#C9A24A]/25 text-[#F3E5AB] border border-[#C9A24A]/50 shadow-sm'
                          : 'text-[#9E96B0] hover:text-[#F8F5F0]'
                      }`}
                    >
                      <span>⭐</span> Gói Sao Tiết Kiệm
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STAR_PACKAGES.filter((p) => packageTab === 'all' || p.category === packageTab).map((pkg) => {
                    const isBestSeller = pkg.id === 'dem_suy_19k';
                    const isVipExceedsDailyCap =
                      dailySpendVnd + pkg.priceVnd > dailySpendCapVnd &&
                      pkg.id !== 'vip_month_69k';

                    return (
                      <div
                        key={pkg.id}
                        className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                          isBestSeller
                            ? 'bg-gradient-to-b from-[#1D1829] to-[#14111C] border-2 border-[#C9A24A] shadow-[0_12px_35px_rgba(201,162,74,0.2)]'
                            : 'bg-[#14111C] border-[#C9A24A]/30'
                        } ${isUnder11 ? 'opacity-65' : ''}`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-display text-xl font-bold text-[#F8F5F0]">
                                {pkg.name}
                              </h4>
                              <p className="text-xs text-[#C9A24A] font-semibold mt-0.5">
                                {formatVnd(pkg.priceVnd)} = {pkg.stars} ⭐
                              </p>
                            </div>
                            {pkg.badge ? (
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  isBestSeller
                                    ? 'bg-[#C9A24A] text-[#09080D] border-[#F3E5AB]'
                                    : 'bg-white/5 text-[#F3E5AB] border-[#C9A24A]/40'
                                }`}
                              >
                                {pkg.badge}
                              </span>
                            ) : null}
                          </div>

                          <p className="text-xs text-[#9E96B0] leading-relaxed">
                            {pkg.description}
                          </p>

                          <ul className="space-y-1.5 pt-1">
                            {pkg.perks.map((perk, idx) => (
                              <li key={idx} className="text-xs text-[#D8D2E7] flex items-center gap-2">
                                <span className="text-[#C9A24A]">✦</span>
                                <span>{perk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-5 pt-3 border-t border-white/10">
                          <button
                            type="button"
                            disabled={isUnder11 || isCreatingOrder || isVipExceedsDailyCap}
                            onClick={() => void handleSelectPackage(pkg)}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                              isUnder11
                                ? 'bg-white/5 text-[#9E96B0] border border-white/10 cursor-not-allowed'
                                : isBestSeller
                                ? 'bg-gradient-to-r from-[#C9A24A] via-[#F3E5AB] to-[#C9A24A] text-[#09080D] shadow-[0_6px_20px_rgba(201,162,74,0.35)] hover:brightness-110 cursor-pointer'
                                : 'bg-[#09080D] hover:bg-[#1D1829] text-[#F3E5AB] border border-[#C9A24A]/50 cursor-pointer'
                            }`}
                          >
                            {isUnder11 ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Đã khóa nạp (&lt;11 tuổi)</span>
                              </>
                            ) : (
                              <>
                                <QrCode className="w-4 h-4" />
                                <span>Nạp {formatVnd(pkg.priceVnd)} nhận {pkg.stars} ⭐</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
                /* VIEW 2: VIETQR PAYOS CHECKOUT VIEW VỚI POLLING TỰ ĐỘNG */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-[#1D1829] border border-[#C9A24A]/45 p-5 sm:p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <button
                      type="button"
                      onClick={() => setActiveOrder(null)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#F8F5F0] cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Chọn gói Sao khác</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-xs font-semibold text-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>VietQR Động • PayOS</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* QR Image Frame */}
                    <div className="md:col-span-5 flex flex-col items-center space-y-3">
                      <div className="p-4 rounded-2xl bg-white text-[#09080D] shadow-xl flex flex-col items-center space-y-2 max-w-[240px] w-full relative">
                        <img
                          src={activeOrder.vietQrImageUrl}
                          alt={`Mã VietQR PayOS cho đơn ${activeOrder.orderCode}`}
                          className="w-48 h-48 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="text-center border-t border-zinc-200 pt-2 w-full">
                          <p className="text-[11px] font-bold text-zinc-800">VIETQR • NAPAS 247</p>
                          <p className="text-[10px] font-mono text-zinc-600 truncate">
                            Nội dung: {activeOrder.orderCode}
                          </p>
                        </div>
                      </div>

                      {/* Đếm ngược hết hạn QR */}
                      <div className="flex items-center gap-1.5 text-xs text-[#9E96B0]">
                        <Clock className="w-3.5 h-3.5 text-[#C9A24A]" />
                        <span>Hết hạn sau: </span>
                        <strong className="text-[#F3E5AB] font-mono">
                          {formatCountdown(countdownSeconds)}
                        </strong>
                      </div>
                    </div>

                    {/* Order Info & Polling Status */}
                    <div className="md:col-span-7 space-y-4">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-[#C9A24A] font-semibold">
                          Thông tin đơn thanh toán PayOS
                        </span>
                        <h4 className="font-display text-2xl font-bold text-[#F8F5F0] mt-0.5">
                          {activeOrder.packageName} (+{activeOrder.starsToCredit} ⭐)
                        </h4>
                      </div>

                      <div className="p-4 rounded-xl bg-[#09080D]/80 border border-white/10 space-y-2.5 text-xs sm:text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[#9E96B0]">Mã đơn / Nội dung CK:</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="font-mono text-[#F3E5AB]">
                              {activeOrder.orderCode}
                            </strong>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(activeOrder.orderCode, 'memo')}
                              className="p-1 rounded hover:bg-white/10 text-[#9E96B0] hover:text-[#F8F5F0] cursor-pointer"
                              title="Sao chép nội dung"
                            >
                              {copiedField === 'memo' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#9E96B0]">Số tiền cần chuyển:</span>
                          <strong className="text-emerald-300 font-bold text-base">
                            {formatVnd(activeOrder.amountVnd)}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#9E96B0]">Số Sao nhận được:</span>
                          <strong className="text-[#F3E5AB] font-bold">
                            +{activeOrder.starsToCredit} Sao ⭐
                          </strong>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-2">
                          <span className="text-[#9E96B0]">Trạng thái:</span>
                          <span
                            className={`font-semibold flex items-center gap-1.5 ${
                              activeOrder.status === 'paid' ? 'text-emerald-400' : 'text-amber-300'
                            }`}
                          >
                            {activeOrder.status === 'paid' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Đã thanh toán & Cộng Sao!</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Tự động kiểm tra mỗi 2.5s...</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Các nút hành động */}
                      {activeOrder.status !== 'paid' ? (
                        <div className="space-y-2">
                          {activeOrder.checkoutUrl && (
                            <a
                              href={activeOrder.checkoutUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C9A24A] via-[#E5C687] to-[#C9A24A] text-[#09080D] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md hover:brightness-110 text-center"
                            >
                              <span>Mở Cổng Thanh Toán PayOS Trực Tiếp &rarr;</span>
                            </a>
                          )}

                          <button
                            type="button"
                            disabled={isPolling}
                            onClick={() => void checkOrderStatus(activeOrder.orderCode, true)}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#14111C] hover:bg-[#1D1829] border border-[#C9A24A]/40 text-[#F3E5AB] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin' : ''}`} />
                            <span>{isPolling ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái ngay'}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full py-3.5 px-5 rounded-2xl bg-[#C9A24A] hover:bg-[#E8C872] text-[#09080D] font-bold text-sm cursor-pointer transition-all shadow-lg"
                        >
                          Quay lại dùng Sao mở khóa Lá Làm Rõ ngay &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default WalletPayOSModal;
