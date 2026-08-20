import type { Role } from '@repo/auth'

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  caixa: 'Caixa',
  financeiro: 'Financeiro',
  cozinha: 'Cozinha',
  garcom: 'Garçom',
  empresa: 'Empresa',
  funcionario: 'Funcionário',
  cliente: 'Cliente',
  estoquista: 'Estoquista',
  tesoureiro: 'Tesoureiro',
  entregador: 'Entregador',
  gestor_compras: 'Gestor de compras',
}

/**
 * Cargos de equipe interna — os únicos atribuíveis por aqui. `empresa`/
 * `funcionario`/`cliente` existem no enum de `Role` pra outro contexto (login
 * de empresa-cliente/funcionário, ainda não construído) e não aparecem nessa
 * tela.
 */
export const CARGOS_INTERNOS: Role[] = [
  'admin',
  'caixa',
  'financeiro',
  'cozinha',
  'garcom',
  'estoquista',
  'tesoureiro',
  'entregador',
  'gestor_compras',
]
