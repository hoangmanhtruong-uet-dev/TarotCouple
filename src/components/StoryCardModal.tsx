'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Share2,
  EyeOff,
  Eye,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import type { ReadingSuccessResponse, QuotaStatusPayload } from '@/lib/api-types';

export interface StoryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  readingData: ReadingSuccessResponse;
  initialQuoteIndex?: 0 | 1 | 2;
  onQuotaUpdated?: (newQuota: QuotaStatusPayload) => void;
}

export function StoryCardModal({
  isOpen,
  onClose,
  readingData,
  initialQuoteIndex = 0,
  onQuotaUpdated,
}: StoryCardModalProps) {
  // Privacy-by-default: enabled (true) per PLAN.md Section 5
  const [hideQuestion, setHideQuestion] = useState<boolean>(true);
  const [quoteIndex, setQuoteIndex] = useState<0 | 1 | 2>(initialQuoteIndex);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  const quotes = readingData.result.shareable_card.savage_quotes;
  const activeQuote = quotes[quoteIndex] || readingData.result.shareable_card.savage_quote;

  const cardsParam = useMemo(() => {
    return readingData.drawnCards
      .map((slot) => `${slot.card.id}:${slot.reversed ? 1 : 0}`)
      .join(',');
  }, [readingData.drawnCards]);

  const storyImageUrl = useMemo(() => {
    const params = new URLSearchParams({
      readingId: readingData.readingId,
      quoteIndex: String(quoteIndex),
      hideQuestion: hideQuestion ? '1' : '0',
      persona: readingData.effectivePersona,
      nickname: readingData.nickname,
      topicLabel: readingData.topicLabel,
      question: readingData.questionText,
      badge: readingData.result.shareable_card.headline_badge,
      quote: activeQuote,
      subAdvice: readingData.result.shareable_card.sub_advice,
      luckyItem: readingData.result.shareable_card.lucky_item,
      cards: cardsParam,
    });
    const metrics = readingData.result.metrics;
    if (metrics) {
      if (metrics.compatibility_score !== undefined) {
        params.set('compatScore', String(metrics.compatibility_score));
      }
      if (metrics.red_flag_level !== undefined) {
        params.set('redFlagLevel', String(metrics.red_flag_level));
      }
      if (metrics.vibe_tag) {
        params.set('vibeTag', metrics.vibe_tag);
      }
    }
    return `/api/story-card?${params.toString()}`;
  }, [readingData, quoteIndex, hideQuestion, activeQuote, cardsParam]);

  const claimShareBonus = async () => {
    if (bonusClaimed) return;
    try {
      const res = await fetch('/api/reading', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'share_bonus',
          meta: { readingId: readingData.readingId, quoteIndex },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quota && onQuotaUpdated) {
          onQuotaUpdated(data.quota);
        }
        setBonusClaimed(true);
      }
    } catch {
      // Non-blocking bonus call
    }
  };

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    setStatusToast(null);
    try {
      const res = await fetch(`${storyImageUrl}&download=1`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `tarot-couple-story-${readingData.readingId}-q${quoteIndex + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      await claimShareBonus();
      setStatusToast('Đã tải ảnh 9:16 (1080x1920) & cộng +1 lượt bốc bài miễn phí!');
    } catch {
      setStatusToast('Không thể tải ảnh lúc này, vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    setIsSharing(true);
    setStatusToast(null);
    try {
      const res = await fetch(`${storyImageUrl}&download=1`);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `tarot-couple-${readingData.readingId}.png`,
        { type: 'image/png' }
      );

      const shareCaption = `“${activeQuote}” — Trải bài từ ${readingData.readerDisplayName} tại Tarot Couple ✦`;

      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        await navigator.share({
          title: `Thông điệp Tarot từ ${readingData.readerDisplayName}`,
          text: shareCaption,
          files: [file],
        });
        await claimShareBonus();
        setStatusToast('Chia sẻ thành công! Bạn được tặng +1 lượt bốc bài miễn phí.');
      } else {
        // Fallback: download image + copy caption to clipboard
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `tarot-couple-story-${readingData.readingId}-q${quoteIndex + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareCaption).catch(() => {});
        }
        await claimShareBonus();
        setStatusToast(
          'Thiết bị đã tải ảnh 9:16 & sao chép sẵn câu Quote để bạn đăng Story / TikTok!'
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatusToast('Đã hủy thao tác chia sẻ.');
      } else {
        await handleDownloadImage();
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Xưởng xuất ảnh Story 9:16"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="relative w-full max-w-4xl rounded-3xl bg-[#12101B] border border-[#D4AF37]/40 shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden my-auto"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4AF37]/20 bg-[#09080D]/80">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#F8F5F0]">
                    Xưởng Ảnh Story 9:16 Chuẩn Viral
                  </h3>
                  <p className="text-xs text-[#A39BB5]">
                    Độ phân giải 1080×1920 • Căn sẵn vùng an toàn Instagram & TikTok
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

            {/* Studio Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 sm:p-6 items-center">
              {/* Left Column: 9:16 Phone Story Preview Frame */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-[270px] aspect-[9/16] rounded-[28px] overflow-hidden border-2 border-[#D4AF37]/60 bg-[#09080D] shadow-[0_16px_50px_rgba(212,175,55,0.22)]">
                  <img
                    key={storyImageUrl}
                    src={storyImageUrl}
                    alt="Xem trước ảnh Story 9:16 Tarot Couple"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/75 border border-[#D4AF37]/40 text-[10px] font-semibold text-[#F3E5AB]">
                    1080 × 1920 PNG
                  </div>
                </div>
              </div>

                {/* Right Column: Controls (Page 9 & 10 of Redesign UI) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
                      Ảnh Story của bạn
                    </h3>
                    <p className="text-xs text-[#9E96B0]">
                      Chọn câu quote bạn muốn đăng, rồi chia sẻ hoặc tải về.
                    </p>
                  </div>

                  {/* 1. Chọn Câu Quote (List view with radio / buttons) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#9E96B0]">
                      Câu quote
                    </label>
                    <div className="space-y-2">
                      {quotes.map((qText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQuoteIndex(idx as 0 | 1 | 2)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer text-xs sm:text-sm leading-snug ${
                            quoteIndex === idx
                              ? 'bg-[#1D192C] border-[#C9A24A] text-[#F8F5F0] ring-1 ring-[#C9A24A]'
                              : 'bg-[#0B0A12] border-[#262235] text-[#9E96B0] hover:text-[#F8F5F0]'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center text-[10px] ${
                                quoteIndex === idx
                                  ? 'border-[#C9A24A] bg-[#C9A24A] text-[#0B0A12] font-bold'
                                  : 'border-[#262235]'
                              }`}
                            >
                              {quoteIndex === idx ? '✓' : ''}
                            </span>
                            <span>{qText}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Checkboxes (Ẩn câu hỏi của tôi & Hiện tên @Nickname) */}
                  <div className="space-y-2.5 pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hideQuestion}
                        onChange={(e) => setHideQuestion(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[#262235] bg-[#0B0A12] text-[#C9A24A] accent-[#C9A24A] cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-medium text-[#F8F5F0]">
                          Ẩn câu hỏi của tôi
                        </p>
                        <p className="text-[11px] text-[#9E96B0]">
                          Ảnh không hiện bạn đã hỏi gì.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Toast Feedback */}
                  {statusToast && (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-400/40 flex items-center gap-2 text-xs text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{statusToast}</span>
                    </div>
                  )}

                  {/* Action Buttons (Page 9 & 10) */}
                  <div className="space-y-2.5 pt-2">
                    {/* Primary Button */}
                    <button
                      type="button"
                      disabled={isSharing || isDownloading}
                      onClick={handleNativeShare}
                      className="w-full py-3 px-5 rounded-xl bg-[#C9A24A] hover:bg-[#E5C687] text-[#0B0A12] font-semibold text-xs sm:text-sm shadow-[0_4px_16px_rgba(217,179,106,0.3)] transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
                    >
                      {isSharing ? 'Đang mở chia sẻ...' : 'Chia sẻ lên Story'}
                    </button>

                    {/* Secondary Row: Tải ảnh PNG | Sao chép link */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={isDownloading || isSharing}
                        onClick={handleDownloadImage}
                        className="py-2.5 px-3 rounded-xl border border-[#262235] hover:bg-[#14121F] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {isDownloading ? 'Đang tải...' : 'Tải ảnh PNG'}
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (navigator.clipboard) {
                            await navigator.clipboard.writeText(window.location.origin);
                            setStatusToast('Đã sao chép link trang!');
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl border border-[#262235] hover:bg-[#14121F] text-xs font-medium text-[#E2E8F0] transition-colors cursor-pointer"
                      >
                        Sao chép link
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#9E96B0]/75 leading-relaxed pt-1">
                    Mã QR dẫn về trang giới thiệu, không lộ kết quả của bạn. Nếu ứng dụng chia sẻ không hiện, hãy tải ảnh rồi đăng thủ công.
                  </p>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
