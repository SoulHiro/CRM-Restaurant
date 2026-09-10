import { somarDiasISO } from '@/lib/dates'
import { formatDateBR } from '@/lib/formatters'

import type { SemanaOption } from './types'

/** Segunda da semana que contém `dataCalendario`. */
export function inicioDaSemana(dataCalendario: string): string {
  const dia = new Date(`${dataCalendario}T00:00:00Z`)
  const diaSemana = dia.getUTCDay()
  const voltarPraSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  return somarDiasISO(dataCalendario, -voltarPraSegunda)
}

/**
 * Semana atual (segunda a sábado) + as semanas seguintes cuja segunda ainda
 * cai dentro do mês corrente — deixa responder adiantado sem abrir a porta
 * pro mês inteiro seguinte, que ainda nem tem cardápio gerado. A semana
 * atual sempre entra primeiro, mesmo que sua segunda seja do mês anterior
 * (vira da semana que atravessa a virada de mês).
 */
export function semanasDoMes(hoje: string): SemanaOption[] {
  const mesAtual = hoje.slice(0, 7)
  const semanas: SemanaOption[] = []
  let inicio = inicioDaSemana(hoje)
  let indice = 0

  do {
    const fim = somarDiasISO(inicio, 5)
    semanas.push({
      inicio,
      fim,
      label:
        indice === 0
          ? 'Semana atual'
          : `${formatDateBR(inicio).slice(0, 5)} a ${formatDateBR(fim).slice(0, 5)}`,
    })
    indice++
    inicio = somarDiasISO(inicio, 7)
  } while (inicio.slice(0, 7) === mesAtual)

  return semanas
}
