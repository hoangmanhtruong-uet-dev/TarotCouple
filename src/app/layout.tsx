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
};

export const metadata: Metadata = {
  title: "Tarot Couple — Bốc Bài Tarot AI Gen Z",
  description:
    "Trải nghiệm bốc bài Tarot AI phản chiếu tâm lý với trọn bộ 78 lá Rider-Waite-Smith 1909. Chọn Reader hợp tần số, nhận câu chốt hạ và xuất ảnh Story 9:16.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
      <body className="min-h-dvh bg-[#0B0A12] text-[#F8F5F0] antialiased selection:bg-[#D9B36A]/30 selection:text-[#E5C687]">
        <PhoneFrameContainer>{children}</PhoneFrameContainer>
      </body>
    </html>
  );
}
