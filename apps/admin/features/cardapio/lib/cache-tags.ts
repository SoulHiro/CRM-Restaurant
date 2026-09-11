export const TAG_CARDAPIO_CATALOGO = 'cardapio-catalogo'
export const TAG_CARDAPIO_DIAS = 'cardapio-dias'

export function tagCardapioExtrasEmpresa(empresaId: string): string {
  return `cardapio-extras-${empresaId}`
}
