'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva(
  'animate-pulse bg-muted rounded',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        shimmer: 'bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-[shimmer_2s_infinite]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface LoadingSkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, className }))}
        {...props}
      />
    );
  }
);

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Pre-built skeleton components for common use cases
export const ChatMessageSkeleton = () => (
  <div className="flex items-start gap-3 p-4">
    <LoadingSkeleton className="w-8 h-8 rounded-full" variant="shimmer" />
    <div className="flex-1 space-y-2">
      <LoadingSkeleton className="w-20 h-4" variant="shimmer" />
      <LoadingSkeleton className="w-full h-4" variant="shimmer" />
      <LoadingSkeleton className="w-3/4 h-4" variant="shimmer" />
    </div>
  </div>
);

export const RoomListSkeleton = () => (
  <div className="space-y-2 p-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 p-3 rounded-lg">
        <LoadingSkeleton className="w-10 h-10 rounded-full" variant="shimmer" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton className="w-32 h-4" variant="shimmer" />
          <LoadingSkeleton className="w-24 h-3" variant="shimmer" />
        </div>
        <LoadingSkeleton className="w-12 h-3" variant="shimmer" />
      </div>
    ))}
  </div>
);

export const UserProfileSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="flex flex-col items-center space-y-4">
      <LoadingSkeleton className="w-24 h-24 rounded-full" variant="shimmer" />
      <div className="space-y-2 text-center">
        <LoadingSkeleton className="w-32 h-6" variant="shimmer" />
        <LoadingSkeleton className="w-24 h-4" variant="shimmer" />
      </div>
    </div>
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <LoadingSkeleton className="w-20 h-4" variant="shimmer" />
          <LoadingSkeleton className="w-full h-10 rounded-md" variant="shimmer" />
        </div>
      ))}
    </div>
  </div>
);

export { LoadingSkeleton, skeletonVariants };