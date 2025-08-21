'use client'

import { useState, useCallback } from 'react'

export interface UseLoadingState {
  isLoading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  executeAsync: <T>(operation: () => Promise<T>) => Promise<T>
}

/**
 * Custom hook for managing loading states and async operations
 * Provides consistent loading state management across components
 */
export function useLoadingState(): UseLoadingState {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
    // Clear error when starting a new operation
    if (loading) {
      setError(null)
    }
  }, [])

  const executeAsync = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setLoading])

  return {
    isLoading,
    error,
    setLoading,
    setError,
    executeAsync
  }
}