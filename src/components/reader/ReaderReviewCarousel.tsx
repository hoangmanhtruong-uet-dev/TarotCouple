'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import { soundManager } from '@/lib/sound-effects';

export interface ReaderReview {
  id: string;
  author: string;
  ageTier: string;
  topic: string;
  rating: number;
  content: string;
  timeAgo: string;
}

export const REVIEWS_BY_READER: Record<string, ReaderReview[]> = {
  ba_ngoai: [
    {
      id: 'rev_bn_1',
      author: '@thanh.huyen2002',
      ageTier: 'Gen Z',
      topic: 'Gỡ rối lụy tình',
      rating: 5,
      content: 'Bị Bà mắng một trận tơi bời mà tỉnh cả người ra! Đúng là chỉ có người từng trải mới nhìn thấu được mấy trò thao túng của người cũ.',
      timeAgo: '2 giờ trước',
    },
    {
      id: 'rev_bn_2',
      author: '@minhduc.dev',
      ageTier: '24 tuổi',
      topic: 'Sự nghiệp & Nhảy việc',
      rating: 5,
      content: 'Lời khuyên của Bà rất thực tế và ấm áp. Không có vẽ vời viển vông, chỉ thẳng vào điểm yếu mình cần khắc phục.',
      timeAgo: '1 ngày trước',
    },
    {
      id: 'rev_bn_3',
      author: '@lananh_vibes',
      ageTier: 'Gen Z',
      topic: 'Tình cảm gia đình',
      rating: 5,
      content: 'Nghe Bà nói mà rơi nước mắt vì thấy được yêu thương và vỗ về sau chuỗi ngày áp lực công việc.',
      timeAgo: '3 ngày trước',
    },
  ],
  chi_dai: [
    {
      id: 'rev_cd_1',
      author: '@hoang_yen_99',
      ageTier: '25 tuổi',
      topic: 'Soi kèo mập mờ',
      rating: 5,
      content: 'Chị Lan chỉ ra ngay điểm cờ đỏ (red flag) mà bấy lâu nay em cứ cố tình phớt lờ. Rất sắc bén và dứt khoát!',
      timeAgo: '4 giờ trước',
    },
    {
      id: 'rev_cd_2',
      author: '@tu_anh_mkt',
      ageTier: '23 tuổi',
      topic: 'Bản lĩnh độc thân',
      rating: 5,
      content: 'Cực kỳ thích vibe hiện đại của chị Lan. Yêu bản thân trước rồi vũ trụ tự khắc an bài người xứng đáng.',
      timeAgo: '2 ngày trước',
    },
  ],
  ban_than: [
    {
      id: 'rev_bt_1',
      author: '@chip_bong2k4',
      ageTier: '19 tuổi',
      topic: 'Crush cùng trường',
      rating: 5,
      content: 'Bốc bài với Bé Mây cười xỉu luôn á trùi, nói chuyện hài hước gần gũi y chang nhỏ bạn thân ngồi cùng bàn!',
      timeAgo: '1 giờ trước',
    },
    {
      id: 'rev_bt_2',
      author: '@khanh_sky',
      ageTier: 'Gen Z',
      topic: 'Chuyện bạn bè xích mích',
      rating: 5,
      content: 'Không phán xét một chút nào, lắng nghe và đưa ra góc nhìn siêu dễ thương. Cho 10 sao luôn!',
      timeAgo: 'Yesterday',
    },
  ],
  thay_cu_meo: [
    {
      id: 'rev_tm_1',
      author: '@ngoc_minh_zen',
      ageTier: '28 tuổi',
      topic: 'Chữa lành & Tỉnh thức',
      rating: 5,
      content: 'Giọng đọc và lời bình của Thầy Minh mang lại năng lượng bình an kỳ lạ. Nghe xong thấy tâm mình tĩnh lại hẳn.',
      timeAgo: '5 giờ trước',
    },
    {
      id: 'rev_tm_2',
      author: '@quang_huy_arch',
      ageTier: '26 tuổi',
      topic: 'Ngã ba đường sự nghiệp',
      rating: 5,
      content: 'Mỗi biểu tượng lá bài được Thầy liên hệ với triết lý nhân quả và dòng chảy tự nhiên rất sâu sắc.',
      timeAgo: '2 ngày trước',
    },
  ],
};

export function ReaderReviewCarousel({
  readerId,
  accentColor,
}: {
  readerId: string;
  accentColor: string;
}) {
  const reviews = REVIEWS_BY_READER[readerId] || REVIEWS_BY_READER.ba_ngoai || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  if (reviews.length === 0) return null;

  const currentReview = reviews[currentIndex] || reviews[0]!;

  const handleNext = () => {
    soundManager.playCrispClick();
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    soundManager.playCrispClick();
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#09080D]/90 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#C9A24A]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#F8F5F0]">
            Đánh Giá Từ Khách Đã Trải Bài
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Đánh giá trước"
            className="p-1.5 rounded-lg bg-[#14111E] hover:bg-[#201C2F] text-[#9E96B0] hover:text-white transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-[#9E96B0] font-mono px-1">
            {currentIndex + 1}/{reviews.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Đánh giá sau"
            className="p-1.5 rounded-lg bg-[#14111E] hover:bg-[#201C2F] text-[#9E96B0] hover:text-white transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentReview.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-2 pt-1"
        >
          {/* Star rating + Topic */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-[#E6CA65]">
              {[...Array(currentReview.rating)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-medium border"
              style={{
                borderColor: `${accentColor}40`,
                backgroundColor: `${accentColor}15`,
                color: accentColor,
              }}
            >
              {currentReview.topic}
            </span>
          </div>

          {/* Quote content */}
          <p className="text-xs text-[#D8D2E7] leading-relaxed italic">
            &ldquo;{currentReview.content}&rdquo;
          </p>

          {/* Author info */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-[#9E96B0] border-t border-white/5">
            <span className="font-semibold text-[#F8F5F0] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              {currentReview.author} ({currentReview.ageTier})
            </span>
            <span className="text-[10px] text-[#716A85]">{currentReview.timeAgo}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
