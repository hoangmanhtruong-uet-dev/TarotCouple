/**
 * Safe Mobile Haptic Vibration API
 * Gracefully no-ops in SSR, non-browser, and desktop environments without navigator.vibrate.
 */

export type HapticType = 'light' | 'medium' | 'success' | 'heartbeat' | 'warning';

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }

  if (typeof navigator.vibrate !== 'function') {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(28);
        break;
      case 'success':
        navigator.vibrate([18, 35, 22]);
        break;
      case 'heartbeat':
        navigator.vibrate([35, 50, 70]);
        break;
      case 'warning':
        navigator.vibrate([40, 60, 40]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Silently ignore permissions or hardware exceptions
  }
}
