import React from 'react';

interface SkeletonCardProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function SkeletonCard({
  className = '',
  width,
  height = '120px',
  rounded = 'lg',
}: SkeletonCardProps) {
  const radiusMap = {
    sm: 'rounded-md',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`tc-skeleton ${radiusMap[rounded]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}