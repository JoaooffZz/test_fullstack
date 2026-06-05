import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || Math.random().toString(36).substring(2, 9);
  
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;
  
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-mute">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          id={inputId}
          type={currentType}
          className={`bg-canvas text-ink text-sm rounded-[6px] border border-hairline focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2 transition-all outline-none placeholder-ink-faint w-full ${isPassword ? 'pr-10' : ''} ${error ? 'border-accent-tomato focus:ring-accent-tomato' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute-2 hover:text-ink cursor-pointer focus:outline-none flex items-center justify-center p-0.5"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-accent-tomato font-medium">{error}</span>
      )}
    </div>
  );
};
