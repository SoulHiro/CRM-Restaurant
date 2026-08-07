import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { FieldCell } from '@repo/ui/components/field-cell'

import { formatDateBR } from '@/lib/formatters'
import { UNIDADE_LABELS } from '../../../lib/estoque-helpers'
import type { EstoqueItem } from '../../../lib/types'
import { formatQuantidade } from '../../shared/quantidade'

export function DadosTab({ item }: { item: EstoqueItem }) {
  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Cadastro</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 pt-0 sm:grid-cols-3">
        <FieldCell label="Nome" value={item.nome} />
        <FieldCell
          label="Unidade"
          value={`${item.unidade} — ${UNIDADE_LABELS[item.unidade]}`}
        />
        <FieldCell
          label="Quantidade em estoque"
          value={`${formatQuantidade(item.quantidadeAtual)} ${item.unidade}`}
        />
        <FieldCell
          label="Tamanho da embalagem"
          value={
            item.tamanhoEmbalagem
              ? `${formatQuantidade(item.tamanhoEmbalagem)} ${item.unidade}`
              : 'Não definido'
          }
        />
        <FieldCell
          label="Ponto de reposição"
          value={
            item.pontoReposicao > 0
              ? `${formatQuantidade(item.pontoReposicao)} ${item.unidade}`
              : 'Sem aviso'
          }
        />
        <FieldCell
          label="Validade"
          value={item.validade ? formatDateBR(item.validade) : 'Não perecível'}
        />
        <FieldCell
          label="Fornecedor padrão"
          value={item.fornecedorPadraoNome ?? 'Não definido'}
        />
        <FieldCell label="Situação" value={item.ativo ? 'Ativo' : 'Desativado'} />
        <FieldCell label="Cadastrado em" value={formatDateBR(item.criadoEm)} />
      </CardContent>
    </Card>
  )
}
