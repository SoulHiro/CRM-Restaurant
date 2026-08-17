'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { DrawerFooter } from '@repo/ui/components/drawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Skeleton } from '@repo/ui/components/skeleton'

import {
  deduparPorCarimbo,
  linhasParaDias,
  sugerirCorrespondencia,
} from '../../../../../lib/importacao-helpers'
import { listarColaboradoresAction } from '../../../../../lib/actions'
import type {
  ColaboradorExistenteOption,
  MapeamentoColunas,
  PessoaRevisao,
  PlanilhaLida,
} from './importar-planilha-types'

const NOVO = '__novo__'

export function PassoRevisar({
  empresaId,
  planilha,
  mapeamento,
  semanasSelecionadas,
  onConfirmar,
  onVoltar,
}: {
  empresaId: string
  planilha: PlanilhaLida
  mapeamento: MapeamentoColunas
  semanasSelecionadas: Set<string>
  onConfirmar: (pessoas: PessoaRevisao[]) => void
  onVoltar: () => void
}) {
  const [existentes, setExistentes] = useState<
    ColaboradorExistenteOption[] | null
  >(null)

  const { execute } = useAction(listarColaboradoresAction, {
    onSuccess: ({ data }) => setExistentes(data?.colaboradores ?? []),
    onError: () => {
      toast.error('Não foi possível carregar os colaboradores existentes.')
      setExistentes([])
    },
  })

  useEffect(() => {
    execute({ empresaId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const pessoasBase = useMemo(() => {
    if (!existentes) return []

    const linhasFiltradas = planilha.linhas.filter((linha) => {
      if (mapeamento.colSemana == null) return false
      const texto = String(linha[mapeamento.colSemana] ?? '').trim()
      return semanasSelecionadas.has(texto)
    })

    const dias = deduparPorCarimbo(
      linhasParaDias(linhasFiltradas, mapeamento)
    )

    const porNome = new Map<string, PessoaRevisao>()
    for (const dia of dias) {
      let pessoa = porNome.get(dia.nome)
      if (!pessoa) {
        const sugestao = sugerirCorrespondencia(dia.nome, existentes)
        pessoa = {
          nome: dia.nome,
          whatsapp: dia.whatsapp,
          colaboradorId: sugestao?.tipo === 'exata' ? sugestao.colaboradorId : null,
          sugestao,
          dias: [],
        }
        porNome.set(dia.nome, pessoa)
      }
      pessoa.dias.push(dia)
    }

    return Array.from(porNome.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR')
    )
  }, [existentes, planilha.linhas, mapeamento, semanasSelecionadas])

  const [pessoas, setPessoas] = useState<PessoaRevisao[] | null>(null)

  useEffect(() => {
    if (existentes) setPessoas(pessoasBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existentes])

  if (!existentes || !pessoas) {
    return (
      <div className="flex flex-1 flex-col gap-3 px-4 py-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  function setColaboradorId(nome: string, colaboradorId: string | null) {
    setPessoas((atual) =>
      (atual ?? []).map((pessoa) =>
        pessoa.nome === nome ? { ...pessoa, colaboradorId } : pessoa
      )
    )
  }

  const totalDias = pessoas.reduce((soma, p) => soma + p.dias.length, 0)

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
        <p className="text-sm text-muted-foreground">
          {pessoas.length} pessoa{pessoas.length === 1 ? '' : 's'} ·{' '}
          {totalDias} pedido{totalDias === 1 ? '' : 's'} de dia. Confira o
          vínculo de cada uma antes de confirmar.
        </p>

        <div className="flex flex-col gap-2">
          {pessoas.map((pessoa) => (
            <div
              key={pessoa.nome}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">{pessoa.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {pessoa.dias.length} dia{pessoa.dias.length === 1 ? '' : 's'}
                  {pessoa.sugestao && !pessoa.colaboradorId
                    ? ` · parecido com "${pessoa.sugestao.nome}"`
                    : ''}
                </span>
              </div>

              <Select
                value={pessoa.colaboradorId ?? NOVO}
                onValueChange={(v) =>
                  setColaboradorId(pessoa.nome, v === NOVO ? null : v)
                }
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NOVO}>Criar colaborador novo</SelectItem>
                  {existentes.map((colaborador) => (
                    <SelectItem key={colaborador.id} value={colaborador.id}>
                      Vincular a {colaborador.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <DrawerFooter className="flex-row justify-end gap-2 border-t">
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
        <Button
          disabled={pessoas.length === 0}
          onClick={() => onConfirmar(pessoas)}
        >
          Continuar
        </Button>
      </DrawerFooter>
    </>
  )
}
