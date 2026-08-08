import type { AvaliacaoTipo } from './types'

export const AVALIACAO_TIPO_LABEL: Record<AvaliacaoTipo, string> = {
  atraso: 'Atrasou a entrega',
  qualidade: 'Qualidade do produto',
  produto_vencido: 'Veio vencido',
  outro: 'Outro',
}

interface Avaliavel {
  nota: number
}

/** `null` quando não há avaliação — zero mentiria, seria "nota péssima". */
export function mediaAvaliacao(
  avaliacoes: readonly Avaliavel[]
): number | null {
  if (avaliacoes.length === 0) return null
  const soma = avaliacoes.reduce((total, a) => total + a.nota, 0)
  return Math.round((soma / avaliacoes.length) * 10) / 10
}

interface OfertaFornecedor {
  fornecedorId: string
  fornecedorNome: string
  preco: number
  prazoEntregaDias: number | null
}

/**
 * Empate de preço é decidido pelo prazo: entre dois iguais, vale quem entrega
 * antes. Prazo não informado perde para qualquer prazo conhecido.
 */
export function melhorOferta<T extends OfertaFornecedor>(
  ofertas: readonly T[]
): T | null {
  if (ofertas.length === 0) return null

  return ofertas.reduce((melhor, atual) => {
    if (atual.preco !== melhor.preco) {
      return atual.preco < melhor.preco ? atual : melhor
    }
    const prazoAtual = atual.prazoEntregaDias ?? Number.POSITIVE_INFINITY
    const prazoMelhor = melhor.prazoEntregaDias ?? Number.POSITIVE_INFINITY
    return prazoAtual < prazoMelhor ? atual : melhor
  })
}

interface FornecedorFiltravel {
  nome: string
  contato: string | null
}

export function filtrarFornecedores<T extends FornecedorFiltravel>(
  fornecedores: readonly T[],
  busca: string
): T[] {
  const termo = busca.trim().toLowerCase()
  if (!termo) return [...fornecedores]

  return fornecedores.filter(
    (f) =>
      f.nome.toLowerCase().includes(termo) ||
      (f.contato?.toLowerCase().includes(termo) ?? false)
  )
}
