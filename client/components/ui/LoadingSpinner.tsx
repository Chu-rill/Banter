'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid',
  {
    variants: {
      size: {
        xs: 'w-3 h-3 border',
        sm: 'w-4 h-4 border',
        md: 'w-6 h-6 border-2',
        lg: 'w-8 h-8 border-2',
        xl: 'w-12 h-12 border-2',
        '2xl': 'w-16 h-16 border-4',
      },
      variant: {
        default: 'border-primary border-t-transparent',
        light: 'border-white/30 border-t-white',
        dark: 'border-gray-800/30 border-t-gray-800',
        accent: 'border-accent/30 border-t-accent',
        gradient: 'border-transparent bg-gradient-to-tr from-purple-600 to-blue-600 bg-clip-border',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant, className }))}
        role="status"
        aria-label="Loading"
        {...props}
      />
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// Loading Overlay - Full screen loading
interface LoadingOverlayProps {
  text?: string;
  transparent?: boolean;
  size?: VariantProps<typeof spinnerVariants>['size'];
}

export function LoadingOverlay({
  text,
  transparent = false,
  size = 'xl'
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        transparent ? "bg-black/30 backdrop-blur-sm" : "bg-background/80"
      )}
    >
      <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={size} />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Loading Card - Centered loading in a container
interface LoadingCardProps {
  text?: string;
  className?: string;
  size?: VariantProps<typeof spinnerVariants>['size'];
}

export function LoadingCard({
  text = "Loading...",
  className,
  size = 'lg'
}: LoadingCardProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-8", className)}>
      <LoadingSpinner size={size} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

// Inline Loading - Small inline loader
interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ text, className }: InlineLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LoadingSpinner size="sm" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export { LoadingSpinner, spinnerVariants };