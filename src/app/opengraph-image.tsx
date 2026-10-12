import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Tarot Couple — Bốc Bài Tarot AI Gen Z';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0B0A12 0%, #1D1829 50%, #0B0A12 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Golden border accent */}
        <div
          style={{
            position: 'absolute',
            inset: 24,
            border: '1px solid rgba(201,162,74,0.4)',
            borderRadius: 24,
          }}
        />
        {/* Card symbol */}
        <div
          style={{
            width: 80,
            height: 80,
            background: 'rgba(201,162,74,0.15)',
            border: '1px solid rgba(201,162,74,0.6)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            marginBottom: 32,
          }}
        >
          🔮
        </div>
        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#F8F5F0',
            marginBottom: 16,
            letterSpacing: '-0.02em',
          }}
        >
          Tarot Couple
        </div>
        {/* Subtitle */}
        <div
          style={{
            fontSize: 26,
            color: '#C9A24A',
            marginBottom: 24,
            fontStyle: 'italic',
          }}
        >
          Bốc Bài Tarot AI Gen Z
        </div>
        {/* Description */}
        <div
          style={{
            fontSize: 18,
            color: '#9E96B0',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.6,
          }}
        >
          78 lá Rider-Waite-Smith · 4 Reader AI · Xuất Story 9:16
        </div>
      </div>
    ),
    { ...size }
  );
}
