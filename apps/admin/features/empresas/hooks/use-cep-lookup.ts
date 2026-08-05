'use client'

import { toast } from 'sonner'

import { onlyDigits } from '@repo/ui/lib/masks'
import { useDebouncedExternalLookup } from '@/hooks/use-debounced-external-lookup'

export interface ViaCepResult {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

interface ViaCepResponse extends ViaCepResult {
  erro?: boolean
}

export function useCepLookup(
  cep: string,
  onFound: (data: ViaCepResult) => void
) {
  return useDebouncedExternalLookup<ViaCepResult>({
    value: cep,
    isReady: (value) => onlyDigits(value).length === 8,
    errorMessage: 'Não foi possível consultar o CEP agora',
    fetcher: async (value, signal) => {
      const digits = onlyDigits(value)
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        signal,
      })
      const data: ViaCepResponse = await response.json()
      if (data.erro) {
        toast.error('CEP não encontrado')
        return null
      }
      return data
    },
    onResult: onFound,
  })
}
