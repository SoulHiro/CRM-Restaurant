'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Card, CardContent } from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Label } from '@repo/ui/components/label'

import type { CategoriaProdutoOption } from '@/features/catalogo/lib/types'
import { registrarConsumoAction } from '../lib/actions'
import type {
  FuncionarioConsumo,
  ProdutoConsumivelOption,
} from '../lib/types'
import { FuncionarioPicker } from './funcionario-picker'
import { ProdutoPicker } from './produto-picker'
import { ResumoPendente } from './resumo-pendente'

let contadorLocal = 0

export function ConsumoFuncionarioPage({
  funcionariosIniciais,
  produtos,
  categorias,
}: {
  funcionariosIniciais: FuncionarioConsumo[]
  produtos: ProdutoConsumivelOption[]
  categorias: CategoriaProdutoOption[]
}) {
  const [funcionarios, setFuncionarios] = useState(funcionariosIniciais)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)

  const { executeAsync } = useAction(registrarConsumoAction)

  const selecionado =
    funcionarios.find((f) => f.id === selecionadoId) ?? null

  function removerLancamentoLocal(funcionarioId: string, idLocal: string) {
    setFuncionarios((atual) =>
      atual.map((f) => {
        if (f.id !== funcionarioId) return f
        const item = f.itensPendentes.find((i) => i.id === idLocal)
        if (!item) return f
        return {
          ...f,
          totalPendente: f.totalPendente - item.quantidade * item.precoUnitario,
          itensPendentes: f.itensPendentes.filter((i) => i.id !== idLocal),
        }
      })
    )
  }

  async function lancarConsumo(produto: ProdutoConsumivelOption) {
    if (!selecionado) return
    const funcionarioId = selecionado.id

    contadorLocal += 1
    const idLocal = `local-${contadorLocal}`

    setFuncionarios((atual) =>
      atual.map((f) =>
        f.id !== funcionarioId
          ? f
          : {
              ...f,
              totalPendente: f.totalPendente + produto.precoVenda,
              itensPendentes: [
                {
                  id: idLocal,
                  produtoNome: produto.nome,
                  quantidade: 1,
                  precoUnitario: produto.precoVenda,
                  createdAt: new Date().toISOString(),
                },
                ...f.itensPendentes,
              ],
            }
      )
    )

    const resultado = await executeAsync({
      funcionarioId,
      produtoId: produto.id,
      quantidade: 1,
    })

    if (!resultado?.data) {
      removerLancamentoLocal(funcionarioId, idLocal)
      toast.error(resultado?.serverError ?? 'Não foi possível lançar')
    }
  }

  function aoQuitar(funcionarioId: string) {
    setFuncionarios((atual) =>
      atual.map((f) =>
        f.id !== funcionarioId
          ? f
          : { ...f, totalPendente: 0, itensPendentes: [] }
      )
    )
  }

  if (funcionarios.length === 0) {
    return (
      <Card className="border-0">
        <CardContent className="p-6">
          <EmptyState message="Nenhum funcionário ativo cadastrado ainda." />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <Card className="border-0">
          <CardContent className="flex flex-col gap-2 p-4">
            <Label className="text-sm">Quem consumiu?</Label>
            <FuncionarioPicker
              funcionarios={funcionarios}
              selecionadoId={selecionadoId}
              onSelecionar={setSelecionadoId}
            />
          </CardContent>
        </Card>

        <Card className="border-0">
          <CardContent className="flex flex-col gap-2 p-4">
            <Label className="text-sm">
              {selecionado
                ? `O que ${selecionado.nome} pegou?`
                : 'Selecione a funcionária pra lançar um item'}
            </Label>
            <ProdutoPicker
              produtos={produtos}
              categorias={categorias}
              onSelecionar={lancarConsumo}
              desabilitado={!selecionado}
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:sticky lg:top-6">
        <ResumoPendente funcionario={selecionado} onQuitado={aoQuitar} />
      </div>
    </div>
  )
}
