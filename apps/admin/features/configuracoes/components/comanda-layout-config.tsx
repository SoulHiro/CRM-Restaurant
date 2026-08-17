'use client'

import { useMemo, useState } from 'react'
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

import { salvarConfiguracaoComandaAction } from '../lib/actions'
import {
  TODOS_CAMPOS_COMANDA,
  type CampoComandaKey,
  type ConfiguracaoComanda,
} from '../lib/types'
import { ComandaCampoRow } from './comanda-campo-row'
import { ComandaPreview } from './comanda-preview'

function ordemInicial(ativos: CampoComandaKey[]): CampoComandaKey[] {
  const resto = TODOS_CAMPOS_COMANDA.filter((c) => !ativos.includes(c))
  return [...ativos, ...resto]
}

export function ComandaLayoutConfig({
  configuracaoInicial,
}: {
  configuracaoInicial: ConfiguracaoComanda
}) {
  const [ordem, setOrdem] = useState<CampoComandaKey[]>(() =>
    ordemInicial(configuracaoInicial.campos)
  )
  const [ativos, setAtivos] = useState<Set<CampoComandaKey>>(
    () => new Set(configuracaoInicial.campos)
  )

  const campos = useMemo(
    () => ordem.filter((c) => ativos.has(c)),
    [ordem, ativos]
  )

  const { execute, isExecuting } = useAction(salvarConfiguracaoComandaAction, {
    onSuccess: () => toast.success('Layout da comanda salvo'),
    onError: () => toast.error('Não foi possível salvar o layout'),
  })

  function alternar(campo: CampoComandaKey) {
    setAtivos((atual) => {
      const novo = new Set(atual)
      if (novo.has(campo)) novo.delete(campo)
      else novo.add(campo)
      return novo
    })
  }

  function mover(campo: CampoComandaKey, direcao: -1 | 1) {
    setOrdem((atual) => {
      const indice = atual.indexOf(campo)
      const destino = indice + direcao
      if (destino < 0 || destino >= atual.length) return atual
      const nova = [...atual]
      const [removido] = nova.splice(indice, 1)
      nova.splice(destino, 0, removido!)
      return nova
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Impressão de comanda</CardTitle>
          <CardDescription>
            O nome do colaborador é sempre o topo, em destaque. Escolha o que
            mais aparece embaixo dele, e em que ordem.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {ordem.map((campo, indice) => (
              <ComandaCampoRow
                key={campo}
                campo={campo}
                ativo={ativos.has(campo)}
                podeSubir={indice > 0}
                podeDescer={indice < ordem.length - 1}
                onToggle={() => alternar(campo)}
                onSubir={() => mover(campo, -1)}
                onDescer={() => mover(campo, 1)}
              />
            ))}
          </div>

          <Button
            className="self-start"
            disabled={isExecuting}
            onClick={() => execute({ campos })}
          >
            {isExecuting ? 'Salvando...' : 'Salvar layout'}
          </Button>
        </CardContent>
      </Card>

      <Card className="flex flex-col overflow-hidden border-0 p-0">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base">Pré-visualização</CardTitle>
          <CardDescription>
            Exatamente como sai na bobina de 80mm.
          </CardDescription>
        </CardHeader>
        <ComandaPreview campos={campos} />
      </Card>
    </div>
  )
}
