'use client';

import React from 'react';
import { Button, ButtonProps } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { LoadingDots } from './LoadingDots';

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  loadingType?: 'spinner' | 'dots';
  spinnerSize?: 'xs' | 'sm' | 'md' | 'lg';
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    children, 
    loading = false, 
    loadingText,
    loadingType = 'spinner',
    spinnerSize = 'sm',
    disabled, 
    variant,
    ...props 
  }, ref) => {
    const spinnerVariant = variant === 'gradient' || variant === 'default' ? 'light' : 'default';
    
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        variant={variant}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            {loadingType === 'spinner' ? (
              <LoadingSpinner size={spinnerSize} variant={spinnerVariant} />
            ) : (
              <LoadingDots size="sm" variant={spinnerVariant === 'light' ? 'light' : 'default'} />
            )}
            {loadingText && <span>{loadingText}</span>}
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };