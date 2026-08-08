import { ShoppingCart } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import type { EstoqueItem } from '@/features/estoque/lib/types'
import { formatCurrencyBRL } from '@/lib/formatters'
import type { FornecedorListItem, SugestaoGrupo } from '../../lib/types'
import { CompraDrawer } from '../form/compra-drawer'

export function SugestaoFornecedorCard({
  grupo,
  fornecedores,
  itens,
  precosPorFornecedor,
  hoje,
}: {
  grupo: SugestaoGrupo
  fornecedores: FornecedorListItem[]
  itens: EstoqueItem[]
  precosPorFornecedor: Record<string, number>
  hoje: string
}) {
  const linhasIniciais = grupo.itens.map((item) => ({
    estoqueItemId: item.estoqueItemId,
    quantidade: item.faltam,
    valorUnitario: item.ultimoPreco ?? 0,
  }))

  return (
    <section className="rounded-xl bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold">{grupo.fornecedorNome}</h3>
          <p className="text-sm text-muted-foreground">
            {grupo.itens.length}{' '}
            {grupo.itens.length === 1 ? 'item abaixo' : 'itens abaixo'} do ponto
            {grupo.custoEstimado > 0 && (
              <> · ~{formatCurrencyBRL(grupo.custoEstimado)} pelo último preço</>
            )}
          </p>
        </div>

        {grupo.fornecedorId ? (
          <CompraDrawer
            hoje={hoje}
            fornecedores={fornecedores}
            itens={itens}
            precosPorFornecedor={precosPorFornecedor}
            fornecedorInicialId={grupo.fornecedorId}
            linhasIniciais={linhasIniciais}
            gatilho={
              <Button size="sm" className="w-full sm:w-auto">
                <ShoppingCart className="size-4" />
                Criar pedido
              </Button>
            }
          />
        ) : (
          <p className="text-xs text-muted-foreground sm:max-w-[16rem] sm:text-right">
            Defina o fornecedor padrão desses itens no estoque para pedir daqui.
          </p>
        )}
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {grupo.itens.map((item) => (
          <li
            key={item.estoqueItemId}
            className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            <span className="min-w-0 truncate font-medium">
              {item.nome}
              {item.tamanhoEmbalagem && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {item.tamanhoEmbalagem}
                  {item.unidade}
                </span>
              )}
            </span>

            <span className="flex shrink-0 items-baseline gap-4 text-sm tabular-nums">
              <span
                className={
                  item.quantidadeAtual <= 0
                    ? 'font-medium text-destructive'
                    : 'text-muted-foreground'
                }
              >
                tem {item.quantidadeAtual} de {item.pontoReposicao}
              </span>
              <span className="font-medium">
                pedir {item.faltam} {item.unidade}
              </span>
              <span className="w-20 text-right text-muted-foreground">
                {item.ultimoPreco == null
                  ? 'sem preço'
                  : formatCurrencyBRL(item.ultimoPreco)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
