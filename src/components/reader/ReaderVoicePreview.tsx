'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Sparkles, Radio } from 'lucide-react';
import { aiVoiceEngine, READER_VOICE_PROFILES } from '@/lib/voice-engine';
import type { ReaderId } from '@/lib/schemas';
import { soundManager } from '@/lib/sound-effects';

export function ReaderVoicePreview({
  readerId,
  readerName,
  accentColor,
}: {
  readerId: ReaderId;
  readerName: string;
  accentColor: string;
}) {
  const profile = READER_VOICE_PROFILES[readerId] || READER_VOICE_PROFILES.ba_ngoai;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(aiVoiceEngine.isSupported());
    const unsub = aiVoiceEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying && !state.isPaused);
    });
    return () => unsub();
  }, []);

  const handleToggle = () => {
    soundManager.playCrispClick();
    if (isPlaying) {
      aiVoiceEngine.stop();
    } else {
      aiVoiceEngine.play(profile.introPhrase, readerId, 1.0);
    }
  };

  if (!isSupported) return null;

  return (
    <div
      className="p-3.5 sm:p-4 rounded-2xl bg-[#0F0D1A] border transition-all"
      style={{ borderColor: isPlaying ? accentColor : 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}40`,
              color: accentColor,
            }}
          >
            <Radio className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#F8F5F0]">
                Chất Giọng Đặc Trưng
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white/5 text-[#9E96B0]">
                AI Voice
              </span>
            </div>
            <p className="text-[11px] text-[#9E96B0] italic line-clamp-1">
              &ldquo;{profile.introPhrase}&rdquo;
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          aria-label={isPlaying ? 'Dừng giọng đọc' : `Nghe thử giọng ${readerName}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
          style={{
            backgroundColor: isPlaying ? '#27233D' : accentColor,
            color: isPlaying ? accentColor : '#09080D',
          }}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Dừng</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Nghe thử</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
