import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  ALL_TAROT_CARDS,
  getCardBySlug,
  getCardSlug,
  type TarotSuit,
} from '@/data/tarot-cards';
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Heart,
  BookOpen,
  ShieldCheck,
  HelpCircle,
  Compass,
} from 'lucide-react';

interface CardDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const SUIT_LABELS_VI: Record<TarotSuit, string> = {
  wands: 'Bộ Gậy (Wands) • Nguyên tố Lửa 🔥',
  cups: 'Bộ Cốc (Cups) • Nguyên tố Nước 💧',
  swords: 'Bộ Kiếm (Swords) • Nguyên tố Khí ⚔️',
  pentacles: 'Bộ Tiền (Pentacles) • Nguyên tố Đất 🪙',
};

export async function generateStaticParams() {
  return ALL_TAROT_CARDS.map((card) => ({
    slug: getCardSlug(card),
  }));
}

export async function generateMetadata({
  params,
}: CardDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardBySlug(slug);

  if (!card) {
    return {
      title: 'Không tìm thấy lá bài • Tarot Couple',
    };
  }

  const title = `Ý nghĩa lá bài ${card.name_vi} (${card.name_en}) Xuôi & Ngược • Tarot Couple`;
  const description = `Giải mã chi tiết lá bài ${card.name_vi} (${card.roman} - ${card.name_en}) trong bộ bài Rider-Waite-Smith 1909: Ý nghĩa chiều xuôi, chiều ngược, tình yêu, sự nghiệp và lời khuyên từ 4 Reader AI.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [card.rws_image_url],
      type: 'article',
    },
  };
}

export default async function CardSeoDetailPage({ params }: CardDetailPageProps) {
  const { slug } = await params;
  const card = getCardBySlug(slug);

  if (!card) {
    notFound();
  }

  const prevCard = ALL_TAROT_CARDS[(card.id - 1 + ALL_TAROT_CARDS.length) % ALL_TAROT_CARDS.length]!;
  const nextCard = ALL_TAROT_CARDS[(card.id + 1) % ALL_TAROT_CARDS.length]!;

  const faqItems = [
    {
      question: `Lá bài ${card.name_vi} (${card.name_en}) chiều xuôi có ý nghĩa gì?`,
      answer: card.core_meaning_up,
    },
    {
      question: `Khi rút được lá bài ${card.name_vi} chiều ngược cần lưu ý điều gì?`,
      answer: card.core_meaning_rev,
    },
    {
      question: `Thông điệp tình yêu và chữa lành của lá ${card.name_vi} là gì?`,
      answer: `${card.healing_hook_up} Góc nhìn thẳng thắn: ${card.savage_hook_up}`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `Ý nghĩa lá bài ${card.name_vi} (${card.name_en}) — Xuôi & Ngược trong Tarot`,
        description: card.core_meaning_up,
        image: card.rws_image_url,
        author: {
          '@type': 'Organization',
          name: 'Tarot Couple',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Structured Data JSON-LD for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/cards"
          className="inline-flex items-center gap-1.5 text-xs text-[#9E96B0] hover:text-[#C9A24A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về Thư Viện 78 Lá Bài</span>
        </Link>
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#C9A24A] uppercase">
          RIDER-WAITE-SMITH 1909 • #{card.id + 1}/78
        </span>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start bg-[#14111C] border border-[#C9A24A]/35 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
        {/* Card Visual */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="relative w-52 sm:w-60 aspect-[2/3] rounded-2xl overflow-hidden bg-[#09080D] border-2 border-[#C9A24A] shadow-[0_15px_50px_rgba(201,162,74,0.25)]">
            <img
              src={card.rws_image_url}
              alt={`${card.name_vi} - ${card.name_en}`}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#09080D]/85 text-[#C9A24A] border border-[#C9A24A]/40">
              {card.roman}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            <span className="px-3 py-1 rounded-full bg-[#1D1829] border border-[#C9A24A]/30 text-[11px] font-semibold text-[#E5C687]">
              {card.arcana === 'major'
                ? 'Bộ Ẩn Chính (Major Arcana)'
                : card.suit
                  ? SUIT_LABELS_VI[card.suit]
                  : 'Bộ Ẩn Phụ (Minor Arcana)'}
            </span>
          </div>
        </div>

        {/* Card Summary & Keywords */}
        <div className="md:col-span-8 space-y-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A24A]">
              {card.roman} • {card.name_en}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5F0] mt-1">
              {card.name_vi}
            </h1>
          </div>

          {/* Keywords Upright */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
              ↑ Từ khóa Chiều Xuôi (Upright)
            </span>
            <div className="flex flex-wrap gap-2">
              {card.keywords_up.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-400/35 text-xs text-emerald-200 font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Keywords Reversed */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300 block">
              ↺ Từ khóa Chiều Ngược (Reversed)
            </span>
            <div className="flex flex-wrap gap-2">
              {card.keywords_rev.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-rose-950/60 border border-rose-400/35 text-xs text-rose-200 font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Quick CTA */}
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/reading/reader"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#C9A24A] to-[#E5C687] text-[#09080D] font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Rút Bài Trực Tiếp Cùng Reader AI</span>
            </Link>

            <Link
              href="/couple"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#1D1829] hover:bg-[#282238] border border-[#C9A24A]/40 text-[#F8F5F0] font-semibold text-xs sm:text-sm transition-all"
            >
              <Heart className="w-4 h-4 text-[#E879A8]" />
              <span>Soi Tương Thích Bói Đôi</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Detailed Upright & Reversed Meanings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-3xl bg-[#14111C] border border-emerald-500/30 p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <h2>Ý Nghĩa Chiều Xuôi (Upright)</h2>
          </div>
          <p className="text-sm text-[#E2E8F0] leading-relaxed">
            {card.core_meaning_up}
          </p>
        </div>

        <div className="rounded-3xl bg-[#14111C] border border-rose-500/30 p-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm uppercase tracking-wider">
            <RotateCcw className="w-4 h-4" />
            <h2>Ý Nghĩa Chiều Ngược (Reversed)</h2>
          </div>
          <p className="text-sm text-[#E2E8F0] leading-relaxed">
            {card.core_meaning_rev}
          </p>
        </div>
      </div>

      {/* 4 Canonical Readers Perspectives */}
      <div className="rounded-3xl bg-[#14111C] border border-[#C9A24A]/30 p-6 sm:p-8 space-y-5 mb-8">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#C9A24A]" />
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#F8F5F0]">
            Góc Nhìn Từ Các Reader Khi Thấy Lá {card.name_vi}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#1D1829] border border-[#EAB308]/35 space-y-2">
            <span className="text-xs font-bold text-[#EAB308] uppercase block">
              👵 Bà Ngoại & Chữa Lành
            </span>
            <p className="text-xs sm:text-sm text-[#F8F5F0] italic leading-relaxed">
              “{card.healing_hook_up}”
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1D1829] border border-[#E11D48]/35 space-y-2">
            <span className="text-xs font-bold text-[#FDA4AF] uppercase block">
              🔥 Chị Đại & Bạn Thân
            </span>
            <p className="text-xs sm:text-sm text-[#F8F5F0] italic leading-relaxed">
              “{card.savage_hook_up}”
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#1D1829] border border-[#3B82F6]/35 space-y-2">
            <span className="text-xs font-bold text-[#93C5FD] uppercase block">
              🦉 Góc Học Đường & Định Hướng
            </span>
            <p className="text-xs sm:text-sm text-[#F8F5F0] italic leading-relaxed">
              “{card.teen_hook_up}”
            </p>
          </div>
        </div>
      </div>

      {/* SEO FAQ Section */}
      <div className="rounded-3xl bg-[#14111C] border border-white/10 p-6 sm:p-8 space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#C9A24A]" />
          <h2 className="font-display text-xl font-bold text-[#F8F5F0]">
            Câu Hỏi Thường Gặp Về Lá Bài {card.name_vi}
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((faq, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#09080D]/80 border border-white/10 space-y-1.5"
            >
              <h3 className="text-sm font-bold text-[#E5C687]">{faq.question}</h3>
              <p className="text-xs sm:text-sm text-[#9E96B0] leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Previous / Next Card Navigation */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Link
          href={`/cards/${getCardSlug(prevCard)}`}
          className="flex-1 p-4 rounded-2xl bg-[#14111C] hover:bg-[#1D1829] border border-[#262235] hover:border-[#C9A24A]/40 transition-all"
        >
          <span className="text-[10px] uppercase tracking-wider text-[#9E96B0] block">
            &larr; Lá trước đó
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#F8F5F0]">
            {prevCard.roman} • {prevCard.name_vi}
          </span>
        </Link>

        <Link
          href={`/cards/${getCardSlug(nextCard)}`}
          className="flex-1 p-4 rounded-2xl bg-[#14111C] hover:bg-[#1D1829] border border-[#262235] hover:border-[#C9A24A]/40 transition-all text-right"
        >
          <span className="text-[10px] uppercase tracking-wider text-[#9E96B0] block">
            Lá tiếp theo &rarr;
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#F8F5F0]">
            {nextCard.roman} • {nextCard.name_vi}
          </span>
        </Link>
      </div>
    </div>
  );
}
