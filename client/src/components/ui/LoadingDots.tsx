'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dotsVariants = cva(
  'inline-flex items-center gap-1',
  {
    variants: {
      size: {
        sm: 'gap-0.5',
        md: 'gap-1',
        lg: 'gap-1.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const dotVariants = cva(
  'rounded-full animate-pulse',
  {
    variants: {
      size: {
        sm: 'w-1 h-1',
        md: 'w-1.5 h-1.5',
        lg: 'w-2 h-2',
      },
      variant: {
        default: 'bg-primary',
        light: 'bg-white',
        dark: 'bg-gray-800',
        accent: 'bg-accent',
        muted: 'bg-muted-foreground',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface LoadingDotsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dotsVariants>,
    VariantProps<typeof dotVariants> {}

const LoadingDots = React.forwardRef<HTMLDivElement, LoadingDotsProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(dotsVariants({ size, className }))}
        role="status"
        aria-label="Loading"
        {...props}
      >
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              dotVariants({ size, variant }),
              'animate-pulse'
            )}
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
    );
  }
);

LoadingDots.displayName = 'LoadingDots';

export { LoadingDots };