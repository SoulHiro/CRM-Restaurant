'use client'

import { useAction } from 'next-safe-action/hooks'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { DrawerFooter } from '@repo/ui/components/drawer'

import { importarPedidosAction } from '../../../../../lib/actions'
import type {
  PessoaRevisao,
  ResultadoImportacao,
} from './importar-planilha-types'

export function PassoConfirmar({
  empresaId,
  arquivoNome,
  pessoas,
  resultado,
  onImportado,
  onVoltar,
  onFechar,
}: {
  empresaId: string
  arquivoNome: string
  pessoas: PessoaRevisao[]
  resultado: ResultadoImportacao | null
  onImportado: (resultado: ResultadoImportacao) => void
  onVoltar: () => void
  onFechar: () => void
}) {
  const { execute, isExecuting } = useAction(importarPedidosAction, {
    onSuccess: ({ data }) => {
      if (data) onImportado(data)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível importar a planilha.')
    },
  })

  const totalDias = pessoas.reduce((soma, p) => soma + p.dias.length, 0)
  const novos = pessoas.filter((p) => !p.colaboradorId).length

  function confirmar() {
    execute({
      empresaId,
      arquivoOrigem: arquivoNome,
      itens: pessoas.flatMap((pessoa) =>
        pessoa.dias.map((dia) => ({
          nome: pessoa.nome,
          colaboradorId: pessoa.colaboradorId,
          whatsapp: pessoa.whatsapp,
          data: dia.data,
          tipo: 'marmita' as const,
          turno: dia.turno,
          tamanho: dia.tamanho,
          prato: dia.prato,
          preco: null,
          observacao: dia.observacao,
          respondidoEm: dia.carimbo?.toISOString() ?? null,
        }))
      ),
    })
  }

  if (resultado) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
        <CheckCircle2 className="size-10 text-sidebar" />
        <p className="font-medium">Importação concluída</p>
        <p className="text-sm text-muted-foreground">
          {resultado.colaboradoresNovos} colaborador
          {resultado.colaboradoresNovos === 1 ? '' : 'es'} novo
          {resultado.colaboradoresNovos === 1 ? '' : 's'} ·{' '}
          {resultado.diasImportados} pedido
          {resultado.diasImportados === 1 ? '' : 's'} de dia importado
          {resultado.diasImportados === 1 ? '' : 's'}
        </p>
        <Button onClick={onFechar}>Fechar</Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-3 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          Confira antes de importar:
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          <li>
            <strong>{pessoas.length}</strong> pessoa
            {pessoas.length === 1 ? '' : 's'}, sendo{' '}
            <strong>{novos}</strong> nova{novos === 1 ? '' : 's'}
          </li>
          <li>
            <strong>{totalDias}</strong> pedido{totalDias === 1 ? '' : 's'} de
            dia
          </li>
          <li>
            Reimportar um dia já importado atualiza o pedido, não duplica.
          </li>
        </ul>
      </div>

      <DrawerFooter className="flex-row justify-end gap-2 border-t">
        <Button variant="outline" onClick={onVoltar} disabled={isExecuting}>
          Voltar
        </Button>
        <Button onClick={confirmar} disabled={isExecuting}>
          {isExecuting ? 'Importando...' : 'Confirmar importação'}
        </Button>
      </DrawerFooter>
    </>
  )
}
