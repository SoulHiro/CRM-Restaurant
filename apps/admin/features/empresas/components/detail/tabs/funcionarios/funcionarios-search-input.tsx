'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@repo/ui/components/input'

import { useQueryParams } from '@/hooks/use-query-params'

export function FuncionariosSearchInput() {
  const { searchParams, setParams } = useQueryParams()
  const urlValue = searchParams.get('funcQ') ?? ''
  const [value, setValue] = useState(urlValue)
  const lastPushedRef = useRef(urlValue)

  useEffect(() => {
    if (urlValue !== lastPushedRef.current) {
      lastPushedRef.current = urlValue
      setValue(urlValue)
    }
  }, [urlValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value === lastPushedRef.current) return
      lastPushedRef.current = value
      setParams({ funcQ: value || null, funcPage: null })
    }, 300)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative w-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar funcionário..."
        className="pl-8"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}
