import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import {
  MODELO_LABELS,
  MOTIVO_DESLIGAMENTO_LABELS,
  TURNO_LABELS,
  tempoDeCasa,
} from '../../lib/salario-helpers'
import type { Cargo, FuncionarioDetalhe } from '../../lib/types'
import { AusenciaDrawer } from '../form/ausencia-drawer'
import { EditarFuncionarioDrawer } from '../form/editar-funcionario-drawer'
import { EntregadorDrawer } from '../form/entregador-drawer'
import { ReajusteDrawer } from '../form/reajuste-drawer'
import { StatusFuncionarioBadge } from '../shared/status-funcionario-badge'
import { DesligarFuncionarioButton } from './desligar-funcionario-button'

export function FuncionarioHeader({
  funcionario,
  cargos,
  hoje,
}: {
  funcionario: FuncionarioDetalhe
  cargos: Cargo[]
  hoje: string
}) {
  const remuneracao = funcionario.entregador
    ? `${formatCurrencyBRL(funcionario.entregador.valorDiaria)}/dia`
    : funcionario.salarioAtual == null
      ? '—'
      : formatCurrencyBRL(funcionario.salarioAtual)

  return (
    <div className="flex w-full flex-col gap-4">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/funcionarios">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div className="flex flex-col gap-6 rounded-xl bg-sidebar p-4 sm:p-6 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-sidebar-foreground">
            {funcionario.nome}
          </h1>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums text-sidebar-foreground">
              {remuneracao}
            </span>
            <span className="text-sm text-sidebar-foreground/70">
              {funcionario.entregador ? 'por diária' : 'por mês'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sidebar-foreground/70">
            <StatusFuncionarioBadge status={funcionario.status} />
            <span>{funcionario.cargoNome}</span>
            <span>{MODELO_LABELS[funcionario.modeloContratual]}</span>
            <span>{TURNO_LABELS[funcionario.turno]}</span>
            <span>
              {funcionario.status === 'desligado' &&
              funcionario.dataDesligamento
                ? `Saiu em ${formatDateBR(funcionario.dataDesligamento)}`
                : `Na casa há ${tempoDeCasa(funcionario.dataAdmissao, hoje)}`}
            </span>
            {funcionario.motivoDesligamento && (
              <span>
                {MOTIVO_DESLIGAMENTO_LABELS[funcionario.motivoDesligamento]}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {!funcionario.entregador && (
            <ReajusteDrawer
              funcionarioId={funcionario.id}
              funcionarioNome={funcionario.nome}
              salarioAtual={funcionario.salarioAtual}
              hoje={hoje}
            />
          )}
          <EntregadorDrawer
            funcionarioId={funcionario.id}
            funcionarioNome={funcionario.nome}
            entregador={funcionario.entregador}
          />
          <AusenciaDrawer
            funcionarioId={funcionario.id}
            funcionarioNome={funcionario.nome}
            hoje={hoje}
          />
          <EditarFuncionarioDrawer funcionario={funcionario} cargos={cargos} />
          <DesligarFuncionarioButton funcionario={funcionario} hoje={hoje} />
        </div>
      </div>
    </div>
  )
}
