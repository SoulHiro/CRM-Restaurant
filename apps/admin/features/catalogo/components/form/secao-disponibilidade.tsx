'use client'

import { Bike, CircleCheck, Moon, PauseCircle, Store, Sun } from 'lucide-react'

import { Card, CardContent } from '@repo/ui/components/card'
import { Label } from '@repo/ui/components/label'

import type { CriarProdutoInput } from '../../lib/types'
import { DiaSemanaPicker } from '../shared/dia-semana-picker'
import { SelectableCard } from '../shared/selectable-card'

export function SecaoDisponibilidade({
  dados,
  onChange,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
}) {
  return (
    <Card className="border-0">
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <Label className="text-sm">Canais de venda</Label>
          <div className="grid grid-cols-2 gap-3">
            <SelectableCard
              icon={Store}
              label="Local"
              description="Servido no salão"
              selected={dados.disponivelLocal}
              onClick={() => onChange({ disponivelLocal: !dados.disponivelLocal })}
            />
            <SelectableCard
              icon={Bike}
              label="Delivery"
              description="Sai pra entrega"
              selected={dados.disponivelDelivery}
              onClick={() =>
                onChange({ disponivelDelivery: !dados.disponivelDelivery })
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">Turno</Label>
          <div className="grid grid-cols-2 gap-3">
            <SelectableCard
              icon={Sun}
              label="Almoço"
              selected={dados.apareceAlmoco}
              onClick={() => onChange({ apareceAlmoco: !dados.apareceAlmoco })}
            />
            <SelectableCard
              icon={Moon}
              label="Janta"
              selected={dados.apareceJanta}
              onClick={() => onChange({ apareceJanta: !dados.apareceJanta })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">Status</Label>
          <div className="grid grid-cols-2 gap-3">
            <SelectableCard
              icon={CircleCheck}
              label="Disponível"
              selected={!dados.pausadoHoje}
              onClick={() => onChange({ pausadoHoje: false })}
            />
            <SelectableCard
              icon={PauseCircle}
              label="Pausado hoje"
              description="Volta sozinho amanhã"
              selected={dados.pausadoHoje}
              onClick={() => onChange({ pausadoHoje: true })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">Dias da semana</Label>
          <p className="text-xs text-muted-foreground">
            Em quais dias entra no cardápio. Nenhum marcado = todo dia.
          </p>
          <DiaSemanaPicker
            value={dados.diasSemana}
            onChange={(diasSemana) => onChange({ diasSemana })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
