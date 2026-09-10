const FUSO_RESTAURANTE = 'America/Sao_Paulo'

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_RESTAURANTE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_RESTAURANTE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** Colunas `date` do Postgres chegam assim: dia de calendário, sem hora. */
const DIA_DE_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/

const DIA_SEMANA_LABEL = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function dataISO(instante: Date): string {
  return isoDateFormatter.format(instante)
}

/** Data de hoje no fuso do restaurante, em 'YYYY-MM-DD'. */
export function hojeISO(): string {
  return dataISO(new Date())
}

/** Ver `apps/admin/lib/formatters.ts` — dia de calendário nunca passa por `Date`, senão escorrega um dia perto da virada em Brasília. */
export function formatDateBR(value: string): string {
  const dia = DIA_DE_CALENDARIO.exec(value)
  if (dia) return `${dia[3]}/${dia[2]}/${dia[1]}`
  return dateFormatter.format(new Date(value))
}

export function diaSemanaLabel(dataCalendario: string): string {
  return DIA_SEMANA_LABEL[new Date(`${dataCalendario}T00:00:00Z`).getUTCDay()]!
}

const horaFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO_RESTAURANTE,
  hour: 'numeric',
  hourCycle: 'h23',
})

/** Hora atual (0-23) no fuso do restaurante — não do navegador de quem acessa. */
export function horaAtualBrasilia(): number {
  return Number(horaFormatter.format(new Date()))
}
