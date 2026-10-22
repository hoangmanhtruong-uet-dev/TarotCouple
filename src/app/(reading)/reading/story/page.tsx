'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { useQuotaSync } from '@/lib/use-quota';
import { CustomCursorFollower } from '@/components/CustomCursorFollower';
import { Download, Share2, Eye, EyeOff, Sparkles, ArrowLeft, Gift } from 'lucide-react';

export default function StoryPage() {
  const shouldReduceMotion = useReducedMotion();
  const { readingSuccess, activeQuoteIdx, setActiveQuoteIdx, hideQuestionOnShare, setContextForm } =
    useReadingStore();
  const { updateQuota } = useQuotaSync();

  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  // P0-8 (C8): Rules of Hooks - hoist useMemo calls BEFORE early return to prevent blank screen / hydration crash
  const previewQuotes = readingSuccess?.result?.shareable_card?.savage_quotes;
  const memoActiveQuote = (previewQuotes && previewQuotes[activeQuoteIdx]) || (previewQuotes && previewQuotes[0]) || '';

  const cardsParam = useMemo(() => {
    if (!readingSuccess) return '';
    return readingSuccess.drawnCards
      .map((slot) => `${slot.card.id}:${slot.reversed ? 1 : 0}`)
      .join(',');
  }, [readingSuccess]);

  const storyImageUrl = useMemo(() => {
    if (!readingSuccess) return '';
    const params = new URLSearchParams({
      readingId: readingSuccess.readingId,
      quoteIndex: String(activeQuoteIdx),
      hideQuestion: hideQuestionOnShare ? '1' : '0',
      persona: readingSuccess.effectivePersona,
      nickname: readingSuccess.nickname,
      topicLabel: readingSuccess.topicLabel,
      question: readingSuccess.questionText,
      badge: readingSuccess.result.shareable_card.headline_badge,
      quote: memoActiveQuote,
      subAdvice: readingSuccess.result.shareable_card.sub_advice,
      luckyItem: readingSuccess.result.shareable_card.lucky_item,
      cards: cardsParam,
    });

    if (readingSuccess.result.metrics?.compatibility_score !== undefined) {
      params.set('compatScore', String(readingSuccess.result.metrics.compatibility_score));
    }
    if (readingSuccess.result.metrics?.red_flag_level !== undefined) {
      params.set('redFlag', String(readingSuccess.result.metrics.red_flag_level));
    }

    return `/api/story-card?${params.toString()}`;
  }, [readingSuccess, activeQuoteIdx, hideQuestionOnShare, memoActiveQuote, cardsParam]);

  if (!readingSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Sparkles className="w-12 h-12 text-[#C9A24A] mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-[#F8F5F0] mb-2">
          Chưa Có Ảnh Story
        </h2>
        <p className="text-xs text-[#9E96B0] mb-6">
          Vui lòng hoàn thành một trải bài trước khi xuất ảnh Story 9:16 nhé!
        </p>
        <Link
          href="/reading/reader"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C9A24A] text-[#09080D] font-bold text-sm"
        >
          <span>Bốc Bài Ngay &rarr;</span>
        </Link>
      </div>
    );
  }

  const quotes = readingSuccess.result.shareable_card.savage_quotes;
  const activeQuote = quotes[activeQuoteIdx] || quotes[0]!;

  const claimShareBonus = async () => {
    if (bonusClaimed) return;
    try {
      const res = await fetch('/api/reading', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'share_bonus',
          readingId: readingSuccess.readingId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.quota) {
          updateQuota(data.quota);
          setBonusClaimed(true);
        }
      }
    } catch {
      // Ignore bonus claim error
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`${storyImageUrl}&download=1`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarot-story-${readingSuccess.readingId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      await claimShareBonus();
      setToastMsg('Đã tải ảnh Story 9:16 & nhận thưởng +1 lượt rút bài miễn phí!');
    } catch {
      setToastMsg('Tải ảnh thất bại, vui lòng chụp màn hình nhé!');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        const res = await fetch(`${storyImageUrl}&download=1`);
        const blob = await res.blob();
        const file = new File([blob], `tarot-story-${readingSuccess.readingId}.png`, {
          type: 'image/png',
        });
        await navigator.share({
          title: 'Tarot Couple — Bốc bài cùng AI',
          text: `"${activeQuote}"`,
          files: [file],
        });
        await claimShareBonus();
        setToastMsg('Đã chia sẻ thành công & nhận +1 lượt rút bài miễn phí!');
      } else {
        await handleDownload();
      }
    } catch {
      // User dismissed or share error
    } finally {
      setIsSharing(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#C9A24A] uppercase block mb-1">
          BƯỚC 5 / 5 • ẢNH STORY 9:16
        </span>
        <h1 className="font-display text-2xl font-bold text-[#F8F5F0]">
          Xuất Ảnh Đăng TikTok & Story
        </h1>
        <p className="text-xs text-[#9E96B0] mt-1">
          Ảnh chuẩn tỉ lệ 1080x1920 với vùng an toàn, tặng ngay +1 lượt rút bài miễn phí khi lưu/chia sẻ!
        </p>
      </motion.div>

      {/* 9:16 Live Preview Container with Spring Zoom In */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[9/16] w-full max-w-[320px] mx-auto rounded-3xl overflow-hidden border-2 border-[#C9A24A]/40 shadow-[0_0_50px_rgba(201,162,74,0.25)] bg-[#09080D] mb-6"
      >
        <img
          src={storyImageUrl}
          alt="Tarot Story Card 9:16"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Quote selector */}
      <div className="bg-[#14111C] border border-[#262235] rounded-2xl p-4 space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#C9A24A] uppercase">
            Đổi câu Quote khác (Miễn phí)
          </span>
          <button
            type="button"
            onClick={() => setContextForm({ hideQuestionOnShare: !hideQuestionOnShare })}
            className="flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#F8F5F0] cursor-pointer"
          >
            {hideQuestionOnShare ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{hideQuestionOnShare ? 'Đang ẩn câu hỏi' : 'Đang hiện câu hỏi'}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {quotes.map((_, qIdx) => (
            <button
              key={qIdx}
              type="button"
              onClick={() => setActiveQuoteIdx(qIdx as 0 | 1 | 2)}
              className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeQuoteIdx === qIdx
                  ? 'bg-[#C9A24A]/20 border-[#C9A24A] text-[#E5C687]'
                  : 'bg-[#09080D] border-[#262235] text-[#9E96B0]'
              }`}
            >
              Quote {qIdx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Bonus badge */}
      <div className="p-3 rounded-xl bg-[#1D1829] border border-[#C9A24A]/30 flex items-center justify-center gap-2 text-xs text-[#E5C687] mb-4">
        <Gift className="w-4 h-4 text-[#C9A24A] shrink-0" />
        <span>
          {bonusClaimed
            ? '✓ Đã cộng +1 lượt rút bài miễn phí vào tài khoản của bạn!'
            : 'Chia sẻ hoặc tải ảnh Story nhận ngay +1 lượt rút bài miễn phí hôm nay!'}
        </span>
      </div>

      {/* Toast */}
      {toastMsg && (
        <p className="text-xs text-emerald-400 text-center font-medium mb-4">{toastMsg}</p>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#B38B36] hover:from-[#E5C687] hover:to-[#C9A24A] text-[#09080D] font-bold text-sm shadow-[0_4px_25px_rgba(201,162,74,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{isSharing ? 'Đang xử lý...' : 'Chia Sẻ Lên Story / TikTok (+1 Lượt)'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-3.5 rounded-2xl bg-[#14111C] hover:bg-[#1D1829] border border-[#C9A24A]/40 text-[#E5C687] font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Đang tải...' : 'Tải Ảnh 9:16 (1080x1920)'}</span>
        </button>

        <div className="text-center pt-2">
          <Link
            href={readingSuccess.readingId.startsWith('rd_couple') ? '/couple' : '/reading/ket-qua'}
            className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#F8F5F0]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại xem lời giải</span>
          </Link>
        </div>
      </div>

      <CustomCursorFollower />
    </div>
  );
}
