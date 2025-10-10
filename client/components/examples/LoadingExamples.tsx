"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import {
  LoadingSpinner,
  LoadingOverlay,
  LoadingCard,
  InlineLoading,
} from "@/components/ui/LoadingSpinner";
import { useLoading } from "../../hooks/useLoading";

export default function LoadingExamples() {
  const [showOverlay, setShowOverlay] = useState(false);
  const { withLoading, isLoading } = useLoading();

  const handleAsyncOperation = withLoading(async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }, "asyncOp");

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">
        Loading Components Demo
      </h1>

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

      {/* Loading Card */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Loading Card</h2>
        <LoadingCard text="Loading..." />
      </section>

      {/* Inline Loading */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Inline Loading</h2>
        <InlineLoading text="Processing..." />
      </section>

      {/* Loading Overlays */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Loading Overlays</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <Button onClick={() => setShowOverlay(true)} variant="outline">
            Show Local Overlay
          </Button>
          <Button
            onClick={handleAsyncOperation}
            loading={isLoading("asyncOp")}
            variant="outline"
          >
            Async Operation
          </Button>
        </div>
      </section>

      {/* Local Overlay */}
      {showOverlay && (
        <div onClick={() => setShowOverlay(false)}>
          <LoadingOverlay
            text="Loading Content..."
            transparent
          />
        </div>
      )}
    </div>
  );
}
