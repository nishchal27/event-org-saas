'use client'

import { useState, useEffect } from 'react'

/**
 * Returns a debounced value that updates only after the input has been stable
 * for `delayMs`. Use for search inputs or any value that triggers API calls
 * to avoid excessive requests.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debouncedValue
}
