'use client'

import { toast } from 'sonner'

import { onlyDigits } from '@repo/ui/lib/masks'
import { useDebouncedExternalLookup } from '@/hooks/use-debounced-external-lookup'

interface BrasilApiCnpjResponse {
  razao_social?: string
  nome_fantasia?: string
}

export function useCnpjLookup(cnpj: string, onFound: (nome: string) => void) {
  return useDebouncedExternalLookup<string>({
    value: cnpj,
    isReady: (value) => onlyDigits(value).length === 14,
    errorMessage: 'Não foi possível consultar o CNPJ agora',
    fetcher: async (value, signal) => {
      const digits = onlyDigits(value)
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
        { signal }
      )
      if (!response.ok) {
        toast.error('CNPJ não encontrado na Receita Federal')
        return null
      }
      const data: BrasilApiCnpjResponse = await response.json()
      return data.razao_social ?? data.nome_fantasia ?? null
    },
    onResult: onFound,
  })
}
