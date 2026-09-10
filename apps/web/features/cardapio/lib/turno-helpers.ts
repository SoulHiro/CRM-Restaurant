import type { EmpresaFluxoPedido, TurnoRefeicao } from './types'

export const TURNO_LABEL: Record<TurnoRefeicao, string> = {
  almoco: 'Almoço',
  jantar: 'Jantar',
  '1_turno': '1º Turno',
  '2_turno': '2º Turno',
  '3_turno': '3º Turno',
  administrativo: 'Administrativo',
}

/**
 * Não existe configuração própria de "quais turnos essa empresa usa" — o
 * vocabulário já é 1:1 com `fluxoPedido` (ver `pedidos-importados.ts` no
 * schema): fluxo `pesagem` (hoje só NOVAPRINT2) usa 1º/2º/3º turno +
 * administrativo; todo o resto usa almoço/jantar.
 */
export function turnosDisponiveis(
  fluxoPedido: EmpresaFluxoPedido
): TurnoRefeicao[] {
  return fluxoPedido === 'pesagem'
    ? ['1_turno', '2_turno', '3_turno', 'administrativo']
    : ['almoco', 'jantar']
}
