'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Heart, ArrowRight, Shield, Zap, Star } from 'lucide-react';
import { READERS } from '@/data/tarot-cards';

// 5 Fan Cards with real RWS 1909 artwork
const FAN_CARDS = [
  {
    roman: '0',
    title: 'Kẻ Khờ',
    angle: -24,
    x: -90,
    y: 15,
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
  },
  {
    roman: 'I',
    title: 'Pháp Sư',
    angle: -12,
    x: -45,
    y: 5,
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
  },
  {
    roman: 'XIX',
    title: 'Mặt Trời',
    angle: 0,
    x: 0,
    y: 0,
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
  },
  {
    roman: 'VI',
    title: 'Người Tình',
    angle: 12,
    x: 45,
    y: 5,
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/TheLovers.jpg',
  },
  {
    roman: 'XXI',
    title: 'Thế Giới',
    angle: 24,
    x: 90,
    y: 15,
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',
  },
];

export default function MarketingLandingPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)]">
      {/* Background Parallax Stars */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,179,106,0.15)_0%,rgba(11,10,18,0.7)_50%,rgba(11,10,18,1)_90%)]" />

      {/* Floating Starlight Particles */}
      {!shouldReduceMotion && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
          <motion.div
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/5 w-1 h-1 bg-[#D9B36A] rounded-full shadow-[0_0_8px_#D9B36A]"
          />
          <motion.div
            animate={{ y: [0, 25, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-[#E5C687] rounded-full shadow-[0_0_10px_#E5C687]"
          />
          <motion.div
            animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-amber-200 rounded-full shadow-[0_0_8px_#F3E5AB]"
          />
        </div>
      )}

      <div className="relative max-w-4xl mx-auto px-4 pt-8 sm:pt-12 pb-20 text-center">
        {/* Editorial Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14121F] border border-[#D9B36A]/40 text-xs text-[#E5C687] mb-6 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D9B36A]" />
          <span className="font-medium tracking-wide">RWS 1909 • Tarot AI Phản Chiếu Tâm Lý</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-[#F8F5F0] leading-tight mb-4"
        >
          Vũ Trụ Không Trả Lời Sai, <br />
          <span className="text-[#D9B36A] italic">Chỉ Bạn Đang Tự Lừa Mình</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-xl mx-auto text-sm sm:text-base text-[#9E96B0] mb-8 leading-relaxed font-sans"
        >
          Bốc bài Tarot cá nhân hoặc bói đôi cùng người ấy. Chọn Reader hợp gu, nhận câu chốt hạ sắc bén và xuất ảnh Story 9:16 viral không tốn 1 xu.
        </motion.p>

        {/* Wow Moment: Fan Card Display */}
        <div className="relative h-44 sm:h-52 max-w-xs mx-auto mb-10 flex items-center justify-center">
          {FAN_CARDS.map((card, idx) => (
            <motion.div
              key={card.roman}
              initial={
                shouldReduceMotion
                  ? {}
                  : { opacity: 0, scale: 0.8, rotate: 0, x: 0, y: 30 }
              }
              animate={{
                opacity: 1,
                scale: 1,
                rotate: card.angle,
                x: card.x,
                y: card.y,
              }}
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      scale: 1.08,
                      y: card.y - 15,
                      zIndex: 30,
                      transition: { duration: 0.2 },
                    }
              }
              transition={{
                duration: 0.7,
                delay: 0.25 + idx * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute w-24 h-36 sm:w-28 sm:h-44 rounded-2xl p-2 bg-gradient-to-b from-[#221B33] via-[#141121] to-[#0B0A12] border border-[#D9B36A]/50 shadow-[0_8px_30px_rgba(0,0,0,0.8)] cursor-pointer flex flex-col justify-between"
              style={{ zIndex: idx + 10 }}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#0B0A12] border border-[#D9B36A]/40 flex flex-col justify-between p-1.5">
                <div className="flex justify-between items-center text-[9px] text-[#D9B36A] font-bold z-10 bg-black/60 px-1 rounded">
                  <span>{card.roman}</span>
                  <span className="text-[8px] text-[#E5C687]">{card.title}</span>
                </div>
                {/* RWS Illustration Artwork */}
                <div className="absolute inset-0 opacity-85">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                </div>
                <div className="text-[8px] text-center tracking-widest text-[#D9B36A] font-bold uppercase z-10 mt-auto">
                  RWS 1909
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 2 CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-14"
        >
          <Link
            href="/reading/reader"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-[#D9B36A] to-[#C49A4D] hover:from-[#E5C687] hover:to-[#D9B36A] text-[#0B0A12] font-bold text-base shadow-[0_4px_25px_rgba(217,179,106,0.35)] transition-all transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>Bốc Bài Cá Nhân</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/couple"
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-[#14121F] hover:bg-[#1D192C] border border-[#D9B36A]/50 text-[#F8F5F0] font-bold text-base transition-all transform active:scale-95 cursor-pointer"
          >
            <Heart className="w-5 h-5 text-rose-400" />
            <span>Bói Đôi Cùng Người Ấy</span>
          </Link>
        </motion.div>

        {/* Reader Teaser Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-3xl mx-auto mb-12"
        >
          {READERS.map((reader) => (
            <div
              key={reader.id}
              className="p-4 rounded-2xl bg-[#14121F]/80 border border-[#262235] hover:border-[#D9B36A]/40 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 shadow-inner"
                style={{
                  backgroundColor: `${reader.accent_color}25`,
                  border: `1px solid ${reader.accent_color}60`,
                }}
              >
                <span>{reader.avatar_symbol}</span>
              </div>
              <h3 className="text-sm font-bold text-[#F8F5F0] mb-1">{reader.name}</h3>
              <p className="text-xs text-[#9E96B0] line-clamp-2">{reader.tagline}</p>
            </div>
          ))}
        </motion.div>

        {/* Feature Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#9E96B0] border-t border-[#262235]/60 pt-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Bảo mật 100% • Ẩn danh hóa câu hỏi</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D9B36A]" />
            <span>CSPRNG Chuẩn Mật Mã</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span>Trọn bộ 78 lá RWS 1909</span>
          </div>
        </div>
      </div>
    </div>
  );
}
