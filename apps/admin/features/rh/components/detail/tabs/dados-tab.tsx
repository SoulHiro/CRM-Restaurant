import { FieldCell } from '@repo/ui/components/field-cell'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import { DIAS_DA_SEMANA } from '../../../lib/ausencia-helpers'
import {
  MODELO_LABELS,
  MOTIVO_DESLIGAMENTO_LABELS,
  TURNO_LABELS,
  tempoDeCasa,
} from '../../../lib/salario-helpers'
import type { FuncionarioDetalhe } from '../../../lib/types'
import { CpfRevelavel } from '../cpf-revelavel'

export function DadosTab({
  funcionario,
  hoje,
}: {
  funcionario: FuncionarioDetalhe
  hoje: string
}) {
  return (
    <div className="grid grid-cols-1 gap-6 rounded-xl bg-card p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
      <FieldCell label="Cargo" value={funcionario.cargoNome} />
      <FieldCell
        label="Vínculo"
        value={MODELO_LABELS[funcionario.modeloContratual]}
      />
      <FieldCell label="Turno" value={TURNO_LABELS[funcionario.turno]} />

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">CPF</span>
        <CpfRevelavel
          funcionarioId={funcionario.id}
          cpfFinal={funcionario.cpfFinal}
        />
      </div>

      <FieldCell label="CNPJ" value={funcionario.cnpj ?? '—'} />
      <FieldCell
        label="Admitido em"
        value={`${formatDateBR(funcionario.dataAdmissao)} · ${tempoDeCasa(funcionario.dataAdmissao, hoje)}`}
      />

      {funcionario.entregador && (
        <>
          <FieldCell
            label="Valor da diária"
            value={formatCurrencyBRL(funcionario.entregador.valorDiaria)}
          />
          <FieldCell
            label="Taxa de entrega"
            value={
              funcionario.entregador.taxaEntregaPercentual == null
                ? '—'
                : `${funcionario.entregador.taxaEntregaPercentual}%`
            }
          />
          <FieldCell
            label="Folga na semana"
            value={
              funcionario.entregador.folgaSemanal == null
                ? 'Sem dia fixo'
                : DIAS_DA_SEMANA[funcionario.entregador.folgaSemanal] ?? '—'
            }
          />
        </>
      )}

      {funcionario.status === 'desligado' && (
        <>
          <FieldCell
            label="Desligado em"
            value={
              funcionario.dataDesligamento
                ? formatDateBR(funcionario.dataDesligamento)
                : '—'
            }
          />
          <FieldCell
            label="Motivo"
            value={
              funcionario.motivoDesligamento
                ? MOTIVO_DESLIGAMENTO_LABELS[funcionario.motivoDesligamento]
                : '—'
            }
          />
        </>
      )}
    </div>
  )
}
