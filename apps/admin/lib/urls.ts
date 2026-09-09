/**
 * Sugestão de slug a partir do nome da empresa — só um ponto de partida
 * editável, não é aplicado sozinho (ver `atualizarSlugEmpresaAction`, que
 * valida unicidade de verdade contra o banco).
 */
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Primeiro slug livre a partir de uma base — `slugify(nome)` já pode colidir
 * entre duas empresas com nome parecido (ex: duas filiais "Restaurante X").
 * `ocupados` é toda a lista de slugs já usados no banco; tenta a base pura
 * primeiro, senão vai incrementando um sufixo numérico.
 */
export function proximoSlugDisponivel(
  base: string,
  ocupados: Iterable<string>
): string {
  const ocupadosSet = new Set(ocupados)
  if (!ocupadosSet.has(base)) return base

  let contador = 2
  while (ocupadosSet.has(`${base}-${contador}`)) contador++
  return `${base}-${contador}`
}

/**
 * Link público do formulário de pedidos (apps/web, `/cardapio/[slug]`) —
 * outro app do monorepo, por isso a URL completa (com host), não uma rota
 * interna. O fallback pra `localhost:3000` só serve pro dev local sem
 * `NEXT_PUBLIC_WEB_URL` configurada — produção declara a env de verdade
 * (ver turbo.json).
 */
export function urlFormularioPublico(slug: string): string {
  const base = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000'
  return `${base}/cardapio/${slug}`
}
