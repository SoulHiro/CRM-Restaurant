import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'

import { ContagemTabela } from '@/features/estoque/components/inventario/contagem-tabela'
import { FinalizarInventarioButton } from '@/features/estoque/components/inventario/finalizar-inventario-button'
import { InventarioResumoCard } from '@/features/estoque/components/inventario/inventario-resumo-card'
import { resumirContagem } from '@/features/estoque/lib/inventario-helpers'
import { getInventarioDetalhe } from '@/features/estoque/lib/queries'
import { formatDateBR } from '@/lib/formatters'

export default async function InventarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detalhe = await getInventarioDetalhe(id)

  if (!detalhe) {
    notFound()
  }

  const { resumo, linhas } = detalhe
  const contagem = resumirContagem(linhas)
  const emAndamento = resumo.status === 'em_andamento'

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/estoque/inventario">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              Contagem de {formatDateBR(resumo.data)}
            </h1>
            <Badge variant={emAndamento ? 'default' : 'secondary'}>
              {emAndamento ? 'Em andamento' : 'Finalizada'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {emAndamento
              ? 'Vá preenchendo o que contou — cada campo salva sozinho, dá para sair e voltar.'
              : `Finalizada em ${resumo.finalizadoEm ? formatDateBR(resumo.finalizadoEm) : '—'}. Os saldos já foram corrigidos.`}
          </p>
          <p className="text-sm text-muted-foreground">
            Responsável: {resumo.responsavel}
            {resumo.observacao ? ` · ${resumo.observacao}` : ''}
          </p>
        </div>

        {emAndamento && (
          <FinalizarInventarioButton
            inventarioId={resumo.id}
            linhasDivergentes={contagem.linhasDivergentes}
            linhasPendentes={contagem.linhasPendentes}
          />
        )}
      </div>

      <InventarioResumoCard resumo={resumo} linhas={linhas} />

      <ContagemTabela
        linhas={linhas}
        inventarioId={resumo.id}
        editavel={emAndamento}
      />
    </div>
  )
}
