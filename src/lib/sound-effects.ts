// Web Audio API Native Synthesizer for Tarot Rituals & Spatial Micro-Audio
// Không phụ thuộc vào asset mp3/wav ngoài, không tốn dung lượng băng thông, hoàn toàn bảo mật & tức thời.

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private ambientNodes: {
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    gain: GainNode;
  } | null = null;
  private lastScrollHarmonicAt: number = 0;

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
    if (!enabled && this.ambientNodes) {
      this.toggleAmbientDrone(false);
    }
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
      const bufferSize = ctx.sampleRate * 0.06;
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

  /**
   * Tiếng xáo bài Riffle 3D (Riffle Shuffle):
   * Chuỗi 20 xung âm thanh xen kẽ với tần số flutter mô phỏng mép bài miết so le trong 1.2s.
   */
  public playRiffleShuffle(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const cardFlicks = 20;
      const duration = 1.15;

      for (let i = 0; i < cardFlicks; i++) {
        const flickTime = now + (i / cardFlicks) * duration + (Math.random() * 0.015 - 0.007);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220 + Math.random() * 70, flickTime);
        osc.frequency.exponentialRampToValueAtTime(90, flickTime + 0.045);

        gain.gain.setValueAtTime(0.0001, flickTime);
        gain.gain.linearRampToValueAtTime(0.14, flickTime + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, flickTime + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(flickTime);
        osc.stop(flickTime + 0.045);
      }
    } catch {
      // Safe fallback
    }
  }

  /**
   * Âm thanh vi tương tác từ tính (Magnetic Hover Tick):
   * Tạo xung pha lê ngắn (45ms) tần số 1320Hz -> 880Hz khi rê chuột vào lá bài 3D hoặc nút CTA.
   */
  public playMagneticHover(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.045);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Âm thanh lướt cuộn không gian (Scroll Harmonic Whoosh):
   * Phát nốt âm không gian nhẹ khi tốc độ cuộn Lenis vượt ngưỡng, có giới hạn tần suất (throttle 380ms).
   */
  public playScrollHarmonic(velocity: number = 1): void {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastScrollHarmonicAt < 380) return;
    this.lastScrollHarmonicAt = nowMs;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const clampedVel = Math.min(Math.max(Math.abs(velocity), 0.5), 8);
      const baseFreq = 196 + clampedVel * 22; // G3 harmonic shift

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.22);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Safe fallback
    }
  }

  public isAmbientPlaying(): boolean {
    return Boolean(this.ambientNodes);
  }

  /**
   * Nhạc nền không gian huyền học (Spatial Ambient Drone 216Hz / 432Hz):
   * Tạo lớp âm nền tĩnh tâm siêu nhẹ khi người dùng bật chế độ Không Gian Âm Thanh trên trang chủ.
   */
  public toggleAmbientDrone(forceState?: boolean): boolean {
    const shouldPlay =
      typeof forceState === 'boolean' ? forceState : !Boolean(this.ambientNodes);

    if (!shouldPlay) {
      if (this.ambientNodes) {
        try {
          const ctx = this.ctx;
          if (ctx) {
            this.ambientNodes.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
          }
          const nodes = this.ambientNodes;
          this.ambientNodes = null;
          setTimeout(() => {
            try {
              nodes.osc1.stop();
              nodes.osc2.stop();
              nodes.osc1.disconnect();
              nodes.osc2.disconnect();
            } catch {
              // ignore
            }
          }, 220);
        } catch {
          this.ambientNodes = null;
        }
      }
      return false;
    }

    if (!this.soundEnabled) {
      this.setEnabled(true);
    }

    if (this.ambientNodes) return true;

    try {
      const ctx = this.getContext();
      if (!ctx) return false;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(108, now); // C#2 / A=432Hz root drone
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(216, now); // Octave harmonic

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.032, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      this.ambientNodes = { osc1, osc2, gain };
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Âm sắc định danh riêng cho từng Reader trong 4 UI Giới Thiệu (Spatial Persona Chord):
   * - ba_ngoai (1/4): Chuông đồng trầm ấm 432Hz + 648Hz
   * - chi_dai (2/4): Âm hạc Ruby sắc sảo, dứt khoát 528Hz + 792Hz
   * - ban_than (3/4): Chuỗi Arpeggio thạch anh hồng vui tươi 587Hz -> 740Hz -> 880Hz
   * - thay_cu_meo (4/4): Tần số huyền học sâu lắng 288Hz + 576Hz + 864Hz
   */
  public playReaderPersonaChord(readerId: string): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const presetMap: Record<
        string,
        { notes: number[]; wave: OscillatorType; duration: number; stagger: number }
      > = {
        ba_ngoai: {
          notes: [432, 648],
          wave: 'sine',
          duration: 0.75,
          stagger: 0.06,
        },
        chi_dai: {
          notes: [528, 792],
          wave: 'triangle',
          duration: 0.48,
          stagger: 0.035,
        },
        ban_than: {
          notes: [587.33, 739.99, 880],
          wave: 'sine',
          duration: 0.55,
          stagger: 0.055,
        },
        thay_cu_meo: {
          notes: [288, 576, 864],
          wave: 'sine',
          duration: 0.85,
          stagger: 0.07,
        },
      };

      const preset = presetMap[readerId] ?? presetMap.ba_ngoai!;

      preset.notes.forEach((freq, idx) => {
        const startAt = now + idx * preset.stagger;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = preset.wave;
        osc.frequency.setValueAtTime(freq, startAt);
        osc.frequency.exponentialRampToValueAtTime(
          freq * 0.992,
          startAt + preset.duration
        );

        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.linearRampToValueAtTime(0.11 / (idx + 1), startAt + 0.018);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          startAt + preset.duration
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startAt);
        osc.stop(startAt + preset.duration + 0.02);
      });
    } catch {
      // AudioContext safe fallback
    }
  }
}

export const soundManager = new SoundManager();

