import type { EmpresaEnvio, EmpresaPausa } from './types'

export function percentChange(
  current: number,
  previous: number | undefined
): number | null {
  if (previous == null || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function getProximaPausa(pausas: EmpresaPausa[]) {
  const hoje = new Date().toISOString().slice(0, 10)
  return pausas
    .filter((pausa) => pausa.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))[0]
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function parseISODate(iso: string): Date {
  const [ano = 1970, mes = 1, dia = 1] = iso.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

function formatISODate(date: Date): string {
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function addDays(date: Date, dias: number): Date {
  const copia = new Date(date)
  copia.setDate(copia.getDate() + dias)
  return copia
}

export interface EnviosHeatmapDia {
  data: string
  total: number
  nivel: 0 | 1 | 2 | 3 | 4
}

export interface EnviosHeatmapSemana {
  dias: EnviosHeatmapDia[]
  mesLabel: string | null
}

export interface EnviosHeatmap {
  semanas: EnviosHeatmapSemana[]
  diasSemanaLabels: string[]
}

export function getEnviosHeatmap(envios: EmpresaEnvio[]): EnviosHeatmap {
  const contagem = new Map<string, number>()
  for (const envio of envios) {
    contagem.set(envio.data, (contagem.get(envio.data) ?? 0) + 1)
  }

  const datas = Array.from(contagem.keys()).sort()
  const ultimaDataIso = datas[datas.length - 1]
  const ultimaData = ultimaDataIso ? parseISODate(ultimaDataIso) : new Date()

  const inicioAno = new Date(ultimaData.getFullYear(), 0, 1)
  const inicio = addDays(inicioAno, -inicioAno.getDay())
  const fimSemana = addDays(ultimaData, 6 - ultimaData.getDay())
  const semanas =
    Math.round(
      (fimSemana.getTime() - inicio.getTime()) / (7 * 24 * 60 * 60 * 1000)
    ) + 1

  const max = Math.max(0, ...contagem.values())

  const nivelDe = (total: number): EnviosHeatmapDia['nivel'] => {
    if (total === 0 || max === 0) return 0
    const proporcao = total / max
    if (proporcao <= 0.25) return 1
    if (proporcao <= 0.5) return 2
    if (proporcao <= 0.75) return 3
    return 4
  }

  let mesAnterior = -1
  const semanasResult: EnviosHeatmapSemana[] = []

  for (let s = 0; s < semanas; s++) {
    const dias: EnviosHeatmapDia[] = []
    let mesLabel: string | null = null

    for (let d = 0; d < 7; d++) {
      const data = addDays(inicio, s * 7 + d)
      const iso = formatISODate(data)
      const total = contagem.get(iso) ?? 0
      dias.push({ data: iso, total, nivel: nivelDe(total) })

      if (data.getMonth() !== mesAnterior) {
        mesLabel = MESES[data.getMonth()] ?? null
        mesAnterior = data.getMonth()
      }
    }

    semanasResult.push({ dias, mesLabel })
  }

  return { semanas: semanasResult, diasSemanaLabels: DIAS_SEMANA }
}
