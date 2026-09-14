'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { ConfiguracaoPrecificacao } from '@/features/configuracoes/lib/types'
import { lerRascunho, salvarRascunho } from '../../lib/produto-rascunho'
import type {
  CategoriaProdutoOption,
  CriarProdutoInput,
  InsumoOption,
} from '../../lib/types'
import { ProdutoResumoSidebar } from './produto-resumo-sidebar'
import { SecaoBasico } from './secao-basico'
import { SecaoFichaTecnica } from './secao-ficha-tecnica'

const VALORES_INICIAIS: CriarProdutoInput = {
  nome: '',
  categoriaId: null,
  tipo: 'comida',
  fotoUrl: '',
  fichaTecnica: [],
  tempoMedioPreparoMinutos: 0,
  temTamanhos: false,
  tamanhos: [],
  precoVenda: 0,
  pausadoHoje: false,
}

export function ProdutoForm({
  categorias,
  insumos,
  configuracaoPrecificacao,
  produtoId,
  dadosIniciais,
}: {
  categorias: CategoriaProdutoOption[]
  insumos: InsumoOption[]
  configuracaoPrecificacao: ConfiguracaoPrecificacao
  /** Presente = editando um produto existente; ausente = cadastro novo. */
  produtoId?: string
  dadosIniciais?: CriarProdutoInput
}) {
  const [dados, setDados] = useState<CriarProdutoInput>(
    dadosIniciais ?? VALORES_INICIAIS
  )
  // Só passa a salvar rascunho depois de checar se já tinha um — sem essa
  // trava, o efeito de salvar rodaria antes do de restaurar e um rascunho
  // real seria sobrescrito pelos valores iniciais na mesma renderização.
  const [prontoParaSalvarRascunho, setProntoParaSalvarRascunho] =
    useState(false)

  useEffect(() => {
    const rascunho = lerRascunho(produtoId)
    if (rascunho) {
      setDados(rascunho)
      toast.info('Rascunho restaurado — continue de onde parou.')
    }
    setProntoParaSalvarRascunho(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!prontoParaSalvarRascunho) return
    const id = setTimeout(() => salvarRascunho(produtoId, dados), 500)
    return () => clearTimeout(id)
  }, [dados, produtoId, prontoParaSalvarRascunho])

  function atualizar(parcial: Partial<CriarProdutoInput>) {
    setDados((atual) => ({ ...atual, ...parcial }))
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <SecaoBasico
          dados={dados}
          onChange={atualizar}
          categoriasIniciais={categorias}
        />
        <SecaoFichaTecnica dados={dados} onChange={atualizar} insumos={insumos} />
      </div>

      <div className="lg:sticky lg:top-6">
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
