'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Eye, Loader2 } from 'lucide-react'
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
import { obterConfiguracaoLayoutResumoAction } from '@/features/configuracoes/lib/actions'
import { CAMPOS_RESUMO_PADRAO } from '@/features/configuracoes/lib/types'
import {
  listarFechamentosAction,
  obterFechamentoDoDiaAction,
} from '../../../../lib/actions'
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
  resumoMostraQuantidades,
}: {
  empresaId: string
  empresaNome: string
  resumoMostraQuantidades: boolean
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

  const { executeAsync: buscarLayout } = useAction(
    obterConfiguracaoLayoutResumoAction
  )
  const { executeAsync: buscarFechamentoCompleto } = useAction(
    obterFechamentoDoDiaAction
  )

  /**
   * Preview de verdade — gera o mesmo PDF que sai na impressora
   * (`ResumoDiaPDF`) e mostra num `<iframe>`, não uma aproximação em HTML.
   * O único jeito de garantir que o preview é exatamente o que vai pro
   * papel. Busca o fechamento de novo, com os itens — a lista usada pela
   * tela (`listarFechamentosDaEmpresa`) não traz itens de propósito (não
   * precisa disso pra listar 60 linhas), então `fechamento.itens` aqui
   * sempre viria vazio, o que zerava P/M/G e o total no preview.
   */
  async function abrirPreview(fechamento: FechamentoDia) {
    setGerandoPreview(fechamento.data)
    try {
      const [{ pdf }, { ResumoDiaPDF }, resultadoLayout, resultadoFechamento] =
        await Promise.all([
          import('@react-pdf/renderer'),
          import('../../../../lib/resumo-dia-pdf'),
          buscarLayout({}),
          buscarFechamentoCompleto({ empresaId, data: fechamento.data }),
        ])

      const fechamentoCompleto = resultadoFechamento?.data?.fechamento
      if (!fechamentoCompleto) {
        toast.error('Não foi possível carregar os itens desse fechamento')
        return
      }

      const itens: ItemResumoDia[] = fechamentoCompleto.itens.map(
        (item: ItemFechamento) => ({
          colaboradorNome: item.colaboradorNome,
          tipo: item.tipo,
          prato: item.prato,
          tamanho: item.tamanho,
          preco: item.preco,
        })
      )

      const dados: ResumoDiaDados = {
        camposCabecalho: resultadoLayout?.data?.campos ?? CAMPOS_RESUMO_PADRAO,
        mostrarQuantidades: resumoMostraQuantidades,
        empresaClienteNome: empresaNome,
        impressoEm: fechamentoCompleto.finalizadoEm,
        itens,
        quantidadeCafe: fechamentoCompleto.quantidadeCafe,
        precoUnitarioCafe: fechamentoCompleto.precoUnitarioCafe,
        quantidadeSuco: fechamentoCompleto.quantidadeSuco,
        precoUnitarioSuco: fechamentoCompleto.precoUnitarioSuco,
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card p-4 text-sm"
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
                variant="ghost"
                size="icon"
                aria-label={`Preview do fechamento de ${formatDateBR(f.data)}`}
                disabled={gerandoPreview === f.data}
                onClick={() => abrirPreview(f)}
              >
                {gerandoPreview === f.data ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Eye className="size-4" />
                )}
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
