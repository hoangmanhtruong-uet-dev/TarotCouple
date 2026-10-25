'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  aiVoiceEngine,
  type VoicePlaybackState,
} from '@/lib/voice-engine';
import type { ReaderId } from '@/lib/schemas';
import { READERS_BY_ID } from '@/data/tarot-cards';

export interface AIVoiceReaderBarProps {
  readerId: ReaderId;
  nickname: string;
  topicLabel?: string;
  overallVerdict: string;
  savageQuote: string;
  cards?: Array<{
    name_vi: string;
    reversed: boolean;
    position_label: string;
  }>;
  onPlayStart?: () => void;
  className?: string;
}

export function AIVoiceReaderBar({
  readerId,
  nickname,
  topicLabel = 'Tình Duyên',
  overallVerdict,
  savageQuote,
  cards = [],
  onPlayStart,
  className = '',
}: AIVoiceReaderBarProps) {
  const [playbackState, setPlaybackState] = useState<VoicePlaybackState>(() =>
    aiVoiceEngine.getState()
  );
  const [isSupported, setIsSupported] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [cachedScript, setCachedScript] = useState<string[] | null>(null);
  const [speed, setSpeed] = useState(1.0);
  const [isAmbientMuted, setIsAmbientMuted] = useState(false);

  const readerObj = READERS_BY_ID[readerId] || READERS_BY_ID.ba_ngoai;

  useEffect(() => {
    setIsSupported(aiVoiceEngine.isSupported());
    setIsAmbientMuted(aiVoiceEngine.isMuted());
    const unsubscribe = aiVoiceEngine.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => {
      unsubscribe();
      aiVoiceEngine.stop();
    };
  }, []);

  const handleFetchOrPlay = async () => {
    if (!isSupported) return;

    if (playbackState.isPlaying) {
      aiVoiceEngine.togglePlayPause();
      return;
    }

    if (playbackState.isPaused) {
      aiVoiceEngine.resume();
      return;
    }

    try {
      setIsLoadingScript(true);
      let scriptToPlay = cachedScript;

      if (!scriptToPlay) {
        // Fetch AI podcast script
        const res = await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            readerId,
            nickname,
            topicLabel,
            overallVerdict,
            savageQuote,
            cards,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.script) && data.script.length > 0) {
            scriptToPlay = data.script;
            setCachedScript(data.script);
          }
        }
      }

      // Fallback if network fails
      if (!scriptToPlay || scriptToPlay.length === 0) {
        const fallbackText = `${overallVerdict} ${savageQuote}`;
        scriptToPlay = aiVoiceEngine.prepareScript(fallbackText, readerId, true);
      }

      onPlayStart?.();
      aiVoiceEngine.play(scriptToPlay, readerId, speed);
    } catch {
      const fallbackText = `${overallVerdict} ${savageQuote}`;
      aiVoiceEngine.play(fallbackText, readerId, speed);
    } finally {
      setIsLoadingScript(false);
    }
  };

  const handleReplay = () => {
    if (cachedScript && cachedScript.length > 0) {
      aiVoiceEngine.play(cachedScript, readerId, speed);
    } else {
      handleFetchOrPlay();
    }
  };

  const handleSpeedCycle = () => {
    const nextSpeed = speed === 1.0 ? 1.2 : speed === 1.2 ? 0.85 : 1.0;
    setSpeed(nextSpeed);
    aiVoiceEngine.setSpeed(nextSpeed);
  };

  const handleToggleAmbient = () => {
    const muted = aiVoiceEngine.toggleAmbientMute();
    setIsAmbientMuted(muted);
  };

  if (!isSupported) {
    return null; // Gracefully hidden on unsupported devices
  }

  const isPlaying = playbackState.isPlaying && !playbackState.isPaused;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#C9A24A]/30 bg-gradient-to-r from-[#171426] via-[#1F1B33] to-[#171426] p-4 shadow-xl backdrop-blur-md ${className}`}
      role="region"
      aria-label="AI Voice Reader"
    >
      {/* Background Subtle Shimmer */}
      <div className="absolute inset-0 bg-radial-gradient from-[#C9A24A]/10 via-transparent to-transparent pointer-events-none" />

      {/* Header Info */}
      <div className="relative flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#C9A24A]/20 border border-[#C9A24A]/40 text-[#E6CA65]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#E6CA65]">
                AI Voice Reader • {readerObj.name}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#C9A24A]/15 text-[#C9A24A] border border-[#C9A24A]/30">
                Đêm muộn
              </span>
            </div>
            <p className="text-[11px] text-[#9E96B0]">
              Lắng nghe giải mã thần số bằng giọng đọc độc quyền
            </p>
          </div>
        </div>

        {/* Visualizer Waveform Animation */}
        <div className="flex items-end gap-1 h-5 px-2">
          {[40, 75, 100, 60, 90, 45, 80, 55].map((height, idx) => (
            <motion.span
              key={idx}
              className="w-1 rounded-full bg-[#C9A24A]"
              animate={{
                height: isPlaying ? [`${height * 0.3}%`, `${height}%`, `${height * 0.4}%`] : '20%',
                opacity: isPlaying ? [0.6, 1, 0.7] : 0.3,
              }}
              transition={{
                duration: 0.6 + (idx % 3) * 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: idx * 0.08,
              }}
            />
          ))}
        </div>
      </div>

      {/* Karaoke Live Subtitle Bar */}
      <AnimatePresence mode="wait">
        {playbackState.isPlaying && playbackState.currentSentenceText && (
          <motion.div
            key={playbackState.currentSentenceIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mb-3 px-3 py-2 rounded-xl bg-[#0F0D18]/80 border border-[#C9A24A]/20"
          >
            <p className="text-xs text-[#E6CA65] leading-relaxed italic text-center font-serif">
              "{playbackState.currentSentenceText}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      {playbackState.isPlaying && (
        <div className="w-full bg-[#27233D] h-1 rounded-full overflow-hidden mb-3">
          <motion.div
            className="bg-gradient-to-r from-[#C9A24A] to-[#E6CA65] h-full"
            style={{ width: `${playbackState.progressPercent}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
      )}

      {/* Control Buttons */}
      <div className="relative flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={handleFetchOrPlay}
            disabled={isLoadingScript}
            aria-label={isPlaying ? 'Tạm dừng giọng đọc' : 'Phát giọng đọc AI'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A24A] hover:bg-[#E6CA65] text-[#13111E] font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isLoadingScript ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{playbackState.isPaused ? 'Tiếp tục' : 'Nghe giọng đọc'}</span>
              </>
            )}
          </button>

          {/* Replay Button */}
          {playbackState.isPlaying && (
            <button
              type="button"
              onClick={handleReplay}
              aria-label="Phát lại từ đầu"
              className="p-2 rounded-xl bg-[#27233D] hover:bg-[#342F4F] text-[#E6CA65] transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Speed & Ambient Controls */}
        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={handleSpeedCycle}
            aria-label={`Tốc độ đọc: ${speed}x`}
            className="px-2.5 py-1.5 rounded-lg bg-[#27233D] hover:bg-[#342F4F] text-[#C9A24A] text-[11px] font-medium transition-all cursor-pointer"
          >
            {speed}x
          </button>

          {/* Ambient Singing Bowl Toggle */}
          <button
            type="button"
            onClick={handleToggleAmbient}
            aria-label={isAmbientMuted ? 'Bật chuông xoay nền' : 'Tắt chuông xoay nền'}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isAmbientMuted
                ? 'bg-[#27233D] text-[#716A85]'
                : 'bg-[#C9A24A]/20 text-[#E6CA65] border border-[#C9A24A]/40'
            }`}
          >
            {isAmbientMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
