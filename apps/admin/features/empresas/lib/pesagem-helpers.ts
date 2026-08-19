import type { EmpresaEndereco, PedidoDoDiaItem } from './types'

/** Endereço em uma linha, pro cabeçalho do papel de pesagem. */
export function formatarEndereco(endereco: EmpresaEndereco): string {
  const partes = [
    [endereco.logradouro, endereco.numero].filter(Boolean).join(', '),
    endereco.bairro,
    [endereco.cidade, endereco.uf].filter(Boolean).join('/'),
  ].filter(Boolean)

  return partes.join(' — ')
}

/**
 * Arroz/feijão em gramas — o "acrescentar dois zeros" que o pessoal da
 * cozinha usa de cabeça é só kg→g (×1000). A fórmula em si (pessoas × fator
 * × 1,2) foi validada contra `CONTROLE DE PESAGEM.xlsx` real: 39 pessoas →
 * 9,36kg de arroz, exatamente `39×0,2×1,2`.
 */
export function calcularArrozGramas(pessoas: number): number {
  return Math.round(pessoas * 0.2 * 1.2 * 1000)
}

export function calcularFeijaoGramas(pessoas: number): number {
  return Math.round(pessoas * 0.1 * 1.2 * 1000)
}

export interface ContagemPrato {
  prato: string
  quantidade: number
}

/** Quantas pessoas escolheram cada prato — quem recusou não conta. */
export function contarPorPrato(pedidos: readonly PedidoDoDiaItem[]): ContagemPrato[] {
  const porPrato = new Map<string, number>()

  for (const pedido of pedidos) {
    if (pedido.recusou || !pedido.prato) continue
    porPrato.set(pedido.prato, (porPrato.get(pedido.prato) ?? 0) + 1)
  }

  return [...porPrato.entries()]
    .map(([prato, quantidade]) => ({ prato, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
}

export type GrupoPesagem = 'individual' | 'grupoA' | 'grupoB'

/**
 * Só usado em empresas com `fluxo_pedido = 'pesagem'` (hoje só NOVAPRINT2).
 * 3º turno é sempre comanda individual — nunca entra em lote. Dentro de
 * 1º turno/administrativo/2º turno, `separado` (o toggle "marmita
 * separada", ex-nomes em vermelho) tira a pessoa do lote pelo mesmo motivo:
 * vira comanda avulsa. Qualquer outro turno (almoço/jantar de fluxo padrão,
 * ou pedido sem turno) não entra em nenhum dos três grupos.
 */
export function agruparParaPesagem(
  pedidos: readonly PedidoDoDiaItem[],
  colaboradoresSeparados: ReadonlySet<string>
): {
  individual: PedidoDoDiaItem[]
  grupoA: PedidoDoDiaItem[]
  grupoB: PedidoDoDiaItem[]
} {
  const individual: PedidoDoDiaItem[] = []
  const grupoA: PedidoDoDiaItem[] = []
  const grupoB: PedidoDoDiaItem[] = []

  for (const pedido of pedidos) {
    const separado = colaboradoresSeparados.has(pedido.colaboradorId)

    if (pedido.turno === '3_turno' || separado) {
      individual.push(pedido)
      continue
    }
    if (pedido.turno === '1_turno' || pedido.turno === 'administrativo') {
      grupoA.push(pedido)
      continue
    }
    if (pedido.turno === '2_turno') {
      grupoB.push(pedido)
    }
  }

  return { individual, grupoA, grupoB }
}

/** Só quem não recusou conta como "vai comer" pro headcount do lote. */
function contarPessoas(pedidos: readonly PedidoDoDiaItem[]): number {
  return pedidos.filter((p) => !p.recusou).length
}

export interface ResumoPesagemGrupo {
  totalPessoas: number
  arrozGramas: number
  feijaoGramas: number
  itens: ContagemPrato[]
}

export function montarResumoPesagemGrupo(
  pedidos: readonly PedidoDoDiaItem[]
): ResumoPesagemGrupo {
  const totalPessoas = contarPessoas(pedidos)
  return {
    totalPessoas,
    arrozGramas: calcularArrozGramas(totalPessoas),
    feijaoGramas: calcularFeijaoGramas(totalPessoas),
    itens: contarPorPrato(pedidos.filter((p) => !p.recusou)),
  }
}
