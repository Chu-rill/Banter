'use client';

import { useState, useCallback } from 'react';

export interface LoadingState {
  [key: string]: boolean;
}

export interface UseLoadingReturn {
  loading: boolean;
  loadingStates: LoadingState;
  setLoading: (loading: boolean) => void;
  setLoadingState: (key: string, loading: boolean) => void;
  withLoading: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    key?: string
  ) => (...args: T) => Promise<R>;
  isLoading: (key?: string) => boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
}

export function useLoading(initialLoading = false): UseLoadingReturn {
  const [loading, setLoading] = useState(initialLoading);
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoadingState = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return loading || Object.values(loadingStates).some(Boolean);
  }, [loading, loadingStates]);

  const startLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingState(key, true);
    } else {
      setLoading(true);
    }
  }, [setLoadingState]);

  const stopLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingState(key, false);
    } else {
      setLoading(false);
    }
  }, [setLoadingState]);

  const withLoading = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      key?: string
    ) => {
      return async (...args: T): Promise<R> => {
        try {
          if (key) {
            setLoadingState(key, true);
          } else {
            setLoading(true);
          }
          
          const result = await fn(...args);
          return result;
        } finally {
          if (key) {
            setLoadingState(key, false);
          } else {
            setLoading(false);
          }
        }
      };
    },
    [setLoadingState]
  );

  return {
    loading,
    loadingStates,
    setLoading,
    setLoadingState,
    withLoading,
    isLoading,
    startLoading,
    stopLoading,
  };
}