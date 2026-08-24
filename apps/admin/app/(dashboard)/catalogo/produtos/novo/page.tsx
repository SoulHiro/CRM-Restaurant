import { ProdutoWizard } from '@/features/catalogo/components/form/produto-wizard'
import {
  getAdicionais,
  getCategoriasProduto,
  getClassificacoes,
  getInsumosDisponiveis,
} from '@/features/catalogo/lib/queries'
import {
  getConfiguracaoHorarioFuncionamento,
  getConfiguracaoPrecificacao,
} from '@/features/configuracoes/lib/queries'

export default async function NovoProdutoPage() {
  const [
    categorias,
    insumos,
    classificacoes,
    adicionais,
    horarioFuncionamento,
    configuracaoPrecificacao,
  ] = await Promise.all([
    getCategoriasProduto(),
    getInsumosDisponiveis(),
    getClassificacoes(),
    getAdicionais(),
    getConfiguracaoHorarioFuncionamento(),
    getConfiguracaoPrecificacao(),
  ])

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-2xl flex-col p-6">
      <ProdutoWizard
        categorias={categorias}
        insumos={insumos}
        classificacoes={classificacoes}
        adicionais={adicionais}
        horarioFuncionamento={horarioFuncionamento}
        configuracaoPrecificacao={configuracaoPrecificacao}
      />
    </div>
  )
}
