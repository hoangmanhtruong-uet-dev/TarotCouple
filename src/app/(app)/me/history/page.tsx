'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Clock, Sparkles, BookOpen, Trash2 } from 'lucide-react';
import { useReadingStore } from '@/lib/reading-store';

export default function ReadingHistoryPage() {
  const shouldReduceMotion = useReducedMotion();
  const readingSuccess = useReadingStore((state) => state.readingSuccess);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/me"
          className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#E5C687] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang Tôi</span>
        </Link>
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#D9B36A] uppercase">
          TAROT JOURNAL
        </span>
      </div>

      <div className="text-center mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5F0] mb-2">
          Nhật Ký Trải Bài Của Bạn
        </h1>
        <p className="text-xs sm:text-sm text-[#9E96B0]">
          Lưu giữ các phiên trải bài gần nhất trên thiết bị này để chiêm nghiệm lại tiến trình tâm lý.
        </p>
      </div>

      {readingSuccess ? (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-[#14121F]/90 border border-[#D9B36A]/40 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#E5C687]">
                🔮 Phiên trải bài mới nhất • {readingSuccess.readerDisplayName}
              </span>
              <span className="text-[10px] text-[#9E96B0]">
                {new Date(readingSuccess.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>

            <p className="text-xs text-[#F8F5F0] italic mb-4 font-serif">
              &ldquo;{readingSuccess.questionText || 'Định hướng năng lượng'}&rdquo;
            </p>

            {/* 3 Cards Mini Preview */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {readingSuccess.drawnCards.map((c, i) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-[#0B0A12] border border-[#262235] text-center"
                >
                  <p className="text-[10px] font-bold text-[#D9B36A] line-clamp-1">
                    {c.card.name_vi}
                  </p>
                  <span className="text-[9px] text-[#9E96B0]">
                    {c.reversed ? 'Ngược' : 'Xuôi'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#262235]">
              <Link
                href="/reading/ket-qua"
                className="text-xs font-bold text-[#D9B36A] hover:underline"
              >
                Xem lại toàn bộ luận giải &rarr;
              </Link>
              <Link
                href="/reading/story"
                className="text-xs font-semibold text-[#9E96B0] hover:text-[#F8F5F0]"
              >
                Xuất lại Story 9:16
              </Link>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-16 bg-[#14121F]/60 border border-[#262235] rounded-3xl p-8">
          <BookOpen className="w-10 h-10 text-[#D9B36A] mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-[#F8F5F0] mb-1">Chưa có nhật ký nào được lưu</h3>
          <p className="text-xs text-[#9E96B0] mb-6 max-w-sm mx-auto">
            Khi bạn hoàn thành một lượt bốc bài, kết quả sẽ tự động được lưu lại tại đây.
          </p>
          <Link
            href="/reading/reader"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#D9B36A] text-[#0B0A12] font-bold text-xs shadow-md"
          >
            <span>Bắt Đầu Bốc Bài Ngay &rarr;</span>
          </Link>
        </div>
      )}
    </div>
  );
}
