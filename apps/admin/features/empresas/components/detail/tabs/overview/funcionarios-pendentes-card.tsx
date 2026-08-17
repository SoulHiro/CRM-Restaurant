import { Bell } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
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
    <Card className="col-span-2 flex h-full flex-col overflow-hidden border-0">
      <CardHeader>
        <CardTitle className="text-base">
          Funcionários que não responderam
        </CardTitle>
        <CardDescription>
          {naoResponderam.length} de {totalFuncionarios} ativos
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {naoResponderam.length === 0 ? (
          <EmptyState message="Todos os funcionários já responderam." />
        ) : (
          <div className="flex flex-col gap-2">
            {naoResponderam.map((funcionario) => (
              <div
                key={funcionario.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3"
              >
                <div className="flex items-center gap-3">
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
                <Button type="button" variant="outline" size="sm">
                  <Bell className="size-3.5" />
                  Lembrar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
