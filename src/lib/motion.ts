/**
 * motion.ts
 * Shared motion tokens, easing curves, and spring presets for TarotCouple.
 * Optimized for 60fps animations on mobile and desktop.
 */

export const TRANSITION_EASINGS = {
  // Editorial smooth entry & exit
  smoothOut: [0.22, 1, 0.36, 1] as const,
  smoothInOut: [0.65, 0, 0.35, 1] as const,
  anticipate: [0.36, 0, 0.66, -0.56] as const,
  glowPulse: [0.4, 0, 0.2, 1] as const,
};

export const SPRINGS = {
  // Gentle tactile spring (for buttons, fan hover)
  gentle: {
    type: 'spring',
    stiffness: 260,
    damping: 24,
    mass: 0.8,
  } as const,
  // Snappy responsive spring (for card fan out, popovers)
  snappy: {
    type: 'spring',
    stiffness: 380,
    damping: 30,
    mass: 1,
  } as const,
  // Bouncy spring (for notifications, badges)
  bouncy: {
    type: 'spring',
    stiffness: 420,
    damping: 18,
    mass: 0.7,
  } as const,
};

export const DURATIONS = {
  instant: 0.12,
  fast: 0.25,
  normal: 0.45,
  slow: 0.7,
  curtain: 0.38,
};

export const STAGGER_TIMINGS = {
  headerPill: 0.1,
  headlineWords: 0.06,
  description: 0.7,
  deckFanOut: 0.07,
  ctaButtons: 1.5,
  trustPill: 1.7,
};
