'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface UseDebouncedExternalLookupOptions<T> {
  value: string
  isReady: (value: string) => boolean
  fetcher: (value: string, signal: AbortSignal) => Promise<T | null>
  onResult: (data: T) => void
  debounceMs?: number
  errorMessage?: string
}

export function useDebouncedExternalLookup<T>({
  value,
  isReady,
  fetcher,
  onResult,
  debounceMs = 400,
  errorMessage = 'Não foi possível concluir a consulta agora',
}: UseDebouncedExternalLookupOptions<T>) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isReady(value)) return

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        const result = await fetcher(value, controller.signal)
        if (result !== null) onResult(result)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error(errorMessage)
        }
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return { isLoading }
}
