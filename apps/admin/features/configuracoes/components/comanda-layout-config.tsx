'use client'

import { useMemo, useState } from 'react'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import {
  TODOS_CAMPOS_COMANDA,
  type CampoComandaKey,
  type ConfiguracaoComanda,
  type ConfiguracaoResumoDia,
  type ImpressoraOption,
} from '../lib/types'
import { ComandaPreview } from './comanda-preview'
import { ImpressorasTab } from './impressoras-tab'
import { PedidosTabConfig } from './pedidos-tab-config'
import { ResumoDoDiaTab } from './resumo-do-dia-tab'

function ordemInicial(ativos: CampoComandaKey[]): CampoComandaKey[] {
  const resto = TODOS_CAMPOS_COMANDA.filter((c) => !ativos.includes(c))
  return [...ativos, ...resto]
}

export function ComandaLayoutConfig({
  configuracaoInicial,
  impressorasIniciais,
  configuracaoResumoDiaInicial,
}: {
  configuracaoInicial: ConfiguracaoComanda
  impressorasIniciais: ImpressoraOption[]
  configuracaoResumoDiaInicial: ConfiguracaoResumoDia
}) {
  const [ordem, setOrdem] = useState<CampoComandaKey[]>(() =>
    ordemInicial(configuracaoInicial.campos)
  )
  const [ativos, setAtivos] = useState<Set<CampoComandaKey>>(
    () => new Set(configuracaoInicial.campos)
  )
  const [impressoraId, setImpressoraId] = useState<string | null>(
    configuracaoInicial.impressoraId
  )
  const [impressoras, setImpressoras] = useState<ImpressoraOption[]>(
    impressorasIniciais
  )

  const campos = useMemo(
    () => ordem.filter((c) => ativos.has(c)),
    [ordem, ativos]
  )

  function onToggle(campo: CampoComandaKey) {
    setAtivos((atual) => {
      const novo = new Set(atual)
      if (novo.has(campo)) novo.delete(campo)
      else novo.add(campo)
      return novo
    })
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[2fr_3fr]">
      <ComandaPreview campos={campos} />

      <Tabs defaultValue="pedidos" className="flex flex-col">
        <TabsList className="flex w-fit justify-start">
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="impressoras">Impressoras</TabsTrigger>
          <TabsTrigger value="resumo">Resumo do dia</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="mt-4">
          <PedidosTabConfig
            ordem={ordem}
            setOrdem={setOrdem}
            ativos={ativos}
            onToggle={onToggle}
            campos={campos}
            impressoraId={impressoraId}
            setImpressoraId={setImpressoraId}
            impressoras={impressoras}
          />
        </TabsContent>

        <TabsContent value="impressoras" className="mt-4">
          <ImpressorasTab
            impressoras={impressoras}
            onCriada={(nova) => setImpressoras((atual) => [...atual, nova])}
          />
        </TabsContent>

        <TabsContent value="resumo" className="mt-4">
          <ResumoDoDiaTab configuracaoInicial={configuracaoResumoDiaInicial} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
