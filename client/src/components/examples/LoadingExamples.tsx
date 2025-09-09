'use client';

import React, { useState } from 'react';
import {
  LoadingSpinner,
  LoadingDots,
  LoadingOverlay,
  LoadingSkeleton,
  LoadingButton,
  ChatMessageSkeleton,
  RoomListSkeleton,
  UserProfileSkeleton,
  Button,
} from '@/components/ui';
import { useLoadingContext } from '@/contexts/LoadingContext';
import { useLoading } from '@/hooks/useLoading';

export default function LoadingExamples() {
  const [showOverlay, setShowOverlay] = useState(false);
  const { showGlobalLoading, hideGlobalLoading } = useLoadingContext();
  const { withLoading, isLoading, startLoading, stopLoading } = useLoading();

  const handleAsyncOperation = withLoading(async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, 'asyncOp');

  const handleGlobalLoading = () => {
    showGlobalLoading('Processing...', 'Please wait while we process your request.');
    setTimeout(() => hideGlobalLoading(), 3000);
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Loading Components Demo</h1>
      
      {/* Spinners */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Loading Spinners</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <LoadingSpinner size="xs" />
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
          <LoadingSpinner size="xl" />
          <LoadingSpinner size="2xl" />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <LoadingSpinner variant="default" />
          <LoadingSpinner variant="light" className="bg-black p-2 rounded" />
          <LoadingSpinner variant="dark" />
          <LoadingSpinner variant="accent" />
        </div>
      </section>

      {/* Loading Dots */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Loading Dots</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <LoadingDots size="sm" />
          <LoadingDots size="md" />
          <LoadingDots size="lg" />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <LoadingDots variant="default" />
          <LoadingDots variant="light" className="bg-black p-2 rounded" />
          <LoadingDots variant="accent" />
          <LoadingDots variant="muted" />
        </div>
      </section>

      {/* Loading Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Loading Buttons</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <LoadingButton loading>Default Loading</LoadingButton>
          <LoadingButton loading loadingText="Processing..." variant="gradient">
            Submit
          </LoadingButton>
          <LoadingButton loading loadingType="dots" variant="outline">
            Save
          </LoadingButton>
          <LoadingButton
            loading={isLoading('asyncOp')}
            onClick={handleAsyncOperation}
            variant="secondary"
          >
            Async Operation
          </LoadingButton>
        </div>
      </section>

      {/* Skeleton Components */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Loading Skeletons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Basic Skeletons</h3>
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-3/4" />
            <LoadingSkeleton className="h-10 w-32" />
            <LoadingSkeleton className="h-24 w-24 rounded-full" />
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">Shimmer Effect</h3>
            <LoadingSkeleton className="h-4 w-full" variant="shimmer" />
            <LoadingSkeleton className="h-4 w-3/4" variant="shimmer" />
            <LoadingSkeleton className="h-10 w-32" variant="shimmer" />
            <LoadingSkeleton className="h-24 w-24 rounded-full" variant="shimmer" />
          </div>
        </div>
      </section>

      {/* Pre-built Skeleton Components */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pre-built Skeletons</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border rounded-lg">
            <h3 className="font-medium p-4 border-b">Chat Messages</h3>
            <ChatMessageSkeleton />
            <ChatMessageSkeleton />
          </div>
          <div className="border rounded-lg">
            <h3 className="font-medium p-4 border-b">Room List</h3>
            <RoomListSkeleton />
          </div>
          <div className="border rounded-lg">
            <h3 className="font-medium p-4 border-b">User Profile</h3>
            <UserProfileSkeleton />
          </div>
        </div>
      </section>

      {/* Loading Overlays */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Loading Overlays</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <Button onClick={() => setShowOverlay(true)} variant="outline">
            Show Local Overlay
          </Button>
          <Button onClick={handleGlobalLoading} variant="outline">
            Show Global Loading
          </Button>
        </div>
      </section>

      {/* Local Overlay */}
      {showOverlay && (
        <LoadingOverlay
          message="Loading Content..."
          description="This is a local loading overlay that can be positioned anywhere."
          onClick={() => setShowOverlay(false)}
        />
      )}
    </div>
  );
}