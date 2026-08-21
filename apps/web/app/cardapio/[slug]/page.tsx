import { notFound } from 'next/navigation'

import { somarDiasISO } from '@/lib/dates'
import { hojeISO } from '@/lib/formatters'
import { CardapioPublico } from '@/features/cardapio/components/cardapio-publico'
import {
  getCardapioSemana,
  getColaboradoresAtivos,
  getEmpresaPorSlug,
} from '@/features/cardapio/lib/queries'

/** Segunda da semana corrente, em 'YYYY-MM-DD'. */
function inicioDaSemana(): string {
  const hoje = new Date(`${hojeISO()}T00:00:00Z`)
  const diaSemana = hoje.getUTCDay()
  const voltarPraSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  return somarDiasISO(hojeISO(), -voltarPraSegunda)
}

export default async function CardapioSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const empresa = await getEmpresaPorSlug(slug)
  if (!empresa) notFound()

  const from = inicioDaSemana()
  const to = somarDiasISO(from, 5) // segunda a sábado

  const [colaboradores, cardapio] = await Promise.all([
    getColaboradoresAtivos(empresa.id),
    getCardapioSemana(empresa.id, from, to),
  ])

  return (
    <CardapioPublico
      empresa={empresa}
      colaboradores={colaboradores}
      cardapio={cardapio}
    />
  )
}
