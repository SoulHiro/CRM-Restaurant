import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'
import { PersonAvatar } from '@repo/ui/components/person-avatar'

import type { EmpresaFuncionario } from '../../../../lib/types'

export function FuncionariosPendentesCard({
  naoResponderam,
  totalFuncionarios,
}: {
  naoResponderam: EmpresaFuncionario[]
  totalFuncionarios: number
}) {
  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">
          Funcionários que não responderam
        </CardTitle>
        <CardDescription>
          {naoResponderam.length} de {totalFuncionarios} ativos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {naoResponderam.length === 0 ? (
          <EmptyState message="Todos os funcionários já responderam." />
        ) : (
          <div className="flex flex-col gap-4">
            {naoResponderam.map((funcionario) => (
              <div key={funcionario.id} className="flex items-center gap-3">
                <PersonAvatar
                  name={funcionario.nome}
                  className="size-8"
                  fallbackClassName="text-xs font-medium"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {funcionario.nome}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {funcionario.setor}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
