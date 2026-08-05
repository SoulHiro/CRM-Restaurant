import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'

import { formatDateBR } from '@/lib/formatters'
import type { EmpresaContrato } from '../../../../lib/types'
import { AtivoInativoBadge } from '../../../shared/ativo-inativo-badge'

export function ValidadeContratoCard({
  contrato,
}: {
  contrato?: EmpresaContrato
}) {
  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Validade do contrato</CardTitle>
        <CardDescription>Vigência e status atual</CardDescription>
      </CardHeader>
      <CardContent>
        {!contrato ? (
          <EmptyState message="Nenhum contrato cadastrado." />
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Início</span>
              <span className="font-medium">
                {formatDateBR(contrato.vigenciaInicio)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fim</span>
              <span className="font-medium">
                {formatDateBR(contrato.vigenciaFim)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <AtivoInativoBadge
                active={contrato.vigente}
                activeLabel="Vigente"
                inactiveLabel="Encerrado"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
