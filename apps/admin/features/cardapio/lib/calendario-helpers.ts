import { somarDiasISO } from '@/lib/dates'

/** Dia da semana como número (0 = domingo) — puro cálculo de calendário, sem fuso. */
export function diaDaSemanaISO(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(Date.UTC(ano!, mes! - 1, dia!)).getUTCDay()
}

/** Segunda-feira da semana que contém `data`. */
export function inicioDaSemanaISO(data: string): string {
  const diaSemana = diaDaSemanaISO(data)
  const voltarPraSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  return somarDiasISO(data, -voltarPraSegunda)
}

export function ultimoDiaDoMesISO(mes: string): string {
  const [ano, mesNum] = mes.split('-').map(Number)
  const ultimoDia = new Date(Date.UTC(ano!, mesNum!, 0)).getUTCDate()
  return `${mes}-${String(ultimoDia).padStart(2, '0')}`
}

/** Todas as semanas (segunda a sábado) que tocam o mês 'YYYY-MM' — pra montar o grid da visualização mensal. */
export function semanasDoMesCompleto(
  mes: string
): { inicio: string; fim: string }[] {
  const ultimoDia = ultimoDiaDoMesISO(mes)
  const semanas: { inicio: string; fim: string }[] = []
  let inicio = inicioDaSemanaISO(`${mes}-01`)
  while (inicio <= ultimoDia) {
    semanas.push({ inicio, fim: somarDiasISO(inicio, 5) })
    inicio = somarDiasISO(inicio, 7)
  }
  return semanas
}

/** Soma (ou subtrai) meses a um 'YYYY-MM', rolando o ano quando necessário. */
export function mesAdjacenteISO(mes: string, delta: number): string {
  const [ano, mesNum] = mes.split('-').map(Number)
  const data = new Date(Date.UTC(ano!, mesNum! - 1 + delta, 1))
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`
}
