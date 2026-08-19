'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Printer, Scale, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Skeleton } from '@repo/ui/components/skeleton'

import { hojeISO } from '@/lib/formatters'
import {
  listarColaboradoresEmpresaAction,
  listarPedidosDoDiaAction,
  marcarPedidosImpressosAction,
} from '../../../../lib/actions'
import {
  agruparParaPesagem,
  formatarEndereco,
  ITENS_PESAGEM,
  ITENS_PESAGEM_SEMPRE_LIGADOS,
  montarResumoPesagemGrupo,
  type ItemPesagemChave,
} from '../../../../lib/pesagem-helpers'
import type { PesagemDadosPapel } from '../../../../lib/pesagem-pdf'
import type {
  ColaboradorEmpresaItem,
  EmpresaEndereco,
  EmpresaFluxoPedido,
  PedidoDoDiaItem,
} from '../../../../lib/types'
import {
  useImprimirComandas,
  type ComandaEntrada,
} from '../../../../hooks/use-imprimir-comandas'
import { useImprimirPesagem } from '../../../../hooks/use-imprimir-pesagem'
import { AdicionarPedidoManualDrawer } from './form/adicionar-pedido-manual-drawer'
import { ImportarPlanilhaDrawer } from './form/importar-planilha-drawer'
import { FinalizarDiaDrawer } from './finalizar-dia-drawer'
import { PedidoDiaRow } from './pedido-dia-row'
import { PedidosInsights } from './pedidos-insights'

type TurnoFiltro = 'todos' | 'almoco' | 'jantar'

function paraComanda(
  pedido: PedidoDoDiaItem,
  empresaNome: string
): ComandaEntrada {
  return {
    nome: pedido.nome,
    empresaNome,
    turno: pedido.turno,
    tamanho: pedido.tamanho,
    prato: pedido.prato,
    observacao: pedido.observacao,
    respondidoEm: pedido.respondidoEm,
  }
}

export function PedidosTab({
  empresaId,
  empresaNome,
  empresaEndereco,
  fluxoPedido,
  resumoMostraQuantidades,
}: {
  empresaId: string
  empresaNome: string
  empresaEndereco: EmpresaEndereco
  fluxoPedido: EmpresaFluxoPedido
  resumoMostraQuantidades: boolean
}) {
  const usaPesagem = fluxoPedido === 'pesagem'

  const [data, setData] = useState(hojeISO())
  const [pedidos, setPedidos] = useState<PedidoDoDiaItem[] | null>(null)
  const [colaboradores, setColaboradores] = useState<ColaboradorEmpresaItem[]>(
    []
  )
  const [busca, setBusca] = useState('')
  const [turnoFiltro, setTurnoFiltro] = useState<TurnoFiltro>('todos')
  const [popoverPesagemAberto, setPopoverPesagemAberto] = useState(false)
  const [itensExtras, setItensExtras] = useState<Set<ItemPesagemChave>>(
    new Set()
  )
  const [detalheLegumes, setDetalheLegumes] = useState('')
  const { imprimir, imprimindo } = useImprimirComandas()
  const { imprimirPesagem, imprimindo: imprimindoPesagem } =
    useImprimirPesagem()

  const { execute, isExecuting } = useAction(listarPedidosDoDiaAction, {
    onSuccess: ({ data: resultado }) => setPedidos(resultado?.pedidos ?? []),
    onError: () => {
      toast.error('Não foi possível carregar os pedidos do dia.')
      setPedidos([])
    },
  })

  const { execute: buscarColaboradores } = useAction(
    listarColaboradoresEmpresaAction,
    {
      onSuccess: ({ data: resultado }) =>
        setColaboradores(resultado?.colaboradores ?? []),
    }
  )

  useEffect(() => {
    execute({ empresaId, data })
    if (usaPesagem) buscarColaboradores({ empresaId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, data, usaPesagem])

  const colaboradoresSeparados = useMemo(
    () => new Set(colaboradores.filter((c) => c.separado).map((c) => c.id)),
    [colaboradores]
  )

  const gruposPesagem = useMemo(
    () => agruparParaPesagem(pedidos ?? [], colaboradoresSeparados),
    [pedidos, colaboradoresSeparados]
  )

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return (pedidos ?? []).filter((p) => {
      const bateNome = !termo || p.nome.toLowerCase().includes(termo)
      const bateTurno = turnoFiltro === 'todos' || p.turno === turnoFiltro
      return bateNome && bateTurno
    })
  }, [pedidos, busca, turnoFiltro])

  const { executeAsync: marcarImpressos } = useAction(
    marcarPedidosImpressosAction
  )

  async function imprimirEMarcar(pedidosParaImprimir: PedidoDoDiaItem[]) {
    const sucesso = await imprimir(
      pedidosParaImprimir.map((p) => paraComanda(p, empresaNome))
    )
    if (sucesso) {
      await marcarImpressos({
        colaboradorIds: pedidosParaImprimir.map((p) => p.colaboradorId),
        data,
      })
      execute({ empresaId, data })
    }
  }

  function paraPedidoIndividual(pedido: PedidoDoDiaItem) {
    return { nome: pedido.nome, prato: pedido.prato, tamanho: pedido.tamanho }
  }

  /**
   * Marca como impresso só quem está no bloco em lote (`grupoA`/`grupoB`) —
   * quem aparece na lista de "Pedidos individuais" do papel ainda precisa
   * da própria comanda impressa à parte (`imprimirEMarcar`); listar aqui é
   * só informativo pra cozinha, não substitui a comanda dessa pessoa.
   */
  async function imprimirPesagemEMarcar() {
    setPopoverPesagemAberto(false)
    const enderecoFormatado = formatarEndereco(empresaEndereco)
    const impressoEm = new Date().toISOString()
    const extras = [...itensExtras]

    const papeis: PesagemDadosPapel[] = []
    const colaboradorIds: string[] = []

    if (gruposPesagem.grupoA.length > 0 || gruposPesagem.individualA.length > 0) {
      const resumo = montarResumoPesagemGrupo(
        gruposPesagem.grupoA,
        extras,
        detalheLegumes
      )
      papeis.push({
        tituloGrupo: '1º Turno + Administrativo',
        empresaNome,
        empresaEndereco: enderecoFormatado,
        data,
        impressoEm,
        ...resumo,
        pedidosIndividuais: gruposPesagem.individualA
          .filter((p) => !p.recusou)
          .map(paraPedidoIndividual),
      })
      colaboradorIds.push(...gruposPesagem.grupoA.map((p) => p.colaboradorId))
    }

    if (gruposPesagem.grupoB.length > 0 || gruposPesagem.individualB.length > 0) {
      const resumo = montarResumoPesagemGrupo(
        gruposPesagem.grupoB,
        extras,
        detalheLegumes
      )
      papeis.push({
        tituloGrupo: '2º Turno',
        empresaNome,
        empresaEndereco: enderecoFormatado,
        data,
        impressoEm,
        ...resumo,
        pedidosIndividuais: gruposPesagem.individualB
          .filter((p) => !p.recusou)
          .map(paraPedidoIndividual),
      })
      colaboradorIds.push(...gruposPesagem.grupoB.map((p) => p.colaboradorId))
    }

    if (papeis.length === 0) {
      toast.info('Nenhum pedido em lote pra imprimir hoje.')
      return
    }

    const sucesso = await imprimirPesagem(papeis)
    if (sucesso && colaboradorIds.length > 0) {
      await marcarImpressos({ colaboradorIds, data })
      execute({ empresaId, data })
    }
  }

  function alternarItemExtra(chave: ItemPesagemChave) {
    setItensExtras((atual) => {
      const novo = new Set(atual)
      if (novo.has(chave)) novo.delete(chave)
      else novo.add(chave)
      return novo
    })
  }

  const itensOpcionais = ITENS_PESAGEM.filter(
    (item) => !ITENS_PESAGEM_SEMPRE_LIGADOS.includes(item.chave)
  )

  const comImprimivel = (
    usaPesagem ? gruposPesagem.individual : (pedidos ?? [])
  ).filter((p) => p.prato && !p.recusou)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={data}
            onChange={(event) => setData(event.target.value)}
            className="w-44"
          />
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar pessoa..."
              className="pl-8"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>
          <Select
            value={turnoFiltro}
            onValueChange={(v) => setTurnoFiltro(v as TurnoFiltro)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os turnos</SelectItem>
              <SelectItem value="almoco">Almoço</SelectItem>
              <SelectItem value="jantar">Jantar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {usaPesagem && (
            <Popover
              open={popoverPesagemAberto}
              onOpenChange={setPopoverPesagemAberto}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    imprimindoPesagem ||
                    (gruposPesagem.grupoA.length === 0 &&
                      gruposPesagem.grupoB.length === 0 &&
                      gruposPesagem.individualA.length === 0 &&
                      gruposPesagem.individualB.length === 0)
                  }
                >
                  <Scale className="size-4" />
                  Imprimir pesagem
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium">
                    O que mais tem no cardápio hoje?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Arroz e feijão sempre entram. Marque o resto que tem hoje.
                  </p>
                  <div className="flex flex-col gap-2">
                    {itensOpcionais.map((item) => (
                      <label
                        key={item.chave}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={itensExtras.has(item.chave)}
                          onCheckedChange={() => alternarItemExtra(item.chave)}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>

                  {itensExtras.has('legumes') && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Qual legume hoje?</Label>
                      <Input
                        value={detalheLegumes}
                        onChange={(e) => setDetalheLegumes(e.target.value)}
                        placeholder="Ex: Cenoura/Chuchu"
                      />
                    </div>
                  )}

                  <Button
                    size="sm"
                    disabled={imprimindoPesagem}
                    onClick={imprimirPesagemEMarcar}
                  >
                    {imprimindoPesagem ? 'Imprimindo...' : 'Gerar papéis'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={imprimindo || comImprimivel.length === 0}
            onClick={() => imprimirEMarcar(comImprimivel)}
          >
            <Printer className="size-4" />
            Imprimir todos ({comImprimivel.length})
          </Button>
          <AdicionarPedidoManualDrawer
            empresaId={empresaId}
            data={data}
            onAdicionado={() => execute({ empresaId, data })}
          />
          <ImportarPlanilhaDrawer empresaId={empresaId} />
          <FinalizarDiaDrawer
            empresaId={empresaId}
            empresaNome={empresaNome}
            data={data}
            pedidos={pedidos ?? []}
            resumoMostraQuantidades={resumoMostraQuantidades}
            onFinalizado={() => execute({ empresaId, data })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:items-start">
        <PedidosInsights pedidos={pedidos ?? []} />

        <div className="flex flex-col gap-4">
          {isExecuting && !pedidos ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !pedidos || pedidos.length === 0 ? (
            <EmptyState
              message={`Nenhum colaborador importado para ${empresaNome} ainda.`}
            />
          ) : !pedidosFiltrados || pedidosFiltrados.length === 0 ? (
            <EmptyState
              message={
                busca.trim()
                  ? `Nenhuma pessoa encontrada para "${busca}".`
                  : 'Nenhum pedido nesse turno.'
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {pedidosFiltrados.map((pedido) => (
                <PedidoDiaRow
                  key={pedido.colaboradorId}
                  pedido={pedido}
                  data={data}
                  onImprimir={() => imprimirEMarcar([pedido])}
                  onRemovido={() => execute({ empresaId, data })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
