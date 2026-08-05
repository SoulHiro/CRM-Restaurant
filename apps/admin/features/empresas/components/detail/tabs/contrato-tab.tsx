import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'
import { FieldCell } from '@repo/ui/components/field-cell'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import type { EmpresaContrato } from '../../../lib/types'
import { AtivoInativoBadge } from '../../shared/ativo-inativo-badge'

export function ContratoTab({ contrato }: { contrato?: EmpresaContrato }) {
  if (!contrato) {
    return (
      <EmptyState message="Nenhum contrato cadastrado para essa empresa." />
    )
  }

  return (
    <Card className="border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Contrato</CardTitle>
        <AtivoInativoBadge
          active={contrato.vigente}
          activeLabel="Vigente"
          inactiveLabel="Encerrado"
        />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <FieldCell label="Valor" value={formatCurrencyBRL(contrato.valor)} />
        <FieldCell label="Prazo de pagamento" value={contrato.prazoPagamento} />
        <FieldCell
          label="Vigência"
          value={`${formatDateBR(contrato.vigenciaInicio)} até ${formatDateBR(contrato.vigenciaFim)}`}
        />
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          Ver contrato
        </Button>
      </CardFooter>
    </Card>
  )
}
