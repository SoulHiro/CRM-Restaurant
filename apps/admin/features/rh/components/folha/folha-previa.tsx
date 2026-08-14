'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@repo/ui/lib/utils'

import { useQueryParams } from '@/hooks/use-query-params'
import { formatCurrencyBRL } from '@/lib/formatters'
import { fecharFolhaAction } from '../../lib/actions'
import { DIAS_DA_SEMANA } from '../../lib/ausencia-helpers'
import { rotuloCompetencia, totalFolha } from '../../lib/folha-helpers'
import type { FolhaPrevia } from '../../lib/types'
import {
  FolhaPessoaRow,
  PESSOA_GRID,
  type GrupoPessoa,
} from './folha-pessoa-row'

/**
 * A prévia mostra o que vai ser fechado antes de fechar de fato — os valores
 * já vêm calculados (dias trabalhados, folga, ausências) e não se editam
 * aqui, só o vencimento dos mensalistas e o dia de pagamento dos entregadores,
 * que ficam nos controles abaixo da lista.
 */
export function FolhaPreviaEditavel({ previa }: { previa: FolhaPrevia }) {
  const [vencimento, setVencimento] = useState(previa.dataVencimento)
  const { setParams } = useQueryParams()

  // Uma entrada por pessoa, na ordem em que as linhas já vieram ordenadas.
  const grupos: GrupoPessoa[] = []
  const porFuncionario = new Map<string, GrupoPessoa>()

  previa.linhas.forEach((linha, indice) => {
    let grupo = porFuncionario.get(linha.funcionarioId)
    if (!grupo) {
      grupo = {
        funcionarioNome: linha.funcionarioNome,
        cargoNome: linha.cargoNome,
        indices: [],
      }
      porFuncionario.set(linha.funcionarioId, grupo)
      grupos.push(grupo)
    }
    grupo.indices.push(indice)
  })

  const linhasFinais = previa.linhas.map((linha) => ({
    funcionarioId: linha.funcionarioId,
    tipo: linha.tipo,
    descricao: linha.descricao,
    valor: linha.valor,
    dataVencimento: linha.dataVencimento,
  }))

  const total = totalFolha(linhasFinais)

  const fechar = useAction(fecharFolhaAction, {
    onSuccess: ({ data }) =>
      toast.success(
        `Folha fechada — ${data?.linhas ?? 0} ${(data?.linhas ?? 0) === 1 ? 'conta gerada' : 'contas geradas'} no financeiro`
      ),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível fechar a folha'),
  })

  return (
    <div className="flex flex-col gap-4">
      <div
        role="table"
        aria-label={`Prévia da folha de ${rotuloCompetencia(previa.competencia)}`}
        className="flex flex-col gap-2"
      >
        <div
          role="row"
          className={cn(
            'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
            PESSOA_GRID
          )}
        >
          <span role="columnheader">Funcionário</span>
          <span role="columnheader">Referente a</span>
          <span role="columnheader" className="text-right">
            Total
          </span>
        </div>

        {grupos.map((grupo) => (
          <FolhaPessoaRow
            key={grupo.indices[0]}
            grupo={grupo}
            linhas={previa.linhas}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-card p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="folha-vencimento">Mensalistas vencem em</Label>
            <Input
              id="folha-vencimento"
              type="date"
              className="h-11 sm:h-9 sm:w-44"
              value={vencimento}
              onChange={(event) => setVencimento(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="folha-dia-pagamento">Entregadores recebem</Label>
            <Select
              value={String(previa.diaPagamentoSemanal)}
              onValueChange={(valor) => setParams({ pagamento: valor })}
            >
              <SelectTrigger
                id="folha-dia-pagamento"
                className="h-11 sm:h-9 sm:w-44"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAS_DA_SEMANA.map((dia, indice) => (
                  <SelectItem key={dia} value={String(indice)}>
                    Toda {dia.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">
              Total da folha
            </span>
            <span className="text-2xl font-semibold tabular-nums">
              {formatCurrencyBRL(total)}
            </span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full sm:w-auto"
                disabled={fechar.isExecuting || linhasFinais.length === 0}
              >
                <Lock className="size-4" />
                Fechar folha de {rotuloCompetencia(previa.competencia)}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Fechar a folha de {rotuloCompetencia(previa.competencia)}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Nascem {linhasFinais.length}{' '}
                  {linhasFinais.length === 1 ? 'conta' : 'contas'} a pagar no
                  financeiro para {grupos.length}{' '}
                  {grupos.length === 1 ? 'pessoa' : 'pessoas'}, somando{' '}
                  {formatCurrencyBRL(total)}. Dá para desfazer enquanto nenhuma
                  for quitada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Ainda não</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    fechar.execute({
                      competencia: previa.competencia,
                      dataVencimento: vencimento,
                      linhas: linhasFinais,
                    })
                  }
                >
                  Fechar folha
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
