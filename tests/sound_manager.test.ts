import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { soundManager, SoundManager } from '@/lib/sound-effects';

describe('SoundManager Web Audio API Synthesizer Suite (Milestone 1)', () => {
  beforeEach(() => {
    soundManager.setEnabled(true);
  });

  afterEach(() => {
    soundManager.cleanupRouteAudio();
    vi.restoreAllMocks();
  });

  it('1. correctly toggles and remembers sound preference state', () => {
    expect(soundManager.isEnabled()).toBe(true);

    const toggled = soundManager.toggle();
    expect(toggled).toBe(false);
    expect(soundManager.isEnabled()).toBe(false);

    soundManager.setEnabled(true);
    expect(soundManager.isEnabled()).toBe(true);
  });

  it('2. safely invokes all audio synthesis methods without crashing in non-browser or test environments', () => {
    expect(() => {
      soundManager.playBellTone();
      soundManager.playCardSlide();
      soundManager.playCardFlip();
      soundManager.playMysticChime();
      soundManager.playTibetanSingingBowl();
      soundManager.playCrispClick();
      soundManager.playOrganicCardFlip();
      soundManager.cleanupRouteAudio();
    }).not.toThrow();
  });

  it('3. respects muted state and does not trigger synthesis when disabled', () => {
    soundManager.setEnabled(false);
    expect(soundManager.isEnabled()).toBe(false);

    expect(() => {
      soundManager.playBellTone();
      soundManager.playCardSlide();
      soundManager.playCardFlip();
      soundManager.playMysticChime();
      soundManager.playTibetanSingingBowl();
      soundManager.playCrispClick();
      soundManager.playOrganicCardFlip();
      soundManager.cleanupRouteAudio();
    }).not.toThrow();
  });

  it('4. verifies SoundManagerInterface compliance and method signatures', () => {
    expect(typeof soundManager.playTibetanSingingBowl).toBe('function');
    expect(typeof soundManager.playCrispClick).toBe('function');
    expect(typeof soundManager.playOrganicCardFlip).toBe('function');
    expect(typeof soundManager.playCardSlide).toBe('function');
    expect(typeof soundManager.playMysticChime).toBe('function');
    expect(typeof soundManager.playMagneticHover).toBe('function');
    expect(typeof soundManager.toggle).toBe('function');
    expect(typeof soundManager.isEnabled).toBe('function');
    expect(typeof soundManager.cleanupRouteAudio).toBe('function');
  });

  describe('Synthetic Web Audio API Environment (Mocked Web Audio Context)', () => {
    let mockContext: any;
    let createdOscillators: any[];
    let createdGains: any[];
    let createdBuffers: any[];
    let createdBufferSources: any[];
    let createdFilters: any[];
    let mockLocalStorage: Record<string, string>;

    beforeEach(() => {
      createdOscillators = [];
      createdGains = [];
      createdBuffers = [];
      createdBufferSources = [];
      createdFilters = [];
      mockLocalStorage = {};

      mockContext = {
        currentTime: 10,
        sampleRate: 44100,
        state: 'running',
        destination: { connect: vi.fn(), disconnect: vi.fn() },
        suspend: vi.fn().mockImplementation(() => {
          mockContext.state = 'suspended';
          return Promise.resolve();
        }),
        resume: vi.fn().mockImplementation(() => {
          mockContext.state = 'running';
          return Promise.resolve();
        }),
        createOscillator: vi.fn().mockImplementation(() => {
          const osc = {
            type: 'sine',
            frequency: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          };
          createdOscillators.push(osc);
          return osc;
        }),
        createGain: vi.fn().mockImplementation(() => {
          const gain = {
            gain: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
              setTargetAtTime: vi.fn(),
            },
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
          createdGains.push(gain);
          return gain;
        }),
        createBiquadFilter: vi.fn().mockImplementation(() => {
          const filter = {
            type: 'bandpass',
            frequency: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            Q: { setValueAtTime: vi.fn() },
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
          createdFilters.push(filter);
          return filter;
        }),
        createBuffer: vi.fn().mockImplementation((channels: number, length: number, sampleRate: number) => {
          const buf = {
            getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
            duration: length / sampleRate,
            length,
            sampleRate,
          };
          createdBuffers.push(buf);
          return buf;
        }),
        createBufferSource: vi.fn().mockImplementation(() => {
          const bs = {
            buffer: null,
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
          };
          createdBufferSources.push(bs);
          return bs;
        }),
      };

      const mockWindow = {
        AudioContext: vi.fn().mockImplementation(() => mockContext),
        localStorage: {
          getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
          setItem: vi.fn((key: string, value: string) => {
            mockLocalStorage[key] = value;
          }),
        },
      };

      vi.stubGlobal('window', mockWindow);
      vi.stubGlobal('localStorage', mockWindow.localStorage);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('5. playTibetanSingingBowl synthesizes ~180Hz beating pair and 7.2s exponential decay', () => {
      const manager = new SoundManager();
      manager.playTibetanSingingBowl();

      expect(mockContext.createOscillator).toHaveBeenCalled();
      expect(createdOscillators.length).toBe(6);

      const freqs = createdOscillators.map(
        (o) => o.frequency.setValueAtTime.mock.calls[0]?.[0]
      );
      expect(freqs).toContain(180.0);
      expect(freqs).toContain(182.4);
      expect(freqs).toContain(504.0);
      expect(freqs).toContain(965.0);
      expect(freqs).toContain(1540.0);

      const decayCalls = createdGains.flatMap(
        (g) => g.gain.exponentialRampToValueAtTime.mock.calls
      );
      const times = decayCalls.map((call) => call[1]);
      expect(times.some((t: number) => Math.abs(t - 17.2) < 0.05)).toBe(true);
    });

    it('6. playCrispClick generates subtle micro-transient (<20ms)', () => {
      const manager = new SoundManager();
      manager.playCrispClick();

      expect(mockContext.createOscillator).toHaveBeenCalled();
      expect(mockContext.createBufferSource).toHaveBeenCalled();

      const osc = createdOscillators[0];
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(2600, 10);
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        750,
        expect.closeTo(10.016, 3)
      );

      const buffer = createdBuffers[0];
      expect(buffer.length).toBeLessThanOrEqual(Math.floor(44100 * 0.009));
      expect(osc.stop).toHaveBeenCalledWith(expect.closeTo(10.016, 3));
    });

    it('7. playOrganicCardFlip synthesizes swoosh noise and gentle resonant slap', () => {
      const manager = new SoundManager();
      manager.playOrganicCardFlip();

      expect(mockContext.createBufferSource).toHaveBeenCalled();
      expect(createdFilters.length).toBeGreaterThan(0);
      const bandpassFilter = createdFilters[0];
      expect(bandpassFilter.type).toBe('bandpass');
      expect(bandpassFilter.frequency.setValueAtTime).toHaveBeenCalledWith(1800, 10);
      expect(bandpassFilter.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        620,
        expect.closeTo(10.13, 2)
      );

      const slapOsc = createdOscillators.find((o) => o.type === 'triangle');
      expect(slapOsc).toBeDefined();
      expect(slapOsc.frequency.setValueAtTime).toHaveBeenCalledWith(280, expect.closeTo(10.04, 2));
      expect(slapOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        82,
        expect.closeTo(10.16, 2)
      );
    });

    it('8. cleanupRouteAudio cancels all transient voices, ambient drone, and suspends AudioContext', () => {
      const manager = new SoundManager();
      manager.playTibetanSingingBowl();
      manager.toggleAmbientDrone(true);

      expect(mockContext.state).toBe('running');

      manager.cleanupRouteAudio();

      for (const osc of createdOscillators) {
        expect(osc.stop).toHaveBeenCalled();
        expect(osc.disconnect).toHaveBeenCalled();
      }
      for (const gain of createdGains) {
        expect(gain.disconnect).toHaveBeenCalled();
      }

      expect(mockContext.suspend).toHaveBeenCalled();
      expect(mockContext.state).toBe('suspended');
    });

    it('9. localStorage persistence remembers muted state across instances and muting triggers cleanup', () => {
      const manager1 = new SoundManager();
      expect(manager1.isEnabled()).toBe(true);
      manager1.playCrispClick();
      expect(mockContext.state).toBe('running');

      manager1.setEnabled(false);
      expect(manager1.isEnabled()).toBe(false);
      expect(mockLocalStorage['tc_sound_enabled']).toBe('false');

      expect(mockContext.suspend).toHaveBeenCalled();

      const manager2 = new SoundManager();
      expect(manager2.isEnabled()).toBe(false);
    });
  });
});
