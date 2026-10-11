'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useReadingStore } from '@/lib/reading-store';
import { Download, Share2, Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';

export default function StoryPage() {
  const shouldReduceMotion = useReducedMotion();
  const { readingSuccess, activeQuoteIdx, setActiveQuoteIdx, hideQuestionOnShare, setContextForm } =
    useReadingStore();

  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!readingSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Sparkles className="w-12 h-12 text-[#D9B36A] mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-[#F8F5F0] mb-2">
          Chưa Có Ảnh Story
        </h2>
        <p className="text-xs text-[#9E96B0] mb-6">
          Vui lòng hoàn thành một trải bài trước khi xuất ảnh Story 9:16 nhé!
        </p>
        <Link
          href="/reading/reader"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#D9B36A] text-[#0B0A12] font-bold text-sm"
        >
          <span>Bốc Bài Ngay &rarr;</span>
        </Link>
      </div>
    );
  }

  const quotes = readingSuccess.result.shareable_card.savage_quotes;
  const activeQuote = quotes[activeQuoteIdx] || quotes[0]!;

  const cardsParam = useMemo(() => {
    return readingSuccess.drawnCards
      .map((slot) => `${slot.card.id}:${slot.reversed ? 1 : 0}`)
      .join(',');
  }, [readingSuccess.drawnCards]);

  const storyImageUrl = useMemo(() => {
    const params = new URLSearchParams({
      readingId: readingSuccess.readingId,
      quoteIndex: String(activeQuoteIdx),
      hideQuestion: hideQuestionOnShare ? '1' : '0',
      persona: readingSuccess.effectivePersona,
      nickname: readingSuccess.nickname,
      topicLabel: readingSuccess.topicLabel,
      question: readingSuccess.questionText,
      badge: readingSuccess.result.shareable_card.headline_badge,
      quote: activeQuote,
      subAdvice: readingSuccess.result.shareable_card.sub_advice,
      luckyItem: readingSuccess.result.shareable_card.lucky_item,
      cards: cardsParam,
    });
    return `/api/story-card?${params.toString()}`;
  }, [readingSuccess, activeQuoteIdx, hideQuestionOnShare, activeQuote, cardsParam]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(storyImageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tarot-story-${readingSuccess.readingId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToastMsg('Đã tải ảnh Story 9:16 thành công!');
    } catch {
      setToastMsg('Tải ảnh thất bại, vui lòng chụp màn hình nhé!');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        const res = await fetch(storyImageUrl);
        const blob = await res.blob();
        const file = new File([blob], `tarot-story-${readingSuccess.readingId}.png`, {
          type: 'image/png',
        });
        await navigator.share({
          title: 'Tarot Couple — Bốc bài cùng AI',
          text: `"${activeQuote}"`,
          files: [file],
        });
        setToastMsg('Đã chia sẻ thành công!');
      } else {
        await handleDownload();
      }
    } catch {
      // User dismissed or share error
    } finally {
      setIsSharing(false);
      setTimeout(() => setToastMsg(null), 3000);
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
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase block mb-1">
          BƯỚC 5 / 5 • ẢNH STORY 9:16
        </span>
        <h1 className="font-display text-2xl font-bold text-[#F8F5F0]">
          Xuất Ảnh Đăng TikTok & Story
        </h1>
        <p className="text-xs text-[#9E96B0] mt-1">
          Ảnh chuẩn tỉ lệ 1080x1920 với vùng an toàn, không lo bị che giao diện.
        </p>
      </motion.div>

      {/* 9:16 Live Preview Container with Spring Zoom In */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[9/16] w-full max-w-[320px] mx-auto rounded-3xl overflow-hidden border-2 border-[#D9B36A]/40 shadow-[0_0_50px_rgba(217,179,106,0.25)] bg-[#0B0A12] mb-6"
      >
        <img
          src={storyImageUrl}
          alt="Tarot Story Card 9:16"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Quote selector */}
      <div className="bg-[#14121F] border border-[#262235] rounded-2xl p-4 space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#D9B36A] uppercase">
            Đổi câu Quote khác (Miễn phí)
          </span>
          <button
            type="button"
            onClick={() => setContextForm({ hideQuestionOnShare: !hideQuestionOnShare })}
            className="flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#F8F5F0]"
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
              onClick={() => setActiveQuoteIdx(qIdx as any)}
              className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                activeQuoteIdx === qIdx
                  ? 'bg-[#D9B36A]/20 border-[#D9B36A] text-[#E5C687]'
                  : 'bg-[#0B0A12] border-[#262235] text-[#9E96B0]'
              }`}
            >
              Quote {qIdx + 1}
            </button>
          ))}
        </div>
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
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-sm shadow-[0_4px_25px_rgba(217,179,106,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{isSharing ? 'Đang xử lý...' : 'Chia Sẻ Lên Story / TikTok'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-3.5 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#D9B36A]/40 text-[#E5C687] font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Đang tải...' : 'Tải Ảnh 9:16 (1080x1920)'}</span>
        </button>

        <div className="text-center pt-2">
          <Link
            href="/reading/ket-qua"
            className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#F8F5F0]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại xem lời giải</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
