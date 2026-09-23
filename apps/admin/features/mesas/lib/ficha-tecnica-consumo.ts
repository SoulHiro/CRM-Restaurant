import { multiplicadorPorPeso } from '@/features/catalogo/lib/precificacao-helpers'

export interface FichaTecnicaLinha {
  /** id de `produto_ficha_tecnica_item` — usado só pra casar com `OverrideTamanho.fichaTecnicaItemId`. */
  id: string
  estoqueItemId: string
  quantidade: number
  tipoEscala: 'proporcional' | 'fixo'
}

export interface OverrideTamanho {
  fichaTecnicaItemId: string
  estoqueItemId: string | null
  quantidade: number
}

export interface ConsumoInsumo {
  estoqueItemId: string
  quantidade: number
}

/**
 * Traduz "vendi N unidades deste produto (neste tamanho)" em "baixar tanto
 * de cada insumo" — mesma matemática de `calcularCustoInsumosTamanho`
 * (`features/catalogo/lib/precificacao-helpers.ts`), só que devolvendo
 * quantidade de insumo em vez de custo, pra virar `estoque_movimento`.
 * Linhas que resolvem pro mesmo insumo (ex: override aponta pro mesmo item
 * da linha base) são somadas — um único movimento por insumo.
 */
export function calcularConsumoInsumos(
  ficha: readonly FichaTecnicaLinha[],
  overrides: readonly OverrideTamanho[],
  quantidadeVendida: number,
  pesoGramas: number | null,
  pesoBaseGramas: number | null
): ConsumoInsumo[] {
  const multiplicador =
    pesoGramas != null && pesoBaseGramas != null
      ? multiplicadorPorPeso(pesoGramas, pesoBaseGramas)
      : 1

  const porInsumo = new Map<string, number>()

  for (const linha of ficha) {
    const override = overrides.find((o) => o.fichaTecnicaItemId === linha.id)
    const estoqueItemId = override?.estoqueItemId ?? linha.estoqueItemId
    const quantidadePorUnidade =
      linha.tipoEscala === 'fixo' && override != null
        ? override.quantidade
        : linha.quantidade * multiplicador

    const total = quantidadePorUnidade * quantidadeVendida
    porInsumo.set(estoqueItemId, (porInsumo.get(estoqueItemId) ?? 0) + total)
  }

  return Array.from(porInsumo.entries()).map(([estoqueItemId, quantidade]) => ({
    estoqueItemId,
    quantidade,
  }))
}
