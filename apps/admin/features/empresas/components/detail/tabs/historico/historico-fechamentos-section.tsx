'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Eye } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Skeleton } from '@repo/ui/components/skeleton'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import {
  obterConfiguracaoLayoutResumoAction,
  obterConfiguracaoResumoDiaAction,
} from '@/features/configuracoes/lib/actions'
import { CAMPOS_RESUMO_PADRAO } from '@/features/configuracoes/lib/types'
import { listarFechamentosAction } from '../../../../lib/actions'
import type { FechamentoDia, ItemFechamento } from '../../../../lib/types'
import type {
  ItemResumoDia,
  ResumoDiaDados,
} from '../../../../lib/resumo-dia-pdf'
import {
  DateRangeFilter,
  type DateRangeValue,
} from '../../../shared/date-range-filter'

export function HistoricoFechamentosSection({
  empresaId,
  empresaNome,
}: {
  empresaId: string
  empresaNome: string
}) {
  const [fechamentos, setFechamentos] = useState<FechamentoDia[] | null>(null)
  const [intervalo, setIntervalo] = useState<DateRangeValue>({
    from: null,
    to: null,
  })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewAberto, setPreviewAberto] = useState(false)
  const [gerandoPreview, setGerandoPreview] = useState<string | null>(null)

  const { execute } = useAction(listarFechamentosAction, {
    onSuccess: ({ data }) => setFechamentos(data?.fechamentos ?? []),
    onError: () => toast.error('Não foi possível carregar o histórico'),
  })

  useEffect(() => {
    execute({ empresaId, from: intervalo.from, to: intervalo.to })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, intervalo.from, intervalo.to])

  const { executeAsync: buscarConfig } = useAction(
    obterConfiguracaoResumoDiaAction
  )
  const { executeAsync: buscarLayout } = useAction(
    obterConfiguracaoLayoutResumoAction
  )

  /**
   * Preview de verdade — gera o mesmo PDF que sai na impressora
   * (`ResumoDiaPDF`) e mostra num `<iframe>`, não uma aproximação em HTML.
   * O único jeito de garantir que o preview é exatamente o que vai pro
   * papel.
   */
  async function abrirPreview(fechamento: FechamentoDia) {
    setGerandoPreview(fechamento.data)
    try {
      const [{ pdf }, { ResumoDiaPDF }, resultadoConfig, resultadoLayout] =
        await Promise.all([
          import('@react-pdf/renderer'),
          import('../../../../lib/resumo-dia-pdf'),
          buscarConfig({}),
          buscarLayout({}),
        ])

      const config = resultadoConfig?.data
      const itens: ItemResumoDia[] = fechamento.itens.map(
        (item: ItemFechamento) => ({
          colaboradorNome: item.colaboradorNome,
          tipo: item.tipo,
          prato: item.prato,
          tamanho: item.tamanho,
          preco: item.preco,
        })
      )

      const dados: ResumoDiaDados = {
        nomeEstabelecimento: config?.nomeEstabelecimento || 'Nosso Quintal',
        endereco: config?.endereco ?? '',
        cnpj: config?.cnpj ?? '',
        inscricaoEstadual: config?.inscricaoEstadual ?? '',
        camposCabecalho: resultadoLayout?.data?.campos ?? CAMPOS_RESUMO_PADRAO,
        empresaClienteNome: empresaNome,
        impressoEm: fechamento.finalizadoEm,
        itens,
        quantidadeCafe: fechamento.quantidadeCafe,
        precoUnitarioCafe: fechamento.precoUnitarioCafe,
        quantidadeSuco: fechamento.quantidadeSuco,
        precoUnitarioSuco: fechamento.precoUnitarioSuco,
      }

      const blob = await pdf(<ResumoDiaPDF dados={dados} />).toBlob()
      setPreviewUrl(URL.createObjectURL(blob))
      setPreviewAberto(true)
    } catch {
      toast.error('Não foi possível gerar o preview')
    } finally {
      setGerandoPreview(null)
    }
  }

  return (
    <Card className="border-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Histórico de fechamentos</CardTitle>
        <DateRangeFilter value={intervalo} onChange={setIntervalo} />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!fechamentos ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : fechamentos.length === 0 ? (
          <EmptyState message="Nenhum dia finalizado ainda." />
        ) : (
          fechamentos.map((f) => (
            <div
              key={f.data}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium">{formatDateBR(f.data)}</span>
                <span className="text-xs text-muted-foreground">
                  {empresaNome}
                </span>
              </div>
              <span className="text-muted-foreground">
                P {f.quantidadeP} · M {f.quantidadeM} · G {f.quantidadeG}
                {' · '}
                Lanche {f.quantidadeLanche} · Café {f.quantidadeCafe} · Suco{' '}
                {f.quantidadeSuco}
              </span>
              <span className="font-medium">
                {formatCurrencyBRL(f.valorTotal)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={gerandoPreview === f.data}
                onClick={() => abrirPreview(f)}
              >
                <Eye className="size-4" />
                {gerandoPreview === f.data ? 'Gerando...' : 'Preview'}
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <Dialog
        open={previewAberto}
        onOpenChange={(open) => {
          setPreviewAberto(open)
          if (!open && previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview do fechamento</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              title="Preview do fechamento"
              className="h-[75vh] w-full rounded-md border"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
