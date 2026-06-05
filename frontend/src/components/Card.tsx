import React from 'react';

interface CardProps {
  variant?: 'light' | 'dark';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'light',
  children,
  className = '',
}) => {
  const isLight = variant === 'light';
  
  return (
    <div
      className={`rounded-[12px] p-6 border transition-all duration-200 ${
        isLight
          ? 'bg-canvas text-ink border-hairline shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
          : 'bg-canvas-night text-on-dark border-canvas-night-soft shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
      } ${className}`}
    >
      {children}
    </div>
  );
};
