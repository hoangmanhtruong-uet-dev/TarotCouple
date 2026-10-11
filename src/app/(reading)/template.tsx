'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function PageTransitionTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  // If user prefers reduced motion, do a gentle instant fade
  if (shouldReduceMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.38,
        ease: [0.22, 1, 0.36, 1], // Smooth cubic easing
      }}
    >
      {children}
    </motion.div>
  );
}
