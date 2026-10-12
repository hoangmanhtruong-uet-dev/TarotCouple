import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import PhoneFrameContainer from "@/components/PhoneFrameContainer";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0A12",
  colorScheme: "dark",
  interactiveWidget: "resizes-content",
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://tarotcouple.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Tarot Couple — Bốc Bài Tarot AI Gen Z',
    template: '%s | Tarot Couple',
  },
  description:
    'Trải nghiệm bốc bài Tarot AI phản chiếu tâm lý với trọn bộ 78 lá Rider-Waite-Smith 1909. Chọn Reader hợp tần số, nhận câu chốt hạ và xuất ảnh Story 9:16.',
  keywords: [
    'tarot',
    'tarot ai',
    'bói bài tarot',
    'tarot couple',
    'tarot gen z',
    'bốc bài tarot',
    'tarot tình yêu',
    'rider waite smith',
    'tarot tiếng việt',
  ],
  authors: [{ name: 'Tarot Couple' }],
  creator: 'Tarot Couple',
  publisher: 'Tarot Couple',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: BASE_URL,
    siteName: 'Tarot Couple',
    title: 'Tarot Couple — Bốc Bài Tarot AI Gen Z',
    description:
      'Trải nghiệm bốc bài Tarot AI phản chiếu tâm lý với trọn bộ 78 lá Rider-Waite-Smith 1909. Chọn Reader hợp tần số, nhận câu chốt hạ và xuất ảnh Story 9:16.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tarot Couple — Bốc Bài Tarot AI Gen Z',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarot Couple — Bốc Bài Tarot AI Gen Z',
    description:
      'Trải nghiệm bốc bài Tarot AI phản chiếu tâm lý với trọn bộ 78 lá Rider-Waite-Smith 1909.',
    images: ['/og-image.png'],
    creator: '@tarotcouple',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'vi-VN': BASE_URL,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} ${playfair.variable} dark`}
    >
      <body className="min-h-dvh bg-[#0B0A12] text-[#F8F5F0] antialiased selection:bg-[#C9A24A]/30 selection:text-[#E5C687]">
        <PhoneFrameContainer>{children}</PhoneFrameContainer>
      </body>
    </html>
  );
}
