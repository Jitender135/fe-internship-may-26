import { useState, useEffect, useRef } from 'react'
import type { Item } from '../types'
import { searchItems } from '../services/mockApi'

export interface UseSearchReturn {
  query: string
  setQuery: (q: string) => void
  results: Item[]
  isLoading: boolean
  error: string | null
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tracks the "latest" search request. Any response whose id doesn't
  // match this when it resolves is stale and gets discarded.
  const requestIdRef = useRef(0)

  useEffect(() => {
    let isMounted = true

    // Debounce: wait 300ms after the user stops typing.
    const timerId = setTimeout(() => {
      // Bump the request id — this becomes "the current request"
      const currentRequestId = ++requestIdRef.current

      setIsLoading(true)
      setError(null)

      searchItems(query)
        .then(data => {
          // Ignore if unmounted, or if a newer request has since started
          if (!isMounted || currentRequestId !== requestIdRef.current) return
          setResults(data)
          setIsLoading(false)
        })
        .catch(err => {
          if (!isMounted || currentRequestId !== requestIdRef.current) return
          setError(err instanceof Error ? err.message : 'Something went wrong')
          setIsLoading(false)
        })
    }, 300)

    // Cleanup: cancel the pending debounce timer if query changes again
    // or the component unmounts.
    return () => {
      isMounted = false
      clearTimeout(timerId)
    }
  }, [query])

  return { query, setQuery, results, isLoading, error }
}