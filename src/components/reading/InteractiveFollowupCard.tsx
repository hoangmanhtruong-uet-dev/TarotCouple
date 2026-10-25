'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { soundManager } from '@/lib/sound-effects';
import { READERS, CANONICAL_READERS } from '@/data/tarot-cards';
import type { ReaderId } from '@/lib/schemas';

export interface InteractiveFollowupCardProps {
  readerDisplayName: string;
  readerId?: ReaderId;
  accentColor?: string;
  topic?: string;
  suggestedQuestions?: string[];
  onOpenFollowup: (initialQuestion?: string) => void;
  className?: string;
}

export default function InteractiveFollowupCard({
  readerDisplayName,
  readerId,
  accentColor,
  topic,
  suggestedQuestions,
  onOpenFollowup,
  className = '',
}: InteractiveFollowupCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const reader = useMemo(() => {
    return (
      READERS.find((r) => r.id === readerId) ||
      CANONICAL_READERS.find((r) => r.id === readerId) ||
      READERS[0]
    );
  }, [readerId]);

  const avatarUrl = reader?.avatar_image || '/readers/tien-tu-chua-lanh.jpg';
  const effectiveAccent = accentColor || reader?.accent_color || '#C9A24A';

  const chips = useMemo(() => {
    if (suggestedQuestions && suggestedQuestions.length > 0) {
      return suggestedQuestions.slice(0, 3);
    }
    if (topic === 'tinh_cam' || topic === 'love') {
      return [
        'Người ấy có đang giấu giếm điều gì với mình?',
        'Bước ngoặt tình cảm sắp tới trong 30 ngày?',
        'Mình nên chủ động hay chờ đợi lúc này?',
      ];
    }
    if (topic === 'cong_viec' || topic === 'career') {
      return [
        'Công việc sắp tới có cơ hội bứt phá không?',
        'Ai là quý nhân hoặc rủi ro cần chú ý?',
        'Mình nên tiếp tục hay chuẩn bị đổi hướng?',
      ];
    }
    if (topic === 'tai_chinh' || topic === 'finance') {
      return [
        'Dòng tiền sắp tới có dấu hiệu khởi sắc không?',
        'Khoản đầu tư hoặc chi tiêu nào cần cẩn trọng?',
        'Làm sao để giữ vững sự ổn định tài chính?',
      ];
    }
    if (topic === 'self_healing') {
      return [
        'Nút thắt tâm lý lớn nhất mình cần buông bỏ?',
        'Hành động nào giúp mình lấy lại năng lượng ngay?',
        'Làm sao để ngừng tự phán xét bản thân?',
      ];
    }
    if (topic === 'family') {
      return [
        'Làm sao để hòa giải bất đồng với người thân?',
        'Kỳ vọng từ gia đình: Mình nên đối thoại thế nào?',
        'Hiểu lầm nào cần được gỡ rối chân thành?',
      ];
    }
    return [
      'Lá bài nào mang tác động lớn nhất?',
      'Bước ngoặt nào sắp diễn ra trong 7 ngày tới?',
      'Hành động tốt nhất mình nên làm ngay lúc này?',
    ];
  }, [suggestedQuestions, topic]);

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => onOpenFollowup()}
      className={`group p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#18132A] via-[#120F1F] to-[#0A0811] border border-[#8B5CF6]/40 hover:border-[#C9A24A]/70 transition-all duration-300 shadow-[0_8px_32px_rgba(139,92,246,0.12)] relative overflow-hidden cursor-pointer ${className}`}
    >
      {/* Subtle top-right ambient glow */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: '#8B5CF6' }}
      />

      {/* Header section with Avatar and Badges */}
      <div className="flex items-start gap-3.5 sm:gap-4 relative z-10">
        {/* Avatar Reader with Pulsing Green Online Indicator */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden ring-2 ring-[#C9A24A]/60 shrink-0 shadow-lg bg-[#14121F]">
          <img
            src={avatarUrl}
            alt={readerDisplayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image if any
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Pulsing Green Online Indicator */}
          <span className="absolute bottom-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-[#120F1F]" />
          </span>
        </div>

        {/* Text info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 tracking-wider uppercase bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/40 shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              2 câu đầu miễn phí ✨
            </span>
            <span className="text-[10px] text-[#A9A1BC]">
              Sau đó: 2 Sao / câu
            </span>
          </div>

          <h3 className="font-display text-sm sm:text-base font-bold text-[#F8F5F0] group-hover:text-[#E8C872] transition-colors truncate">
            Thắc Mắc Sâu Hơn Với {readerDisplayName}
          </h3>
          <p className="text-xs text-[#A9A1BC] leading-relaxed line-clamp-2 mt-0.5">
            Bạn còn điểm nghẽn hoặc thắc mắc chưa rõ về 3 lá? Nhắn trực tiếp để {readerDisplayName} giải đáp riêng tư cho bạn.
          </p>
        </div>

        {/* Right CTA Button */}
        <div className="shrink-0 flex items-center self-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playCrispClick();
              onOpenFollowup();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#201A33] hover:bg-[#2C2447] border border-[#8B5CF6]/40 hover:border-[#C9A24A] text-xs font-bold text-[#E5C687] shadow-sm transition-all cursor-pointer group/btn"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#C9A24A]" />
            <span className="hidden sm:inline">Hỏi ngay</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C9A24A] group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Prompt Chips Section */}
      <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-2 relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A24A] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#C9A24A]" />
          Chạm để hỏi nhanh về quẻ này:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundManager.playCrispClick();
                onOpenFollowup(chip);
              }}
              className="text-left p-2.5 rounded-xl bg-[#0F0C18]/90 hover:bg-[#1E1733] border border-white/10 hover:border-[#C9A24A]/70 transition-all flex items-center justify-between gap-2 group/chip cursor-pointer shadow-sm active:scale-98"
            >
              <span className="text-xs text-[#E5C687] group-hover/chip:text-[#FFF8E7] line-clamp-2 font-serif leading-snug">
                ✦ &ldquo;{chip}&rdquo;
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C9A24A] shrink-0 opacity-60 group-hover/chip:opacity-100 group-hover/chip:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
