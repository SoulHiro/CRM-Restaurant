'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

import { salvarConfiguracaoHorarioFuncionamentoAction } from '../lib/actions'
import type { ConfiguracaoHorarioFuncionamento } from '../lib/types'

function CampoHorario({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function HorarioFuncionamentoForm({
  configuracaoInicial,
}: {
  configuracaoInicial: ConfiguracaoHorarioFuncionamento
}) {
  const [horario, setHorario] = useState(configuracaoInicial)

  const { execute, isExecuting } = useAction(
    salvarConfiguracaoHorarioFuncionamentoAction,
    {
      onSuccess: () => toast.success('Horários de funcionamento salvos'),
      onError: () => toast.error('Não foi possível salvar os horários'),
    }
  )

  function set<K extends keyof ConfiguracaoHorarioFuncionamento>(
    campo: K,
    valor: string
  ) {
    setHorario((atual) => ({ ...atual, [campo]: valor }))
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Esses horários alimentam o toggle rápido de almoço/janta e a
        disponibilidade de delivery/salão no cadastro de produto do Catálogo.
      </p>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Refeições</CardTitle>
          <CardDescription>
            Usado pelo toggle rápido &quot;aparece no almoço/janta&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoHorario
            label="Almoço — início"
            value={horario.almocoInicio}
            onChange={(v) => set('almocoInicio', v)}
          />
          <CampoHorario
            label="Almoço — fim"
            value={horario.almocoFim}
            onChange={(v) => set('almocoFim', v)}
          />
          <CampoHorario
            label="Janta — início"
            value={horario.jantaInicio}
            onChange={(v) => set('jantaInicio', v)}
          />
          <CampoHorario
            label="Janta — fim"
            value={horario.jantaFim}
            onChange={(v) => set('jantaFim', v)}
          />
        </CardContent>
      </Card>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Delivery e salão</CardTitle>
          <CardDescription>
            Janela em que cada canal fica aberto para pedidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoHorario
            label="Delivery — abre"
            value={horario.deliveryAbre}
            onChange={(v) => set('deliveryAbre', v)}
          />
          <CampoHorario
            label="Delivery — fecha"
            value={horario.deliveryFecha}
            onChange={(v) => set('deliveryFecha', v)}
          />
          <CampoHorario
            label="Salão — abre"
            value={horario.localAbre}
            onChange={(v) => set('localAbre', v)}
          />
          <CampoHorario
            label="Salão — fecha"
            value={horario.localFecha}
            onChange={(v) => set('localFecha', v)}
          />
        </CardContent>
      </Card>

      <Button
        className="self-start"
        disabled={isExecuting}
        onClick={() => execute(horario)}
      >
        {isExecuting ? 'Salvando...' : 'Salvar horários'}
      </Button>
    </div>
  )
}
