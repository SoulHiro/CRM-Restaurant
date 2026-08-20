import { somarDiasISO } from '@/lib/dates'
import type { TurnoRefeicao } from './types'

export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta'

export const DIAS_UTEIS: DiaSemana[] = [
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
]

export const DIA_SEMANA_LABEL: Record<DiaSemana, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
}

/** Uma linha crua da planilha — célula por índice de coluna, como o Excel dá. */
export type LinhaBruta = (string | number | Date | null | undefined)[]

export interface DiaColuna {
  dia: DiaSemana
  colPrato: number | null
  colObs: number | null
}

export interface MapeamentoColunas {
  colCarimbo: number | null
  colSemana: number | null
  colNome: number | null
  colTurno: number | null
  colTamanho: number | null
  colWhatsapp: number | null
  dias: DiaColuna[]
}

export interface PedidoDiaBruto {
  /** Carimbo de data/hora original da resposta — dedup e `respondido_em`. */
  carimbo: Date | null
  nome: string
  semanaTexto: string
  data: string
  turno: TurnoRefeicao | null
  tamanho: 'P' | 'M' | 'G' | null
  prato: string | null
  observacao: string | null
  whatsapp: string | null
}

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function textoDaCelula(valor: LinhaBruta[number]): string {
  if (valor == null) return ''
  if (valor instanceof Date) return valor.toISOString()
  return String(valor).trim()
}

/**
 * Excel/Sheets guarda data como número serial (dias desde 30/12/1899, o
 * "dia 0" que compensa o bug histórico do ano bissexto de 1900). Só entra em
 * jogo quando a planilha não tiver a coluna formatada como data — o caminho
 * normal já chega como `Date` via `cellDates: true` no parse do xlsx.
 */
function serialExcelParaData(serial: number): Date {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000)
}

function lerCarimbo(valor: LinhaBruta[number]): Date | null {
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor
  if (typeof valor === 'number') return serialExcelParaData(valor)
  if (typeof valor === 'string' && valor.trim() !== '') {
    const data = new Date(valor)
    return Number.isNaN(data.getTime()) ? null : data
  }
  return null
}

/**
 * Lê "10/08/2026 a 14/08/2026" (ou variantes com Á/á, espaçamento irregular)
 * e devolve o primeiro dia da semana em ISO. É o único campo confiável para
 * a data real da linha — o cabeçalho das colunas de dia mostra só a semana
 * atualmente aberta no formulário, não a da linha.
 */
export function parseSemanaCardapio(texto: string): { inicio: string } | null {
  const normalizado = normalizar(texto)
  const match =
    /^(\d{2})\/(\d{2})\/(\d{4})\s*a\s*(\d{2})\/(\d{2})\/(\d{4})$/.exec(
      normalizado
    )
  if (!match) return null

  const [, dia, mes, ano] = match
  return { inicio: `${ano}-${mes}-${dia}` }
}

/**
 * Casa colunas por conteúdo do cabeçalho, não por texto exato — é o que
 * absorve a variação de formato entre planilhas de empresas diferentes. A
 * ordem das colunas de dia não importa; o nome de cada uma, sim.
 */
export function detectarColunas(cabecalho: LinhaBruta): MapeamentoColunas {
  const normalizados = cabecalho.map((c) => normalizar(textoDaCelula(c)))

  function primeiraColuna(regex: RegExp): number | null {
    const indice = normalizados.findIndex((texto) => regex.test(texto))
    return indice === -1 ? null : indice
  }

  const dias: DiaColuna[] = DIAS_UTEIS.map((dia) => {
    const nomeDia = dia === 'terca' ? 'terca' : dia // já normalizado (sem cedilha)
    const colPrato = primeiraColuna(new RegExp(`${nomeDia}(?!.*observ)`, 'i'))
    const colObs = primeiraColuna(new RegExp(`observ.*${nomeDia}`, 'i'))
    return { dia, colPrato, colObs }
  })

  return {
    colCarimbo: primeiraColuna(/carimbo/),
    colSemana: primeiraColuna(/semana/),
    colNome: primeiraColuna(/nome/),
    colTurno: primeiraColuna(/hor[ae]rio|turno/),
    colTamanho: primeiraColuna(/tamanho/),
    colWhatsapp: primeiraColuna(/whats?app|telefone/),
    dias,
  }
}

/**
 * `1 turno`/`2 turno`/`3 turno`/`administrativo` são o vocabulário de
 * empresas com `fluxo_pedido = 'pesagem'` (hoje só a NOVAPRINT2) — checados
 * antes de `almoco`/`jantar` só por organização, os padrões não colidem.
 */
function lerTurno(texto: string): TurnoRefeicao | null {
  const normalizado = normalizar(texto)
  // "1° turno"/"1º turno"/"1turno" — º/° são símbolo, não marca diacrítica,
  // `normalizar()` não remove: o número pode vir colado a qualquer um dos
  // dois (ou a nenhum) antes de "turno".
  if (/1\s*[°º]?\s*turno/.test(normalizado)) return '1_turno'
  if (/2\s*[°º]?\s*turno/.test(normalizado)) return '2_turno'
  if (/3\s*[°º]?\s*turno/.test(normalizado)) return '3_turno'
  if (normalizado.includes('administrativo')) return 'administrativo'
  if (normalizado.includes('almoco')) return 'almoco'
  if (normalizado.includes('jantar')) return 'jantar'
  return null
}

/**
 * Férias/afastado: a pessoa não come naquele dia — a linha inteira é
 * descartada na importação (`linhasParaDias`), nunca vira `PedidoDiaBruto`.
 */
export function ehTurnoExcluido(texto: string): boolean {
  const normalizado = normalizar(texto)
  return normalizado.includes('ferias') || normalizado.includes('afastado')
}

function lerTamanho(texto: string): 'P' | 'M' | 'G' | null {
  const match = /\b([pmg])\b/i.exec(normalizar(texto))
  if (!match) return null
  return match[1]!.toUpperCase() as 'P' | 'M' | 'G'
}

/**
 * Cada linha (uma submissão semanal de uma pessoa) vira até 5 linhas — uma
 * por dia com prato preenchido. Dia com célula vazia não gera linha: não tem
 * o que imprimir, e "vazio" é diferente de "recusou" (ver `ehRecusa`).
 */
export function linhasParaDias(
  linhas: readonly LinhaBruta[],
  mapeamento: MapeamentoColunas
): PedidoDiaBruto[] {
  const resultado: PedidoDiaBruto[] = []

  for (const linha of linhas) {
    const nome = textoDaCelula(
      mapeamento.colNome == null ? null : linha[mapeamento.colNome]
    )
    if (!nome) continue

    const semanaTexto = textoDaCelula(
      mapeamento.colSemana == null ? null : linha[mapeamento.colSemana]
    )
    const semana = parseSemanaCardapio(semanaTexto)
    if (!semana) continue

    const carimbo = lerCarimbo(
      mapeamento.colCarimbo == null ? null : linha[mapeamento.colCarimbo]
    )

    const turnoTexto = textoDaCelula(
      mapeamento.colTurno == null ? null : linha[mapeamento.colTurno]
    )
    if (ehTurnoExcluido(turnoTexto)) continue

    const turno = lerTurno(turnoTexto)
    const tamanho = lerTamanho(
      textoDaCelula(
        mapeamento.colTamanho == null ? null : linha[mapeamento.colTamanho]
      )
    )
    const whatsapp =
      mapeamento.colWhatsapp == null
        ? null
        : textoDaCelula(linha[mapeamento.colWhatsapp]) || null

    mapeamento.dias.forEach((diaColuna, indice) => {
      const prato = textoDaCelula(
        diaColuna.colPrato == null ? null : linha[diaColuna.colPrato]
      )
      if (!prato) return

      const observacao = textoDaCelula(
        diaColuna.colObs == null ? null : linha[diaColuna.colObs]
      )

      resultado.push({
        carimbo,
        nome,
        semanaTexto,
        data: somarDiasISO(semana.inicio, indice),
        turno,
        tamanho,
        prato,
        observacao: observacao || null,
        whatsapp,
      })
    })
  }

  return resultado
}

/**
 * Entre duas linhas da mesma pessoa no mesmo dia (reenvio da semana), fica a
 * de carimbo mais recente. Sem carimbo, a última do arquivo vence — a ordem
 * de exportação do Google Forms já é cronológica.
 */
export function deduparPorCarimbo(
  linhas: readonly PedidoDiaBruto[]
): PedidoDiaBruto[] {
  const porChave = new Map<string, PedidoDiaBruto>()

  linhas.forEach((linha, indice) => {
    const chave = `${linha.nome}__${linha.data}`
    const atual = porChave.get(chave)
    if (!atual) {
      porChave.set(chave, linha)
      return
    }

    const carimboAtual = atual.carimbo?.getTime() ?? -Infinity
    const carimboNovo = linha.carimbo?.getTime() ?? -Infinity
    // Empate de carimbo (ou os dois sem carimbo): a posterior no arquivo
    // vence, por isso `>=` e não `>`.
    if (carimboNovo >= carimboAtual) {
      porChave.set(chave, linha)
    }
    void indice
  })

  return [...porChave.values()]
}

const PADROES_RECUSA = [
  /nao\s+vou/,
  /nao\s+vai/,
  /nao\s+almo[cç]ar/,
  /nao\s+jantar/,
]

/** Reconhece "***NÃO VOU ALMOÇAR***" e variantes — não é "vazio", é resposta. */
export function ehRecusa(texto: string | null): boolean {
  if (!texto) return false
  const normalizado = normalizar(texto)
  return PADROES_RECUSA.some((padrao) => padrao.test(normalizado))
}

export interface ColaboradorExistente {
  id: string
  nome: string
}

export type SugestaoTipo = 'exata' | 'proxima'

export interface SugestaoCorrespondencia {
  colaboradorId: string
  nome: string
  tipo: SugestaoTipo
}

function distanciaLevenshtein(a: string, b: string): number {
  const linhas = a.length + 1
  const colunas = b.length + 1
  const matriz: number[][] = Array.from({ length: linhas }, (_, i) => [
    i,
    ...Array<number>(colunas - 1).fill(0),
  ])
  for (let j = 1; j < colunas; j++) matriz[0]![j] = j

  for (let i = 1; i < linhas; i++) {
    for (let j = 1; j < colunas; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1
      matriz[i]![j] = Math.min(
        matriz[i - 1]![j]! + 1,
        matriz[i]![j - 1]! + 1,
        matriz[i - 1]![j - 1]! + custo
      )
    }
  }

  return matriz[linhas - 1]![colunas - 1]!
}

/**
 * Só sugere — nunca aplica sozinho. Nome igual após normalizar (caixa,
 * acento, espaço) é "exata"; senão, distância de edição pequena em relação
 * ao tamanho do nome é "proxima". O resto fica sem sugestão, para a tela de
 * revisão tratar como pessoa nova.
 */
export function sugerirCorrespondencia(
  nomeNovo: string,
  colaboradoresExistentes: readonly ColaboradorExistente[]
): SugestaoCorrespondencia | null {
  const alvo = normalizar(nomeNovo)
  if (!alvo) return null

  let melhor: { colaborador: ColaboradorExistente; distancia: number } | null =
    null

  for (const colaborador of colaboradoresExistentes) {
    const nomeExistente = normalizar(colaborador.nome)
    if (nomeExistente === alvo) {
      return {
        colaboradorId: colaborador.id,
        nome: colaborador.nome,
        tipo: 'exata',
      }
    }

    const distancia = distanciaLevenshtein(alvo, nomeExistente)
    if (!melhor || distancia < melhor.distancia) {
      melhor = { colaborador, distancia }
    }
  }

  if (!melhor) return null

  const tamanhoMaximo = Math.max(alvo.length, melhor.colaborador.nome.length)
  const proximo = tamanhoMaximo > 0 && melhor.distancia / tamanhoMaximo <= 0.2

  return proximo
    ? {
        colaboradorId: melhor.colaborador.id,
        nome: melhor.colaborador.nome,
        tipo: 'proxima',
      }
    : null
}
