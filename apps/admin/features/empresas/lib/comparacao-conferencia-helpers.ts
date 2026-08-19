import {
  distanciaLevenshtein,
  normalizar,
  serialExcelParaData,
} from './importacao-helpers'
import type { LinhaBruta } from './importacao-helpers'

export type TurnoConferencia = 'almoco' | 'jantar'

export interface LinhaConferencia {
  nome: string
  turno: TurnoConferencia
  confirmado: boolean
}

const LIMIAR_PROXIMIDADE = 0.2

function detectarTurnoNoTexto(texto: string): TurnoConferencia | null {
  const normalizado = normalizar(texto)
  if (normalizado.includes('almoco')) return 'almoco'
  if (normalizado.includes('janta')) return 'jantar'
  return null
}

function ehConfirmado(status: string): boolean | null {
  const normalizado = normalizar(status)
  if (normalizado === 'enviar') return true
  if (normalizado === 'nao enviar') return false
  return null
}

/**
 * A coluna de data (índice 3) chega como `Date` (quando a célula tem
 * formatação de data — caso normal aqui) ou como serial numérico do Excel,
 * dependendo de como a célula foi criada na planilha original. Diferente de
 * um timestamp de servidor, uma célula de planilha é um dia de calendário
 * puro, sem fuso — por isso lê o Y-M-D em UTC direto, sem passar por
 * `dataISO`/fuso de Brasília (isso empurraria meia-noite UTC pro dia
 * anterior, ver docs/rules e `apps/admin/CLAUDE.md`).
 */
function dataDaCelulaISO(valor: LinhaBruta[number]): string | null {
  const data =
    valor instanceof Date
      ? valor
      : typeof valor === 'number'
        ? serialExcelParaData(valor)
        : null

  if (!data || Number.isNaN(data.getTime())) return null
  return data.toISOString().slice(0, 10)
}

/**
 * A GPK manda um arquivo com várias abas (dia a dia, sábado, feriados) — a
 * mesma aba pode até ter mais de um bloco "ALMOÇO"/"JANTA" (feriados
 * costumam ter vários). Um cabeçalho de bloco não é garantia de que aquela
 * lista é do dia sendo conferido: a única fonte confiável da data é a
 * própria linha (coluna D, ao lado do "Enviar"/"NÃO ENVIAR") — por isso cada
 * linha confirmada só entra se a data dela bater com `dataAlvo`, mesmo que o
 * bloco em volta pareça certo pelo nome do cabeçalho.
 */
export function extrairConfirmadosDaPlanilha(
  abas: Record<string, LinhaBruta[]>,
  dataAlvo: string
): LinhaConferencia[] {
  const resultado: LinhaConferencia[] = []
  const vistos = new Set<string>()

  for (const linhas of Object.values(abas)) {
    let turnoAtual: TurnoConferencia | null = null

    for (const linha of linhas) {
      const primeiraCelula = linha[0]
      const segundaCelula = linha[1]

      if (typeof primeiraCelula === 'string' && !segundaCelula) {
        const turnoDetectado = detectarTurnoNoTexto(primeiraCelula)
        if (turnoDetectado) turnoAtual = turnoDetectado
        continue
      }

      if (typeof primeiraCelula !== 'number' || !turnoAtual) continue

      const nome = typeof segundaCelula === 'string' ? segundaCelula.trim() : ''
      if (!nome) continue

      const status = typeof linha[2] === 'string' ? linha[2] : ''
      const confirmado = ehConfirmado(status)
      if (confirmado === null) continue

      if (confirmado && dataDaCelulaISO(linha[3]) !== dataAlvo) continue

      const chave = `${turnoAtual}|${normalizar(nome)}`
      if (vistos.has(chave)) continue
      vistos.add(chave)

      resultado.push({ nome, turno: turnoAtual, confirmado })
    }
  }

  return resultado
}

function correspondeAlgumNome(nome: string, candidatos: string[]): boolean {
  const alvo = normalizar(nome)
  return candidatos.some((candidato) => {
    const nomeCandidato = normalizar(candidato)
    if (nomeCandidato === alvo) return true
    const distancia = distanciaLevenshtein(alvo, nomeCandidato)
    const tamanhoMaximo = Math.max(alvo.length, nomeCandidato.length)
    return tamanhoMaximo > 0 && distancia / tamanhoMaximo <= LIMIAR_PROXIMIDADE
  })
}

export interface PedidoParaComparacao {
  nome: string
  turno: TurnoConferencia | null
  recusou: boolean
}

/**
 * Quem a GPK confirmou ("Enviar") mas não tem pedido nosso no mesmo turno —
 * comparação por nome tolera pequenas diferenças de grafia (a planilha deles
 * às vezes vem com nome levemente diferente do nosso cadastro), mesmo
 * critério de `sugerirCorrespondencia`. Quem recusou o pedido não conta como
 * "pediu" pra esse fim — a pessoa não vai comer de qualquer forma.
 */
export function nomesSemPedido(
  confirmados: LinhaConferencia[],
  pedidos: PedidoParaComparacao[]
): LinhaConferencia[] {
  const pedidosPorTurno = new Map<TurnoConferencia, string[]>()
  for (const pedido of pedidos) {
    if (pedido.recusou || !pedido.turno) continue
    const lista = pedidosPorTurno.get(pedido.turno) ?? []
    lista.push(pedido.nome)
    pedidosPorTurno.set(pedido.turno, lista)
  }

  return confirmados.filter((linha) => {
    if (!linha.confirmado) return false
    const candidatos = pedidosPorTurno.get(linha.turno) ?? []
    return !correspondeAlgumNome(linha.nome, candidatos)
  })
}

const TURNO_LABEL: Record<TurnoConferencia, string> = {
  almoco: 'Almoço',
  jantar: 'Janta',
}

/** Uma lista por turno, pronta pra colar direto numa mensagem. */
export function formatarListaParaCopiar(faltantes: LinhaConferencia[]): string {
  const porTurno = new Map<TurnoConferencia, string[]>()
  for (const linha of faltantes) {
    const lista = porTurno.get(linha.turno) ?? []
    lista.push(linha.nome)
    porTurno.set(linha.turno, lista)
  }

  const blocos: string[] = []
  for (const turno of ['almoco', 'jantar'] as const) {
    const nomes = porTurno.get(turno)
    if (!nomes || nomes.length === 0) continue
    blocos.push(
      [`${TURNO_LABEL[turno]} (${nomes.length}):`, ...nomes.map((n) => `- ${n}`)].join(
        '\n'
      )
    )
  }

  return blocos.join('\n\n')
}
