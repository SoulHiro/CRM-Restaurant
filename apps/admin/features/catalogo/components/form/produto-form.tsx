'use client'

import { useState } from 'react'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import type { ConfiguracaoPrecificacao } from '@/features/configuracoes/lib/types'
import type {
  CategoriaProdutoOption,
  CriarProdutoInput,
  GrupoAdicionalOption,
  InsumoOption,
} from '../../lib/types'
import { PreviewMobileProduto } from './preview-mobile-produto'
import { ProdutoResumoSidebar } from './produto-resumo-sidebar'
import { SecaoAdicionais } from './secao-adicionais'
import { SecaoBasico } from './secao-basico'
import { SecaoClassificacoes } from './secao-classificacoes'
import { SecaoDisponibilidade } from './secao-disponibilidade'
import { SecaoFichaTecnica } from './secao-ficha-tecnica'

const VALORES_INICIAIS: CriarProdutoInput = {
  nome: '',
  categoriaId: null,
  tipo: 'comida',
  descricao: '',
  fotoUrl: '',
  videoUrl: '',
  fichaTecnica: [],
  tempoMedioPreparoMinutos: 0,
  temTamanhos: false,
  tamanhos: [],
  precoVenda: 0,
  descontoTipo: 'percentual',
  descontoValor: null,
  disponivelDelivery: true,
  disponivelLocal: true,
  pausadoHoje: false,
  apareceAlmoco: true,
  apareceJanta: true,
  diasSemana: [],
  classificacoes: [],
  grupoAdicionalIds: [],
}

function ContagemTab({ total }: { total: number }) {
  if (total === 0) return null
  return <span className="ml-1.5 text-xs opacity-70">{total}</span>
}

export function ProdutoForm({
  categorias,
  insumos,
  grupos,
  configuracaoPrecificacao,
  produtoId,
  dadosIniciais,
}: {
  categorias: CategoriaProdutoOption[]
  insumos: InsumoOption[]
  grupos: GrupoAdicionalOption[]
  configuracaoPrecificacao: ConfiguracaoPrecificacao
  /** Presente = editando um produto existente; ausente = cadastro novo. */
  produtoId?: string
  dadosIniciais?: CriarProdutoInput
}) {
  const [dados, setDados] = useState<CriarProdutoInput>(
    dadosIniciais ?? VALORES_INICIAIS
  )

  function atualizar(parcial: Partial<CriarProdutoInput>) {
    setDados((atual) => ({ ...atual, ...parcial }))
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_360px]">
      <Tabs defaultValue="item">
        <TabsList className="flex w-full justify-start bg-sidebar">
          <TabsTrigger value="item">Item</TabsTrigger>
          <TabsTrigger value="adicionais">
            Adicionais
            <ContagemTab total={dados.grupoAdicionalIds.length} />
          </TabsTrigger>
          <TabsTrigger value="classificacoes">
            Classificações
            <ContagemTab total={dados.classificacoes.length} />
          </TabsTrigger>
          <TabsTrigger value="disponibilidade">Disponibilidade</TabsTrigger>
          <TabsTrigger value="ficha-tecnica">
            Ficha técnica
            <ContagemTab total={dados.fichaTecnica.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="item" className="mt-4">
          <SecaoBasico
            dados={dados}
            onChange={atualizar}
            categoriasIniciais={categorias}
          />
        </TabsContent>

        <TabsContent value="adicionais" className="mt-4">
          <SecaoAdicionais dados={dados} onChange={atualizar} grupos={grupos} />
        </TabsContent>

        <TabsContent value="classificacoes" className="mt-4">
          <SecaoClassificacoes dados={dados} onChange={atualizar} />
        </TabsContent>

        <TabsContent value="disponibilidade" className="mt-4">
          <SecaoDisponibilidade dados={dados} onChange={atualizar} />
        </TabsContent>

        <TabsContent value="ficha-tecnica" className="mt-4">
          <SecaoFichaTecnica
            dados={dados}
            onChange={atualizar}
            insumos={insumos}
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-4 lg:sticky lg:top-6">
        <PreviewMobileProduto dados={dados} categorias={categorias} />
        <ProdutoResumoSidebar
          dados={dados}
          onChange={atualizar}
          configuracaoPrecificacao={configuracaoPrecificacao}
          produtoId={produtoId}
        />
      </div>
    </div>
  )
}
