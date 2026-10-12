// Web Audio API Native Synthesizer for Tarot Rituals
// Không phụ thuộc vào asset mp3/wav ngoài, không tốn dung lượng băng thông, hoàn toàn bảo mật & tức thời.

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tc_sound_enabled');
        if (saved !== null) {
          this.soundEnabled = saved === 'true';
        }
      } catch {
        this.soundEnabled = true;
      }
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tc_sound_enabled', String(enabled));
      } catch {
        // ignore storage error
      }
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.soundEnabled);
    if (this.soundEnabled) {
      this.playBellTone();
    }
    return this.soundEnabled;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Tiếng chuông gió / chuông đồng thanh tịnh (Bell Tone):
   * Tần số hài hòa (528Hz & 1056Hz) với decay ngân dài huyền bí khi bắt đầu hoặc hoàn thành nghi thức.
   */
  public playBellTone(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Fundamental 528Hz (Solfeggio frequency - Miracles / Transformation)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now);
      osc1.frequency.exponentialRampToValueAtTime(524, now + 1.2);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1056, now);
      osc2.frequency.exponentialRampToValueAtTime(1048, now + 0.8);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.6);
      osc2.stop(now + 1.6);
    } catch {
      // AudioContext policy safe fallback
    }
  }

  /**
   * Tiếng sột soạt nhẹ của mép bài giấy cổ (Card Slide):
   * Dùng dải noise lọc bandpass tần số cao mô phỏng ma sát bề mặt lá bài khi ngón tay lướt qua.
   */
  public playCardSlide(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.06; // 60ms noise
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(3.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch {
      // AudioContext policy safe fallback
    }
  }

  /**
   * Tiếng lật bài 3D (Card Flip):
   * Sự kết hợp của tiếng gõ trầm ấm (woody thump) và tiếng gió lướt nhanh (flutter).
   */
  public playCardFlip(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);

      // Thêm lớp gió lướt
      this.playCardSlide();
    } catch {
      // Safe fallback
    }
  }

  /**
   * Tiếng ngân huyền bí (Mystic Chime):
   * Hợp âm arpeggio 3 nốt ngân (A4 - C#5 - E5) khi truyền 100% năng lượng xáo bài hoặc bốc trọn 3 lá.
   */
  public playMysticChime(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const noteStart = now + i * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.9);
      });
    } catch {
      // Safe fallback
    }
  }
}

export const soundManager = new SoundManager();
