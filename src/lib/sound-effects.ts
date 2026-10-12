// Web Audio API Native Synthesizer for Tarot Rituals & Spatial Micro-Audio
// Không phụ thuộc vào asset mp3/wav ngoài, không tốn dung lượng băng thông, hoàn toàn bảo mật & tức thời.

export interface SoundManagerInterface {
  playTibetanSingingBowl(): void;
  playCrispClick(): void;
  playOrganicCardFlip(): void;
  playCardSlide(): void;
  playMysticChime(): void;
  playMagneticHover(): void;
  toggle(): boolean;
  isEnabled(): boolean;
  cleanupRouteAudio(): void;
}

interface ActiveVoice {
  sources: (AudioScheduledSourceNode | OscillatorNode | AudioBufferSourceNode)[];
  gainNodes: GainNode[];
  timerId?: ReturnType<typeof setTimeout>;
}

export class SoundManager implements SoundManagerInterface {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private ambientNodes: {
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    gain: GainNode;
  } | null = null;
  private lastScrollHarmonicAt: number = 0;
  private activeVoices: Set<ActiveVoice> = new Set();

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
    if (!enabled) {
      this.cleanupRouteAudio();
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

  private registerVoice(
    sources: (AudioScheduledSourceNode | OscillatorNode | AudioBufferSourceNode)[],
    gainNodes: GainNode[],
    durationMs: number
  ): void {
    const voice: ActiveVoice = { sources, gainNodes };
    voice.timerId = setTimeout(() => {
      this.activeVoices.delete(voice);
    }, Math.max(10, durationMs + 100));

    this.activeVoices.add(voice);
  }

  /**
   * Giải phóng tài nguyên âm thanh khi chuyển trang (cleanupRouteAudio):
   * Tự động dừng tất cả các voice đang phát dở (như chuông xoay 7.2s hoặc tiếng lật bài),
   * ngắt kết nối các audio node và suspend AudioContext để tránh rò rỉ bộ nhớ (memory/context leak)
   * hoặc lãng phí CPU giữa các route trong Next.js App Router.
   */
  public cleanupRouteAudio(): void {
    // 1. Dừng Ambient Drone nếu đang phát
    if (this.ambientNodes) {
      try {
        this.ambientNodes.osc1.stop();
        this.ambientNodes.osc2.stop();
        this.ambientNodes.osc1.disconnect();
        this.ambientNodes.osc2.disconnect();
        this.ambientNodes.gain.disconnect();
      } catch {
        // Safe fallback
      }
      this.ambientNodes = null;
    }

    // 2. Dừng và giải phóng toàn bộ transient voices đang hoạt động
    this.activeVoices.forEach((voice) => {
      if (voice.timerId) {
        clearTimeout(voice.timerId);
      }
      for (const src of voice.sources) {
        try {
          src.stop();
        } catch {
          // Safe fallback
        }
        try {
          src.disconnect();
        } catch {
          // Safe fallback
        }
      }
      for (const g of voice.gainNodes) {
        try {
          g.disconnect();
        } catch {
          // Safe fallback
        }
      }
    });
    this.activeVoices.clear();

    // 3. Tạm dừng AudioContext để giải phóng phần cứng âm thanh
    if (this.ctx && this.ctx.state === 'running') {
      try {
        void this.ctx.suspend();
      } catch {
        // Safe fallback
      }
    }
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

      this.registerVoice([osc1, osc2], [gain], 1600);
    } catch {
      // AudioContext policy safe fallback
    }
  }

  /**
   * Tiếng Chuông Xoay Tây Tạng (Tibetan Singing Bowl):
   * Tổng hợp đa tần số hình sin (multi-sine modal synthesis) mô phỏng chuông đồng thủ công:
   * - Cặp tần số nền giao thoa (beating pair): ~180.0Hz và 182.4Hz tạo nhịp phách chậm ~2.4Hz thư giãn.
   * - Họa âm kim loại phi điều hòa (metallic non-harmonic partials):
   *     + Mode 2: 504Hz (~2.8x)
   *     + Mode 3: 965Hz (~5.36x)
   *     + Mode 4: 1540Hz (~8.55x)
   * - Gõ vồ mềm (felt mallet strike transient): xung ấm nhẹ ở pha khởi phát.
   * - Suy giảm hàm mũ kéo dài 7.2 giây (7.2s gradual exponential decay), các họa âm cao tắt dần
   *   nhanh hơn tần số nền để giữ lại âm vang sâu lắng, tôn nghiêm khi hoàn thành nghi thức bói bài.
   */
  public playTibetanSingingBowl(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const totalDuration = 7.2;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, now);
      masterGain.connect(ctx.destination);

      const sources: (AudioScheduledSourceNode | OscillatorNode | AudioBufferSourceNode)[] = [];
      const gainNodes: GainNode[] = [masterGain];

      // 1. Strike transient (padded mallet impact on rim)
      const strikeOsc = ctx.createOscillator();
      const strikeGain = ctx.createGain();
      strikeOsc.type = 'sine';
      strikeOsc.frequency.setValueAtTime(140, now);
      strikeOsc.frequency.exponentialRampToValueAtTime(55, now + 0.08);

      strikeGain.gain.setValueAtTime(0.0001, now);
      strikeGain.gain.linearRampToValueAtTime(0.12, now + 0.006);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      strikeOsc.connect(strikeGain);
      strikeGain.connect(masterGain);
      strikeOsc.start(now);
      strikeOsc.stop(now + 0.12);
      sources.push(strikeOsc);
      gainNodes.push(strikeGain);

      // 2. Fundamental Beating Pair (~180Hz)
      const baseModes = [
        { freq: 180.0, gain: 0.16, decay: 7.2 },
        { freq: 182.4, gain: 0.14, decay: 7.2 },
      ];

      // 3. Metallic Non-Harmonic Partials (Bessel-type bowl modal resonances)
      const metallicPartials = [
        { freq: 504.0, gain: 0.075, decay: 5.6 }, // 2nd radial mode (~2.8x)
        { freq: 965.0, gain: 0.045, decay: 4.2 }, // 3rd mode (~5.36x)
        { freq: 1540.0, gain: 0.025, decay: 2.8 }, // 4th metallic shimmer (~8.55x)
      ];

      const allModes = [...baseModes, ...metallicPartials];

      for (const mode of allModes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(mode.freq, now);

        // Soft mallet strike onset (25ms attack) to prevent harsh click
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(mode.gain, now + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + mode.decay);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + mode.decay);

        sources.push(osc);
        gainNodes.push(gain);
      }

      this.registerVoice(sources, gainNodes, totalDuration * 1000);
    } catch {
      // AudioContext safe fallback
    }
  }

  /**
   * Âm thanh nhấp chuột tinh tế (Crisp Micro-Click):
   * Dành cho vi tương tác nút bấm, chọn tùy chọn, chuyển tab:
   * - Xung cơ học siêu ngắn (16ms): kết hợp xung sine trượt nhanh (2600Hz -> 750Hz)
   *   và dải lọc highpass mô phỏng tiếp điểm micro-switch xúc giác cao cấp.
   * - Âm lượng nhẹ nhàng (subtle), không gây mỏi thính giác khi nhấp liên tục.
   */
  public playCrispClick(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const duration = 0.016; // 16ms micro duration

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, now);
      masterGain.connect(ctx.destination);

      const sources: (AudioScheduledSourceNode | OscillatorNode | AudioBufferSourceNode)[] = [];
      const gainNodes: GainNode[] = [masterGain];

      // 1. Crisp pitch drop impulse
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2600, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + duration);

      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.linearRampToValueAtTime(0.055, now + 0.002);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration);
      sources.push(osc);
      gainNodes.push(oscGain);

      // 2. Micro friction noise click (tactile switch contact)
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.008)); // 8ms noise burst
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3200, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.028, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);

      noiseSource.start(now);
      sources.push(noiseSource);
      gainNodes.push(noiseGain);

      this.registerVoice(sources, gainNodes, duration * 1000 + 10);
    } catch {
      // AudioContext safe fallback
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
      this.registerVoice([noise], [gain], 60);
    } catch {
      // AudioContext policy safe fallback
    }
  }

  /**
   * Tiếng lật bài rột roạt tự nhiên (Organic Card Flip):
   * Kết hợp âm thanh lướt gió (aerodynamic swoosh) và tiếng gõ nhẹ/bật mép bài (gentle slap):
   * - Giai đoạn 1 (0ms - 130ms): Luồng khí cắt qua mép bài linen dầy dặn
   *   (bandpass noise sweep từ 1800Hz xuống 620Hz).
   * - Giai đoạn 2 (40ms - 160ms): Tiếng tiếp xúc bề mặt bàn nhung/gỗ (woody slap tap)
   *   với tần số cộng hưởng 280Hz -> 82Hz.
   * Mang lại xúc cảm chân thực vượt trội so với tiếng lật bài đơn âm cơ bản.
   */
  public playOrganicCardFlip(): void {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const totalDuration = 0.18; // 180ms

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, now);
      masterGain.connect(ctx.destination);

      const sources: (AudioScheduledSourceNode | OscillatorNode | AudioBufferSourceNode)[] = [];
      const gainNodes: GainNode[] = [masterGain];

      // 1. Aerodynamic swoosh (Air friction flutter: 0ms -> 130ms)
      const swooshDuration = 0.13;
      const swooshBufferSize = Math.max(1, Math.floor(ctx.sampleRate * swooshDuration));
      const swooshBuffer = ctx.createBuffer(1, swooshBufferSize, ctx.sampleRate);
      const swooshData = swooshBuffer.getChannelData(0);
      for (let i = 0; i < swooshBufferSize; i++) {
        swooshData[i] = Math.random() * 2 - 1;
      }

      const swooshNoise = ctx.createBufferSource();
      swooshNoise.buffer = swooshBuffer;

      const swooshFilter = ctx.createBiquadFilter();
      swooshFilter.type = 'bandpass';
      swooshFilter.Q.setValueAtTime(2.2, now);
      swooshFilter.frequency.setValueAtTime(1800, now);
      swooshFilter.frequency.exponentialRampToValueAtTime(620, now + swooshDuration);

      const swooshGain = ctx.createGain();
      swooshGain.gain.setValueAtTime(0.0001, now);
      swooshGain.gain.linearRampToValueAtTime(0.09, now + 0.025);
      swooshGain.gain.exponentialRampToValueAtTime(0.0001, now + swooshDuration);

      swooshNoise.connect(swooshFilter);
      swooshFilter.connect(swooshGain);
      swooshGain.connect(masterGain);

      swooshNoise.start(now);
      sources.push(swooshNoise);
      gainNodes.push(swooshGain);

      // 2. Gentle slap & card flex tap (Altar contact / edge flick: starts at now + 0.04s)
      const slapStart = now + 0.04;
      const slapDuration = 0.12;

      const slapOsc = ctx.createOscillator();
      const slapGain = ctx.createGain();

      slapOsc.type = 'triangle';
      slapOsc.frequency.setValueAtTime(280, slapStart);
      slapOsc.frequency.exponentialRampToValueAtTime(82, slapStart + slapDuration);

      slapGain.gain.setValueAtTime(0.0001, slapStart);
      slapGain.gain.linearRampToValueAtTime(0.22, slapStart + 0.012);
      slapGain.gain.exponentialRampToValueAtTime(0.0001, slapStart + slapDuration);

      slapOsc.connect(slapGain);
      slapGain.connect(masterGain);

      slapOsc.start(slapStart);
      slapOsc.stop(slapStart + slapDuration);
      sources.push(slapOsc);
      gainNodes.push(slapGain);

      this.registerVoice(sources, gainNodes, totalDuration * 1000);
    } catch {
      // AudioContext safe fallback
    }
  }

  /**
   * Tiếng lật bài (Card Flip - tương thích ngược):
   * Tự động điều hướng tới playOrganicCardFlip để mang lại chất âm chân thực nhất.
   */
  public playCardFlip(): void {
    this.playOrganicCardFlip();
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
      const sources: OscillatorNode[] = [];
      const gainNodes: GainNode[] = [];

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

        sources.push(osc);
        gainNodes.push(gain);
      });

      this.registerVoice(sources, gainNodes, (notes.length * 0.09 + 0.9) * 1000);
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
      const sources: OscillatorNode[] = [];
      const gainNodes: GainNode[] = [];

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

        sources.push(osc);
        gainNodes.push(gain);
      }

      this.registerVoice(sources, gainNodes, (duration + 0.05) * 1000);
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

      this.registerVoice([osc], [gain], 50);
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

      this.registerVoice([osc], [gain], 280);
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
      const sources: OscillatorNode[] = [];
      const gainNodes: GainNode[] = [];

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

        sources.push(osc);
        gainNodes.push(gain);
      });

      this.registerVoice(sources, gainNodes, (preset.notes.length * preset.stagger + preset.duration + 0.02) * 1000);
    } catch {
      // AudioContext safe fallback
    }
  }
}

export const soundManager = new SoundManager();
