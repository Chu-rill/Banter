'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLoading, UseLoadingReturn } from '@/hooks/useLoading';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

interface LoadingContextType extends UseLoadingReturn {
  showGlobalLoading: (message?: string, description?: string) => void;
  hideGlobalLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const loadingHook = useLoading();
  const [globalLoading, setGlobalLoading] = React.useState<{
    show: boolean;
    message?: string;
    description?: string;
  }>({ show: false });

  const showGlobalLoading = React.useCallback((message?: string, description?: string) => {
    setGlobalLoading({ show: true, message, description });
  }, []);

  const hideGlobalLoading = React.useCallback(() => {
    setGlobalLoading({ show: false });
  }, []);

  const contextValue: LoadingContextType = {
    ...loadingHook,
    showGlobalLoading,
    hideGlobalLoading,
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {globalLoading.show && (
        <LoadingOverlay
          message={globalLoading.message}
          description={globalLoading.description}
        />
      )}
    </LoadingContext.Provider>
  );
}

export function useLoadingContext(): LoadingContextType {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
}

// HOC for components that need loading context
export function withLoading<P extends object>(Component: React.ComponentType<P>) {
  return function WithLoadingComponent(props: P) {
    return (
      <LoadingProvider>
        <Component {...props} />
      </LoadingProvider>
    );
  };
}