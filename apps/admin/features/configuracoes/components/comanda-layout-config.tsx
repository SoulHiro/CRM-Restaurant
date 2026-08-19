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
  TODOS_CAMPOS_RESUMO,
  type CampoComandaKey,
  type CampoResumoKey,
  type ConfiguracaoComanda,
  type ConfiguracaoLayoutResumo,
  type ConfiguracaoResumoDia,
  type ImpressoraOption,
} from '../lib/types'
import { ComandaPreview } from './comanda-preview'
import { ImpressorasTab } from './impressoras-tab'
import { PedidosTabConfig } from './pedidos-tab-config'
import { ResumoDiaPreview } from './resumo-dia-preview'
import { ResumoDoDiaTab } from './resumo-do-dia-tab'

type AbaAtiva = 'pedidos' | 'impressoras' | 'resumo'

function ordemInicial(ativos: CampoComandaKey[]): CampoComandaKey[] {
  const resto = TODOS_CAMPOS_COMANDA.filter((c) => !ativos.includes(c))
  return [...ativos, ...resto]
}

function ordemInicialResumo(ativos: CampoResumoKey[]): CampoResumoKey[] {
  const resto = TODOS_CAMPOS_RESUMO.filter((c) => !ativos.includes(c))
  return [...ativos, ...resto]
}

export function ComandaLayoutConfig({
  configuracaoInicial,
  impressorasIniciais,
  configuracaoResumoDiaInicial,
  layoutResumoInicial,
}: {
  configuracaoInicial: ConfiguracaoComanda
  impressorasIniciais: ImpressoraOption[]
  configuracaoResumoDiaInicial: ConfiguracaoResumoDia
  layoutResumoInicial: ConfiguracaoLayoutResumo
}) {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('pedidos')

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

  // Dados da empresa (nome/cnpj/IE/endereço) só leitura aqui — edição
  // aconteceu em Configurações → Dados da empresa, essa tela é só o layout
  // (quais linhas aparecem e em que ordem).
  const { cnpj, inscricaoEstadual, nomeEstabelecimento, endereco } =
    configuracaoResumoDiaInicial

  const [ordemResumo, setOrdemResumo] = useState<CampoResumoKey[]>(() =>
    ordemInicialResumo(layoutResumoInicial.campos)
  )
  const [ativosResumo, setAtivosResumo] = useState<Set<CampoResumoKey>>(
    () => new Set(layoutResumoInicial.campos)
  )

  const campos = useMemo(
    () => ordem.filter((c) => ativos.has(c)),
    [ordem, ativos]
  )
  const camposResumo = useMemo(
    () => ordemResumo.filter((c) => ativosResumo.has(c)),
    [ordemResumo, ativosResumo]
  )

  function onToggle(campo: CampoComandaKey) {
    setAtivos((atual) => {
      const novo = new Set(atual)
      if (novo.has(campo)) novo.delete(campo)
      else novo.add(campo)
      return novo
    })
  }

  function onToggleResumo(campo: CampoResumoKey) {
    setAtivosResumo((atual) => {
      const novo = new Set(atual)
      if (novo.has(campo)) novo.delete(campo)
      else novo.add(campo)
      return novo
    })
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[2fr_3fr]">
      {abaAtiva === 'resumo' ? (
        <ResumoDiaPreview
          nomeEstabelecimento={nomeEstabelecimento}
          endereco={endereco}
          cnpj={cnpj}
          inscricaoEstadual={inscricaoEstadual}
          campos={camposResumo}
        />
      ) : (
        <ComandaPreview campos={campos} />
      )}

      <Tabs
        value={abaAtiva}
        onValueChange={(v) => setAbaAtiva(v as AbaAtiva)}
        className="flex flex-col"
      >
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
          <ResumoDoDiaTab
            ordem={ordemResumo}
            setOrdem={setOrdemResumo}
            ativos={ativosResumo}
            onToggle={onToggleResumo}
            campos={camposResumo}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
