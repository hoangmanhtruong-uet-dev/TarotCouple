'use client';

import { useEffect } from 'react';

export default function GlobalLayoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TarotCouple Layout Error]', error);
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          background: '#09080D',
          color: '#F8F5F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#C9A24A' }}>
            Tarot Couple — Đang Khởi Động Lại
          </h2>
          <p style={{ color: '#9E96B0', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Đã xảy ra lỗi nghiêm trọng. Vui lòng thử lại.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#C9A24A',
              color: '#09080D',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Thử Lại
          </button>
        </div>
      </body>
    </html>
  );
}
