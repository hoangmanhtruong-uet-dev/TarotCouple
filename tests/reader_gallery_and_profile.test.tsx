// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ReaderGalleryPage from '../src/app/(reading)/reading/reader/page';
import { ReaderSignatureCard3D } from '../src/components/reader/ReaderSignatureCard3D';
import { ReaderReviewCarousel, REVIEWS_BY_READER } from '../src/components/reader/ReaderReviewCarousel';
import { ReaderVoicePreview } from '../src/components/reader/ReaderVoicePreview';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Giai đoạn 1: Reader Gallery & Rebuilt Reader Profile Suite', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('1. Reader Gallery Page (/reading/reader)', () => {
    it('renders the gallery header, filters, and all reader cards', () => {
      render(<ReaderGalleryPage />);

      expect(screen.getByText(/LẦU THẦY BÓI/i)).toBeDefined();
      expect(screen.getByText(/Chọn Reader Hợp Tần Số/i)).toBeDefined();
      expect(screen.getByText(/Tất cả Reader/i)).toBeDefined();
      expect(screen.getByText(/Đanh đá \/ Nói thẳng/i)).toBeDefined();
      expect(screen.getByText(/Chữa lành \/ Dịu êm/i)).toBeDefined();
      expect(screen.getByText(/Gen Z \/ Bạn thân/i)).toBeDefined();
    });

    it('filters reader cards when filter category is clicked', () => {
      render(<ReaderGalleryPage />);

      const genZFilter = screen.getByText(/Gen Z \/ Bạn thân/i);
      fireEvent.click(genZFilter);

      // Bạn Thân heading should be visible
      expect(screen.getByRole('heading', { name: 'Bạn Thân' })).toBeDefined();
    });
  });

  describe('2. ReaderSignatureCard3D component', () => {
    it('renders front card artwork and flips to reveal back meaning on click', () => {
      render(
        <ReaderSignatureCard3D
          cardTitle="Lá Mặt Trời (The Sun)"
          cardImage="https://example.com/sun.jpg"
          arcanaName="XIX • THE SUN"
          accentColor="#EAB308"
          meaningSnippet="Khởi sắc rực rỡ và niềm vui ngập tràn."
          keywords={['Sáng tỏ', 'Niềm tin']}
        />
      );

      const badges = screen.getAllByText(/XIX • THE SUN/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Chạm để lật mặt sau/i)).toBeDefined();

      const card = screen.getByRole('button', { name: /Thẻ bài hộ mệnh 3D/i });
      fireEvent.click(card);

      expect(screen.getByText(/BÍ MẬT LÁ BÀI/i)).toBeDefined();
      expect(screen.getByText(/Khởi sắc rực rỡ và niềm vui ngập tràn/i)).toBeDefined();
      expect(screen.getByText(/✦ Sáng tỏ/i)).toBeDefined();
    });
  });

  describe('3. ReaderReviewCarousel component', () => {
    it('renders testimonials for the given reader', () => {
      render(
        <ReaderReviewCarousel readerId="ba_ngoai" accentColor="#EAB308" />
      );

      expect(screen.getByText(/ĐÁNH GIÁ TỪ KHÁCH ĐÃ TRẢI BÀI/i)).toBeDefined();
      const firstReview = REVIEWS_BY_READER.ba_ngoai[0]!;
      expect(screen.getByText(new RegExp(firstReview.author, 'i'))).toBeDefined();
      expect(screen.getByText(/1\/3/)).toBeDefined();

      const nextBtn = screen.getByLabelText(/Đánh giá sau/i);
      fireEvent.click(nextBtn);
      expect(screen.getByText(/2\/3/)).toBeDefined();
    });
  });

  describe('4. ReaderVoicePreview component', () => {
    it('renders signature catchphrase and listen button', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          speak: vi.fn(),
          cancel: vi.fn(),
          pause: vi.fn(),
          resume: vi.fn(),
          getVoices: vi.fn(() => []),
        },
        writable: true,
      });

      render(
        <ReaderVoicePreview
          readerId="ba_ngoai"
          readerName="Cô Sáu"
          accentColor="#EAB308"
        />
      );

      expect(screen.getByText(/Chất Giọng Đặc Trưng/i)).toBeDefined();
      expect(screen.getByLabelText(/Nghe thử giọng Cô Sáu/i)).toBeDefined();
    });
  });
});
