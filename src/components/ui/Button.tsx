'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-4 py-3 text-sm'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'lg',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98] hover:scale-[1.02]',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : leftIcon ? (
          <span className="w-4 h-4">{leftIcon}</span>
        ) : null}
        
        <span>{loading ? 'Cargando...' : children}</span>
        
        {rightIcon && !loading && (
          <span className="w-4 h-4">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";