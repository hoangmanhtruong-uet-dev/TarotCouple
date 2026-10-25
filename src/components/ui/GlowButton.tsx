'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowColor?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function GlowButton({
  variant = 'primary',
  size = 'md',
  glowColor,
  icon,
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: GlowButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyles =
    'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0A12] active:scale-[0.97]';

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs min-h-[36px]',
    md: 'px-6 py-3 text-sm min-h-[44px]',
    lg: 'px-8 py-4 text-base min-h-[52px]',
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-[#C9A24A] to-[#E5C687] text-[#0B0A12]
      hover:from-[#D4AD55] hover:to-[#EDD192]
      focus-visible:ring-[#C9A24A]
      disabled:from-[#3B354D] disabled:to-[#3B354D] disabled:text-[#5E5873]
    `,
    secondary: `
      bg-[#14111C] text-[#F8F5F0] border border-[#262235]
      hover:bg-[#1A1726] hover:border-[#3B354D]
      focus-visible:ring-[#3B354D]
      disabled:bg-[#14111C] disabled:text-[#3B354D] disabled:border-[#1A1726]
    `,
    ghost: `
      bg-transparent text-[#9E96B0]
      hover:bg-[#14111C] hover:text-[#F8F5F0]
      focus-visible:ring-[#3B354D]
      disabled:text-[#3B354D]
    `,
  };

  const glowStyle =
    variant === 'primary' && !isDisabled
      ? {
          boxShadow: `0 0 20px ${glowColor || 'rgba(201, 162, 74, 0.35)'}`,
        }
      : undefined;

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={glowStyle}
      disabled={isDisabled}
      {...(props as any)}
    >
      {/* Glow pulse animation for primary idle state */}
      {variant === 'primary' && !isDisabled && (
        <span
          className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            animation: 'glow-pulse 3s ease-in-out infinite',
            boxShadow: `0 0 24px ${glowColor || 'rgba(201, 162, 74, 0.4)'}`,
          }}
          aria-hidden="true"
        />
      )}

      {loading ? (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-label="Đang tải..."
        />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}