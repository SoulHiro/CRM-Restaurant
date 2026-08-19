/**
 * Nomes de tag centralizados — `queries.ts` marca com essas tags (via
 * `unstable_cache`), `actions.ts` invalida com essas mesmas tags (via
 * `revalidateTag`) depois de escrever. Um lugar só evita a tag bater errado
 * entre leitura e escrita (typo silencioso = cache nunca invalida).
 */
export const TAG_EMPRESAS_LISTA = 'empresas-lista'

export function tagEmpresa(empresaId: string): string {
  return `empresa-${empresaId}`
}

export function tagEmpresaPedidos(empresaId: string): string {
  return `empresa-${empresaId}-pedidos`
}

export function tagEmpresaFechamentos(empresaId: string): string {
  return `empresa-${empresaId}-fechamentos`
}

export function tagEmpresaPrecos(empresaId: string): string {
  return `empresa-${empresaId}-precos`
}

export const TAG_CONFIGURACAO_IMPRESSAO = 'configuracao-impressao'
export const TAG_CONFIGURACAO_PESAGEM = 'configuracao-pesagem'
