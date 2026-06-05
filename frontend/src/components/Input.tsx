import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || Math.random().toString(36).substring(2, 9);
  
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-mute">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-canvas text-ink text-sm rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2 transition-all outline-none placeholder-ink-faint w-full ${error ? 'border-accent-tomato focus:ring-accent-tomato' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-accent-tomato font-medium">{error}</span>
      )}
    </div>
  );
};
