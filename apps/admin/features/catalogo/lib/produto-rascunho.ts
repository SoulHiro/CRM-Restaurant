import type { CriarProdutoInput } from './types'

const PREFIXO = 'catalogo:produto-rascunho:'
// Rascunho velho demais provavelmente é de uma tentativa abandonada há dias —
// depois disso é melhor começar limpo do que restaurar dado desatualizado.
const VALIDADE_MS = 24 * 60 * 60 * 1000

interface RascunhoArmazenado {
  salvoEm: number
  dados: CriarProdutoInput
}

function chave(produtoId?: string): string {
  // Cadastro novo e cada produto editado têm rascunho próprio — editar o
  // produto A não pode oferecer restaurar um rascunho abandonado do produto B.
  return `${PREFIXO}${produtoId ?? 'novo'}`
}

export function lerRascunho(produtoId?: string): CriarProdutoInput | null {
  if (typeof window === 'undefined') return null
  try {
    const bruto = window.localStorage.getItem(chave(produtoId))
    if (!bruto) return null
    const armazenado = JSON.parse(bruto) as RascunhoArmazenado
    if (Date.now() - armazenado.salvoEm > VALIDADE_MS) {
      window.localStorage.removeItem(chave(produtoId))
      return null
    }
    return armazenado.dados
  } catch {
    return null
  }
}

export function salvarRascunho(
  produtoId: string | undefined,
  dados: CriarProdutoInput
): void {
  if (typeof window === 'undefined') return
  const armazenado: RascunhoArmazenado = { salvoEm: Date.now(), dados }
  window.localStorage.setItem(chave(produtoId), JSON.stringify(armazenado))
}

export function limparRascunho(produtoId?: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(chave(produtoId))
}
