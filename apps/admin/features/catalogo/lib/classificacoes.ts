import type { ClassificacaoIconKey } from './classificacao-icons'
import type { TipoProduto } from './types'

/**
 * Classificações são rótulos fixos, iguais pra qualquer restaurante — não
 * fazem sentido como cadastro (não existe "criar uma classificação nova"
 * no dia a dia). Por isso vivem em código, não em tabela; `produto.classificacoes`
 * só guarda as chaves selecionadas.
 */
export interface ClassificacaoDefinicao {
  key: string
  nome: string
  descricao: string
  icone: ClassificacaoIconKey
  tipos: readonly TipoProduto[]
}

export const CLASSIFICACOES: readonly ClassificacaoDefinicao[] = [
  {
    key: 'vegano',
    nome: 'Vegano',
    descricao: 'Sem nenhum ingrediente de origem animal',
    icone: 'leaf',
    tipos: ['comida'],
  },
  {
    key: 'vegetariano',
    nome: 'Vegetariano',
    descricao: 'Sem carne',
    icone: 'sprout',
    tipos: ['comida'],
  },
  {
    key: 'organico',
    nome: 'Orgânico',
    descricao: 'Ingrediente de produção orgânica',
    icone: 'sprout',
    tipos: ['comida'],
  },
  {
    key: 'sem-gluten',
    nome: 'Sem glúten',
    descricao: 'Livre de glúten',
    icone: 'wheat-off',
    tipos: ['comida'],
  },
  {
    key: 'sem-acucar',
    nome: 'Sem açúcar',
    descricao: 'Sem adição de açúcar',
    icone: 'candy-off',
    tipos: ['comida'],
  },
  {
    key: 'zero-lactose',
    nome: 'Zero lactose',
    descricao: 'Sem lactose',
    icone: 'milk-off',
    tipos: ['comida', 'bebida'],
  },
  {
    key: 'diet-zero',
    nome: 'Diet/Zero',
    descricao: 'Sem açúcar adicionado',
    icone: 'sparkles',
    tipos: ['bebida'],
  },
  {
    key: 'gelada',
    nome: 'Gelada',
    descricao: 'Servida gelada',
    icone: 'snowflake',
    tipos: ['bebida'],
  },
  {
    key: 'alcoolica',
    nome: 'Alcoólica',
    descricao: 'Contém álcool',
    icone: 'wine',
    tipos: ['bebida'],
  },
  {
    key: 'natural',
    nome: 'Natural',
    descricao: 'Suco/bebida natural, sem industrialização',
    icone: 'droplet',
    tipos: ['bebida'],
  },
] as const

export function classificacoesPorTipo(
  tipo: TipoProduto
): readonly ClassificacaoDefinicao[] {
  return CLASSIFICACOES.filter((c) => c.tipos.includes(tipo))
}
