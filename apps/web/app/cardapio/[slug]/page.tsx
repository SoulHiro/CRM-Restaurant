import { notFound } from 'next/navigation'

import { hojeISO } from '@/lib/formatters'
import { CardapioPublico } from '@/features/cardapio/components/cardapio-publico'
import { mesclarExtras } from '@/features/cardapio/lib/cardapio-helpers'
import { semanasDoMes } from '@/features/cardapio/lib/semana-helpers'
import {
  getCardapioSemana,
  getColaboradoresAtivos,
  getEmpresaPorSlug,
  getExtrasEmpresa,
} from '@/features/cardapio/lib/queries'

export default async function CardapioSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const empresa = await getEmpresaPorSlug(slug)
  if (!empresa) notFound()

  const semanas = semanasDoMes(hojeISO())
  const semanaAtual = semanas[0]!

  const [colaboradores, cardapioCompleto, extras] = await Promise.all([
    getColaboradoresAtivos(empresa.id),
    getCardapioSemana(semanaAtual.inicio, semanaAtual.fim),
    getExtrasEmpresa(empresa.id, semanaAtual.inicio, semanaAtual.fim),
  ])

  // O cardápio é gerado uma vez só pro restaurante inteiro — cada empresa
  // só enxerga as N primeiras alternativas dela, mais os extras exclusivos
  // dela por cima (não contam nesse corte).
  const cardapioCortado = cardapioCompleto.map((dia) => ({
    ...dia,
    alternativas: dia.alternativas.slice(0, empresa.cardapioQtdAlternativas),
  }))
  const cardapio = mesclarExtras(cardapioCortado, extras)

  return (
    <CardapioPublico
      empresa={empresa}
      colaboradores={colaboradores}
      cardapioInicial={cardapio}
      semanas={semanas}
    />
  )
}
