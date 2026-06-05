import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'dark' | 'link';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium text-sm rounded-[6px] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  let variantStyle = '';
  
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-primary text-on-primary hover:bg-primary-deep active:bg-primary-deep py-2 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]';
      break;
    case 'outline':
      variantStyle = 'bg-canvas text-ink border border-hairline-strong hover:bg-canvas-soft active:bg-canvas-soft py-2 px-4';
      break;
    case 'dark':
      variantStyle = 'bg-canvas-night text-on-dark hover:bg-canvas-night-soft py-2 px-4 border border-canvas-night-soft';
      break;
    case 'link':
      variantStyle = 'bg-transparent text-ink hover:underline p-0 rounded-none inline';
      break;
  }
  
  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
