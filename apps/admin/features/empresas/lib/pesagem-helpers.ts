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
 * Arredonda pra cima — melhor sobrar comida do que faltar, por instrução
 * explícita. Um `Math.ceil` cru quebraria em resultados que deveriam ser
 * exatos: `39 * 0.1 * 1.2 * 1000` dá `4680.000000000001` em ponto
 * flutuante, não `4680` — sem a folga de epsilon, isso vira `4681` por
 * erro de representação binária, não porque o valor é realmente quebrado.
 */
function arredondarParaCima(valor: number): number {
  return Math.ceil(valor - 1e-9)
}

/**
 * Arroz/feijão em gramas — o "acrescentar dois zeros" que o pessoal da
 * cozinha usa de cabeça é só kg→g (×1000). A fórmula em si (pessoas × fator
 * × 1,2, o "1,2" sendo a folga que só esses dois têm) foi validada contra
 * `CONTROLE DE PESAGEM.xlsx` real: 39 pessoas → 9,36kg de arroz, exatamente
 * `39×0,2×1,2`. Os outros acompanhamentos (legumes, farofa, macarrão) não
 * têm essa folga — é só pessoas × grama-por-pessoa, direto.
 */
export function calcularArrozGramas(pessoas: number): number {
  return arredondarParaCima(pessoas * 0.2 * 1.2 * 1000)
}

export function calcularFeijaoGramas(pessoas: number): number {
  return arredondarParaCima(pessoas * 0.1 * 1.2 * 1000)
}

export function calcularLegumesGramas(pessoas: number): number {
  return arredondarParaCima(pessoas * 100)
}

export function calcularFarofaGramas(pessoas: number): number {
  return arredondarParaCima(pessoas * 80)
}

export function calcularMacarraoGramas(pessoas: number): number {
  return arredondarParaCima(pessoas * 200)
}

/** Não escala com o headcount — sempre a mesma quantidade, dia sim dia não. */
export const SALADA_GRAMAS_FIXO = 2700

export function calcularSobremesaUnidades(pessoas: number): number {
  return pessoas
}

export type ItemPesagemChave =
  | 'arroz'
  | 'feijao'
  | 'legumes'
  | 'farofa'
  | 'macarrao'
  | 'salada'
  | 'sobremesa'

export interface ItemPesagemDefinicao {
  chave: ItemPesagemChave
  label: string
  unidade: 'g' | 'unid'
  calcular: (pessoas: number) => number
}

/**
 * Arroz/feijão saem sempre — todo dia tem os dois. O resto é o cardápio do
 * dia, ligado manualmente na hora de imprimir (nem todo dia tem farofa OU
 * macarrão, por exemplo) — ver `ITENS_PESAGEM_SEMPRE_LIGADOS`.
 */
export const ITENS_PESAGEM: ItemPesagemDefinicao[] = [
  { chave: 'arroz', label: 'Arroz', unidade: 'g', calcular: calcularArrozGramas },
  { chave: 'feijao', label: 'Feijão', unidade: 'g', calcular: calcularFeijaoGramas },
  {
    chave: 'legumes',
    label: 'Legumes',
    unidade: 'g',
    calcular: calcularLegumesGramas,
  },
  { chave: 'farofa', label: 'Farofa', unidade: 'g', calcular: calcularFarofaGramas },
  {
    chave: 'macarrao',
    label: 'Macarrão',
    unidade: 'g',
    calcular: calcularMacarraoGramas,
  },
  { chave: 'salada', label: 'Salada', unidade: 'g', calcular: () => SALADA_GRAMAS_FIXO },
  {
    chave: 'sobremesa',
    label: 'Sobremesa',
    unidade: 'unid',
    calcular: calcularSobremesaUnidades,
  },
]

export const ITENS_PESAGEM_SEMPRE_LIGADOS: ItemPesagemChave[] = ['arroz', 'feijao']

export interface QuantidadeItemPesagem {
  chave: ItemPesagemChave
  /** Legumes muda o nome todo dia (ex: "Legumes (Cenoura/Chuchu)") — os outros ficam com o label padrão. */
  label: string
  valor: number
  unidade: 'g' | 'unid'
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
 * ou pedido sem turno) não entra em nenhum dos grupos.
 *
 * `individualA`/`individualB` existem à parte de `grupoA`/`grupoB` porque
 * cada papel de pesagem lista os dois: o bloco em lote E os pedidos
 * individuais que pertencem àquele mesmo papel (1º turno/administrativo
 * separados no Papel A; 3º turno inteiro + 2º turno separado no Papel B) —
 * ver `PesagemDadosPapel.pedidosIndividuais`. `individual` continua sendo
 * a união dos dois, pra quem só precisa saber "isso é comanda avulsa ou
 * não" (ex: filtrar o que "Imprimir todos" imprime).
 */
export function agruparParaPesagem(
  pedidos: readonly PedidoDoDiaItem[],
  colaboradoresSeparados: ReadonlySet<string>
): {
  individual: PedidoDoDiaItem[]
  individualA: PedidoDoDiaItem[]
  individualB: PedidoDoDiaItem[]
  grupoA: PedidoDoDiaItem[]
  grupoB: PedidoDoDiaItem[]
} {
  const individualA: PedidoDoDiaItem[] = []
  const individualB: PedidoDoDiaItem[] = []
  const grupoA: PedidoDoDiaItem[] = []
  const grupoB: PedidoDoDiaItem[] = []

  for (const pedido of pedidos) {
    const separado = colaboradoresSeparados.has(pedido.colaboradorId)

    if (pedido.turno === '3_turno') {
      individualB.push(pedido)
      continue
    }
    if (separado) {
      if (pedido.turno === '2_turno') individualB.push(pedido)
      else individualA.push(pedido)
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

  return {
    individual: [...individualA, ...individualB],
    individualA,
    individualB,
    grupoA,
    grupoB,
  }
}

/** Só quem não recusou conta como "vai comer" pro headcount do lote. */
function contarPessoas(pedidos: readonly PedidoDoDiaItem[]): number {
  return pedidos.filter((p) => !p.recusou).length
}

export interface ResumoPesagemGrupo {
  totalPessoas: number
  quantidades: QuantidadeItemPesagem[]
  itens: ContagemPrato[]
}

/**
 * `itensExtras` é o que foi marcado na tela de "Imprimir pesagem" pro
 * cardápio daquele dia (legumes/farofa/macarrão/salada/sobremesa) — arroz e
 * feijão entram sempre, mesmo sem estarem na lista. `detalheLegumes`
 * substitui o label padrão de "Legumes" pelo que a cozinha informou (ex:
 * "Legumes (Cenoura/Chuchu)") — sem isso, fica só "Legumes".
 */
export function montarResumoPesagemGrupo(
  pedidos: readonly PedidoDoDiaItem[],
  itensExtras: readonly ItemPesagemChave[] = [],
  detalheLegumes?: string
): ResumoPesagemGrupo {
  const totalPessoas = contarPessoas(pedidos)
  const chavesAtivas = new Set([...ITENS_PESAGEM_SEMPRE_LIGADOS, ...itensExtras])

  const quantidades = ITENS_PESAGEM.filter((item) =>
    chavesAtivas.has(item.chave)
  ).map((item) => ({
    chave: item.chave,
    label:
      item.chave === 'legumes' && detalheLegumes?.trim()
        ? `Legumes (${detalheLegumes.trim()})`
        : item.label,
    valor: item.calcular(totalPessoas),
    unidade: item.unidade,
  }))

  return {
    totalPessoas,
    quantidades,
    itens: contarPorPrato(pedidos.filter((p) => !p.recusou)),
  }
}
