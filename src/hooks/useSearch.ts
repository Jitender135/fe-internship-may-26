import { useState, useEffect, useRef } from 'react'
import type { Item } from '../types'
import { searchItems } from '../services/mockApi'
import { useDebounce } from './useDebounce'

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
  const requestIdRef = useRef(0)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    let isMounted = true
    const currentRequestId = ++requestIdRef.current

    setIsLoading(true)
    setError(null)

    searchItems(debouncedQuery)
      .then(data => {
        if (!isMounted || currentRequestId !== requestIdRef.current) return
        setResults(data)
        setIsLoading(false)
      })
      .catch(err => {
        if (!isMounted || currentRequestId !== requestIdRef.current) return
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [debouncedQuery])

  // On mount, read initial query from URL
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const q = params.get('q')
  if (q) setQuery(q)
}, [])

// Whenever query changes, update the URL without reloading
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (query) {
    params.set('q', query)
  } else {
    params.delete('q')
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, '')
  window.history.replaceState({}, '', newUrl)
}, [query])

  return { query, setQuery, results, isLoading, error }
}