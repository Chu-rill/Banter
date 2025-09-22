'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

const overlayVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center',
  {
    variants: {
      variant: {
        default: 'bg-background/80 backdrop-blur-sm',
        dark: 'bg-black/50 backdrop-blur-sm',
        light: 'bg-white/80 backdrop-blur-sm',
        transparent: 'bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const contentVariants = cva(
  'flex flex-col items-center gap-4 p-6 rounded-lg shadow-lg',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border',
        minimal: 'bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface LoadingOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof overlayVariants> {
  message?: string;
  description?: string;
  showCard?: boolean;
  spinnerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  spinnerVariant?: 'default' | 'light' | 'dark' | 'accent' | 'gradient';
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ 
    className, 
    variant, 
    message = 'Loading...', 
    description,
    showCard = true,
    spinnerSize = 'xl',
    spinnerVariant = 'default',
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(overlayVariants({ variant, className }))}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loading-title"
        aria-describedby={description ? "loading-description" : undefined}
        {...props}
      >
        <div className={cn(contentVariants({ variant: showCard ? 'default' : 'minimal' }))}>
          <LoadingSpinner size={spinnerSize} variant={spinnerVariant} />
          {message && (
            <h2 id="loading-title" className="text-lg font-semibold">
              {message}
            </h2>
          )}
          {description && (
            <p id="loading-description" className="text-sm text-muted-foreground text-center max-w-sm">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

export { LoadingOverlay };