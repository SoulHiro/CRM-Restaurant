import { horaAtualBrasilia } from '@/lib/formatters'

/**
 * Depois desse horário (fuso do restaurante), o pedido de hoje já foi pra
 * produção — fixo pro restaurante inteiro, sem variação por empresa (não
 * foi pedido, não adianta configuração que ninguém vai usar).
 */
const CORTE_EDICAO_HOJE_HORA = 7

/**
 * Regra única de "dá pra editar esse dia", usada tanto no formulário
 * (`resposta-form.tsx`, pra travar a tela) quanto na action
 * (`enviarRespostaAction`, pra travar de verdade) — um lugar só evita as
 * duas pontas divergirem, como já aconteceu uma vez com hoje/amanhã.
 */
export function diaEditavel(data: string, hoje: string): boolean {
  if (data > hoje) return true
  if (data < hoje) return false
  return horaAtualBrasilia() < CORTE_EDICAO_HOJE_HORA
}
