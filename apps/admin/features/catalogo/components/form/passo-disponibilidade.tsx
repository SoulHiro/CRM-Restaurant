'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

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

import type { ConfiguracaoHorarioFuncionamento } from '@/features/configuracoes/lib/types'
import {
  DISPONIBILIDADE_STATUS,
  DISPONIBILIDADE_STATUS_LABEL,
} from '../../lib/types'
import type {
  CriarProdutoInput,
  DisponibilidadeJanelaInput,
  DisponibilidadeStatus,
} from '../../lib/types'

const DIAS_SEMANA = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

export function PassoDisponibilidade({
  dados,
  horarioFuncionamento,
  onAvancar,
  onVoltar,
}: {
  dados: CriarProdutoInput
  horarioFuncionamento: ConfiguracaoHorarioFuncionamento
  onAvancar: (dados: Partial<CriarProdutoInput>) => void
  onVoltar: () => void
}) {
  const [disponivelDelivery, setDisponivelDelivery] = useState(
    dados.disponivelDelivery
  )
  const [disponivelLocal, setDisponivelLocal] = useState(dados.disponivelLocal)
  const [status, setStatus] = useState<DisponibilidadeStatus>(
    dados.disponibilidadeStatus
  )
  const [apareceAlmoco, setApareceAlmoco] = useState(dados.apareceAlmoco)
  const [apareceJanta, setApareceJanta] = useState(dados.apareceJanta)
  const [janelas, setJanelas] = useState<DisponibilidadeJanelaInput[]>(
    dados.janelas
  )

  const podeAvancar =
    (disponivelDelivery || disponivelLocal) &&
    (status !== 'personalizado' || janelas.length > 0)

  function adicionarJanela() {
    setJanelas((atual) => [
      ...atual,
      { diaSemana: 1, horaInicio: '11:00', horaFim: '14:00' },
    ])
  }

  function atualizarJanela(
    indice: number,
    campo: keyof DisponibilidadeJanelaInput,
    valor: string | number
  ) {
    setJanelas((atual) =>
      atual.map((janela, i) =>
        i === indice ? { ...janela, [campo]: valor } : janela
      )
    )
  }

  function removerJanela(indice: number) {
    setJanelas((atual) => atual.filter((_, i) => i !== indice))
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <Label className="text-sm">Canais de venda</Label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={disponivelDelivery}
            onChange={(e) => setDisponivelDelivery(e.target.checked)}
          />
          Delivery
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={disponivelLocal}
            onChange={(e) => setDisponivelLocal(e.target.checked)}
          />
          Servir no local
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Status</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as DisponibilidadeStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISPONIBILIDADE_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {DISPONIBILIDADE_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {status !== 'personalizado' ? (
        <div className="flex flex-col gap-2 rounded-md border p-3">
          <Label className="text-sm">Aparece no cardápio</Label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={apareceAlmoco}
              onChange={(e) => setApareceAlmoco(e.target.checked)}
            />
            Almoço ({horarioFuncionamento.almocoInicio}–
            {horarioFuncionamento.almocoFim})
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={apareceJanta}
              onChange={(e) => setApareceJanta(e.target.checked)}
            />
            Janta ({horarioFuncionamento.jantaInicio}–
            {horarioFuncionamento.jantaFim})
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label className="text-sm">Janelas de horário</Label>
          {janelas.map((janela, indice) => (
            <div key={indice} className="flex items-center gap-2">
              <Select
                value={String(janela.diaSemana)}
                onValueChange={(v) =>
                  atualizarJanela(indice, 'diaSemana', Number(v))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((dia, i) => (
                    <SelectItem key={dia} value={String(i)}>
                      {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="time"
                value={janela.horaInicio}
                onChange={(e) =>
                  atualizarJanela(indice, 'horaInicio', e.target.value)
                }
                className="w-28"
              />
              <Input
                type="time"
                value={janela.horaFim}
                onChange={(e) =>
                  atualizarJanela(indice, 'horaFim', e.target.value)
                }
                className="w-28"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 shrink-0"
                onClick={() => removerJanela(indice)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarJanela}
            className="self-start"
          >
            Adicionar janela
          </Button>
        </div>
      )}

      <div className="mt-auto flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
        <Button
          disabled={!podeAvancar}
          onClick={() =>
            onAvancar({
              disponivelDelivery,
              disponivelLocal,
              disponibilidadeStatus: status,
              apareceAlmoco,
              apareceJanta,
              janelas,
            })
          }
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}
