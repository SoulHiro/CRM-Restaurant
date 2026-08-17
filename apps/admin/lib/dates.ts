/**
 * Aritmética de dia de calendário 'YYYY-MM-DD', sem passar por fuso —
 * `new Date(iso)` seria meia-noite UTC e escorregaria um dia em Brasília.
 */
export function somarDiasISO(data: string, dias: number): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  if (!ano || !mes || !dia) return data
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10)
}
