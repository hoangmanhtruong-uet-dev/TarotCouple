'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface FadeInViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

export function FadeInView({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  direction = 'up',
  distance = 20,
  once = true,
  as = 'div',
}: FadeInViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-40px 0px' });

  const directionOffset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  };

  const MotionComponent = motion[as as 'div'] || motion.div;

  return (
    <MotionComponent
      ref={ref}
      initial={{
        opacity: 0,
        filter: 'blur(4px)',
        ...directionOffset[direction],
      }}
      animate={
        isInView
          ? { opacity: 1, filter: 'blur(0px)', x: 0, y: 0 }
          : undefined
      }
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}