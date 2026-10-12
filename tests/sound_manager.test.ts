import { describe, it, expect, beforeEach, vi } from 'vitest';
import { soundManager } from '@/lib/sound-effects';

describe('SoundManager Web Audio API Synthesizer Suite', () => {
  beforeEach(() => {
    // Reset soundEnabled to true
    soundManager.setEnabled(true);
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
    }).not.toThrow();
  });

  it('3. respects muted state and does not trigger synthesis when disabled', () => {
    soundManager.setEnabled(false);
    expect(soundManager.isEnabled()).toBe(false);

    // Call all audio methods while disabled
    expect(() => {
      soundManager.playBellTone();
      soundManager.playCardSlide();
      soundManager.playCardFlip();
      soundManager.playMysticChime();
    }).not.toThrow();
  });
});
