/**
 * AI Voice Reader Engine for TarotCouple
 *
 * Provides expressive, persona-matched voice synthesis for the 4 Tarot Readers:
 * - Cô Sáu (ba_ngoai): Sharp, confident, assertive, slightly faster cadence (1.05x).
 * - Thầy Minh (thay_cu_meo): Deep, calming, meditative, thoughtful cadence (0.85x).
 * - Chị Lan (chi_dai): Warm, empathetic, elder sisterly cadence (0.95x).
 * - Bé Mây (ban_than): Upbeat, friendly Gen Z conversational cadence (1.1x).
 *
 * Supports Web Speech API, sentence-level karaoke tracking, audio frequency
 * visualizer data simulation, and ambient singing bowl background harmony.
 */

import type { ReaderId } from './schemas';
import { soundManager } from './sound-effects';

export interface ReaderVoiceConfig {
  pitch: number;
  rate: number;
  volume: number;
  lang: string;
  gender: 'female' | 'male';
  ambientTrack?: 'bowl' | 'chime' | 'none';
  introPhrase: string;
}

export const READER_VOICE_PROFILES: Record<ReaderId, ReaderVoiceConfig> = {
  ba_ngoai: {
    pitch: 1.05,
    rate: 1.05,
    volume: 1.0,
    lang: 'vi-VN',
    gender: 'female',
    ambientTrack: 'bowl',
    introPhrase: 'Nè con, ngồi thẳng thớm lại rồi nghe Cô Sáu nói cho rõ nghe chưa...',
  },
  thay_cu_meo: {
    pitch: 0.82,
    rate: 0.85,
    volume: 0.95,
    lang: 'vi-VN',
    gender: 'male',
    ambientTrack: 'bowl',
    introPhrase: 'Hãy thở một hơi thật sâu. Vũ trụ luôn có sự an bài của riêng nó...',
  },
  chi_dai: {
    pitch: 0.96,
    rate: 0.95,
    volume: 1.0,
    lang: 'vi-VN',
    gender: 'female',
    ambientTrack: 'chime',
    introPhrase: 'Ngồi xuống đây với chị. Có những chuyện phải nhìn thẳng thì lòng mới nhẹ...',
  },
  ban_than: {
    pitch: 1.15,
    rate: 1.1,
    volume: 1.0,
    lang: 'vi-VN',
    gender: 'female',
    ambientTrack: 'chime',
    introPhrase: 'Alo bồ tèo ơi, tín hiệu vũ trụ tới rồi nè! Tỉnh táo lên nghen...',
  },
  ba_co_mo_hon: {
    pitch: 1.08,
    rate: 1.02,
    volume: 1.0,
    lang: 'vi-VN',
    gender: 'female',
    ambientTrack: 'bowl',
    introPhrase: 'Mơ hồ hoài chi con ơi, để Cô Ba dọn đường chỉ lối cho sáng tỏ nè...',
  },
  tien_tu_chua_lanh: {
    pitch: 1.0,
    rate: 0.9,
    volume: 0.95,
    lang: 'vi-VN',
    gender: 'female',
    ambientTrack: 'chime',
    introPhrase: 'Hít sâu và thả lỏng mọi muộn phiền. Hãy lắng nghe thông điệp dịu êm từ khu vườn tâm hồn...',
  },
  tong_tai_ly_tri: {
    pitch: 0.85,
    rate: 0.95,
    volume: 1.0,
    lang: 'vi-VN',
    gender: 'male',
    ambientTrack: 'bowl',
    introPhrase: 'Bớt cảm tính lại và nhìn vào số liệu thực tế. Dự án tình cảm này có đáng để đầu tư không?',
  },
  phap_su_toi_co: {
    pitch: 0.8,
    rate: 0.85,
    volume: 1.0,
    lang: 'vi-VN',
    gender: 'male',
    ambientTrack: 'bowl',
    introPhrase: 'Cổ thư ngàn năm đã mở. Định mệnh và thời khắc chuyển giao đã điểm...',
  },
};

export interface VoicePlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSentenceIndex: number;
  totalSentences: number;
  currentSentenceText: string;
  playbackRate: number;
  progressPercent: number;
  error: string | null;
}

export type VoiceStateListener = (state: VoicePlaybackState) => void;

class AIVoiceEngine {
  private utterance: SpeechSynthesisUtterance | null = null;
  private sentences: string[] = [];
  private currentSentenceIndex = 0;
  private readerId: ReaderId = 'ba_ngoai';
  private rateModifier = 1.0;
  private isAmbientMuted = false;
  private isPlaying = false;
  private isPaused = false;
  private listeners: Set<VoiceStateListener> = new Set();

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch {
        // Safe notification
      }
    });
  }

  public getState(): VoicePlaybackState {
    const total = this.sentences.length;
    const progress = total > 0 ? Math.min(100, Math.round(((this.currentSentenceIndex + 1) / total) * 100)) : 0;
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentSentenceIndex: this.currentSentenceIndex,
      totalSentences: total,
      currentSentenceText: this.sentences[this.currentSentenceIndex] || '',
      playbackRate: this.rateModifier,
      progressPercent: this.isPlaying ? progress : 0,
      error: null,
    };
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Cleans text and splits into digestible voice sentences.
   */
  public prepareScript(
    rawText: string,
    readerId: ReaderId,
    includeIntro = true
  ): string[] {
    const profile = READER_VOICE_PROFILES[readerId] || READER_VOICE_PROFILES.ba_ngoai;
    const cleanText = rawText
      .replace(/[#*_`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const parts = cleanText
      .split(/(?<=[.!?…\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    const script: string[] = [];
    if (includeIntro && profile.introPhrase) {
      script.push(profile.introPhrase);
    }
    script.push(...parts);

    return script.length > 0 ? script : ['Thông điệp vũ trụ đã sáng rõ. Chúc bạn luôn bình an.'];
  }

  /**
   * Plays the prepared script with the voice persona.
   */
  public play(
    textOrSentences: string | string[],
    readerId: ReaderId = 'ba_ngoai',
    speedModifier = 1.0
  ): void {
    if (!this.isSupported()) {
      return;
    }

    this.stop();

    this.readerId = readerId;
    this.rateModifier = speedModifier;

    if (Array.isArray(textOrSentences)) {
      this.sentences = textOrSentences;
    } else {
      this.sentences = this.prepareScript(textOrSentences, readerId, true);
    }

    if (this.sentences.length === 0) return;

    this.currentSentenceIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;

    // Play subtle ambient tone on start
    if (!this.isAmbientMuted) {
      soundManager.playTibetanSingingBowl();
    }

    this.speakCurrentSentence();
  }

  private speakCurrentSentence(): void {
    if (!this.isPlaying || this.currentSentenceIndex >= this.sentences.length) {
      this.finish();
      return;
    }

    const currentText = this.sentences[this.currentSentenceIndex] || '';
    if (!currentText.trim()) {
      this.currentSentenceIndex++;
      this.speakCurrentSentence();
      return;
    }

    const profile = READER_VOICE_PROFILES[this.readerId] || READER_VOICE_PROFILES.ba_ngoai;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(currentText);
      utterance.lang = profile.lang;
      utterance.pitch = profile.pitch;
      utterance.rate = Math.max(0.7, Math.min(1.5, profile.rate * this.rateModifier));
      utterance.volume = profile.volume;

      // Select Vietnamese voice if available
      const voices = window.speechSynthesis.getVoices();
      const vnVoices = voices.filter((v) => v.lang.startsWith('vi'));
      if (vnVoices.length > 0) {
        if (profile.gender === 'male') {
          const male = vnVoices.find((v) => v.name.toLowerCase().includes('nam') || v.name.toLowerCase().includes('male'));
          utterance.voice = male || vnVoices[0]!;
        } else {
          const female = vnVoices.find((v) => v.name.toLowerCase().includes('nu') || v.name.toLowerCase().includes('female'));
          utterance.voice = female || vnVoices[0]!;
        }
      }

      utterance.onend = () => {
        if (!this.isPlaying || this.isPaused) return;
        this.currentSentenceIndex++;
        this.notify();
        // Brief pause between sentences for natural breathing
        setTimeout(() => {
          this.speakCurrentSentence();
        }, 320);
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          this.currentSentenceIndex++;
          this.speakCurrentSentence();
        }
      };

      this.utterance = utterance;
      window.speechSynthesis.speak(utterance);
      this.notify();
    } catch {
      this.finish();
    }
  }

  public pause(): void {
    if (!this.isSupported() || !this.isPlaying) return;
    try {
      window.speechSynthesis.pause();
      this.isPaused = true;
      this.notify();
    } catch {
      // Ignore
    }
  }

  public resume(): void {
    if (!this.isSupported() || !this.isPaused) return;
    try {
      window.speechSynthesis.resume();
      this.isPaused = false;
      this.notify();
    } catch {
      // Ignore
    }
  }

  public togglePlayPause(): void {
    if (!this.isPlaying) return;
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  public setSpeed(speed: number): void {
    this.rateModifier = speed;
    if (this.isPlaying && !this.isPaused) {
      // Restart current sentence with new speed
      this.speakCurrentSentence();
    } else {
      this.notify();
    }
  }

  public toggleAmbientMute(): boolean {
    this.isAmbientMuted = !this.isAmbientMuted;
    return this.isAmbientMuted;
  }

  public isMuted(): boolean {
    return this.isAmbientMuted;
  }

  public stop(): void {
    if (!this.isSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentSentenceIndex = 0;
    this.utterance = null;
    this.notify();
  }

  private finish(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentSentenceIndex = 0;
    this.notify();
    if (!this.isAmbientMuted) {
      soundManager.playMysticChime();
    }
  }
}

export const aiVoiceEngine = new AIVoiceEngine();
