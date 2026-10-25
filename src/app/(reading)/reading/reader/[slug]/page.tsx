import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { READERS } from '@/data/tarot-cards';
import { SLUG_TO_READER_ID, ALL_READER_SLUGS } from '@/lib/reader-slugs';
import ReaderProfileViewLazy from '@/components/ReaderProfileViewLazy';

interface ReaderPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_READER_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const readerId = SLUG_TO_READER_ID[slug];
  const reader = READERS.find((r) => r.id === readerId);

  if (!reader) {
    return {
      title: 'Không Tìm Thấy Reader — Tarot Couple',
    };
  }

  const title = `${reader.name} (${reader.badge}) — Tarot Couple`;
  const description = `${reader.title}. Hợp với: ${reader.tagline} Câu trích dẫn: "${reader.sample_quote}"`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      siteName: 'Tarot Couple',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

import { Suspense } from 'react';

export default async function ReaderDetailPage({ params }: ReaderPageProps) {
  const { slug } = await params;
  const readerId = SLUG_TO_READER_ID[slug];
  const reader = READERS.find((r) => r.id === readerId);

  if (!reader) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09080D] flex items-center justify-center text-[#C9A24A] text-sm font-medium">Đang chuẩn bị lều Reader...</div>}>
      <ReaderProfileViewLazy readerId={reader.id} currentSlug={slug} />
    </Suspense>
  );
}
