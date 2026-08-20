'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Printer, Scale, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
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
  atualizarColaboradoresSeparadosAction,
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
  EmpresaPrecoModo,
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
  precoModo,
  pedeCafe,
  pedeLanche,
  pedeSuco,
}: {
  empresaId: string
  empresaNome: string
  empresaEndereco: EmpresaEndereco
  fluxoPedido: EmpresaFluxoPedido
  resumoMostraQuantidades: boolean
  precoModo: EmpresaPrecoModo
  pedeCafe: boolean
  pedeLanche: boolean
  pedeSuco: boolean
}) {
  const usaPesagem = fluxoPedido === 'pesagem'

  const [data, setData] = useState(hojeISO())
  const [pedidos, setPedidos] = useState<PedidoDoDiaItem[] | null>(null)
  const [colaboradores, setColaboradores] = useState<ColaboradorEmpresaItem[]>(
    []
  )
  const [busca, setBusca] = useState('')
  const [turnoFiltro, setTurnoFiltro] = useState<TurnoFiltro>('todos')
  const [drawerPesagemAberto, setDrawerPesagemAberto] = useState(false)
  const [itensExtras, setItensExtras] = useState<Set<ItemPesagemChave>>(
    new Set()
  )
  const [detalheLegumes, setDetalheLegumes] = useState('')
  const [selecaoIndividual, setSelecaoIndividual] = useState<Set<string>>(
    new Set()
  )
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

  /**
   * "Imprimir pesagem" só gera o Papel A (1º turno + administrativo) — o
   * 2º/3º turno não tem papel de pesagem próprio. `candidatosPapelA` é todo
   * mundo desse grupo, separado ou não: quem tá marcado como separado
   * aparece pré-marcado no drawer, mas continua editável ali na hora — não
   * dá pra pré-marcar antes porque a planilha é importada, não cadastrada
   * pessoa a pessoa.
   */
  const candidatosPapelA = useMemo(
    () => [...gruposPesagem.grupoA, ...gruposPesagem.individualA],
    [gruposPesagem]
  )

  function abrirDrawerPesagem() {
    setSelecaoIndividual(
      new Set(
        candidatosPapelA
          .filter((p) => colaboradoresSeparados.has(p.colaboradorId))
          .map((p) => p.colaboradorId)
      )
    )
    setDrawerPesagemAberto(true)
  }

  function alternarIndividual(colaboradorId: string) {
    setSelecaoIndividual((atual) => {
      const novo = new Set(atual)
      if (novo.has(colaboradorId)) novo.delete(colaboradorId)
      else novo.add(colaboradorId)
      return novo
    })
  }

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

  const { executeAsync: atualizarSeparados } = useAction(
    atualizarColaboradoresSeparadosAction
  )

  /**
   * Só gera o Papel A (1º turno + administrativo) — o 2º/3º turno não tem
   * papel de pesagem, por instrução explícita. Antes de montar o papel,
   * persiste qualquer mudança feita no drawer (quem entrou/saiu do lote
   * pra virar pedido individual) — só o que de fato mudou, pra não gerar
   * um lote de update à toa toda vez que abre e fecha sem mexer em nada.
   *
   * O total de arroz/feijão do papel é sempre todo mundo que efetivamente
   * almoça (`candidatosPapelA` inteiro, `!recusou`) — quem tá marcado como
   * "separado" continua contando na pesagem, só não aparece listado no
   * papel; a comanda individual dessa pessoa é impressa à parte (ver
   * "Imprimir todos"). Só quem recusou/não almoça fica fora da conta.
   */
  async function imprimirPesagemEMarcar() {
    const mudancas = candidatosPapelA
      .map((p) => ({
        colaboradorId: p.colaboradorId,
        separado: selecaoIndividual.has(p.colaboradorId),
      }))
      .filter((m) => m.separado !== colaboradoresSeparados.has(m.colaboradorId))

    if (mudancas.length > 0) {
      await atualizarSeparados({ atualizacoes: mudancas })
    }

    const grupoAFinal = candidatosPapelA.filter(
      (p) => !selecaoIndividual.has(p.colaboradorId)
    )

    if (candidatosPapelA.length === 0) {
      toast.info('Nenhum pedido do 1º turno/administrativo pra imprimir hoje.')
      return
    }

    const resumo = montarResumoPesagemGrupo(
      candidatosPapelA,
      [...itensExtras],
      detalheLegumes
    )
    const papel: PesagemDadosPapel = {
      tituloGrupo: '1º Turno + Administrativo',
      empresaNome,
      empresaEndereco: formatarEndereco(empresaEndereco),
      data,
      impressoEm: new Date().toISOString(),
      ...resumo,
    }

    const sucesso = await imprimirPesagem([papel])
    if (sucesso) {
      setDrawerPesagemAberto(false)
      if (grupoAFinal.length > 0) {
        await marcarImpressos({
          colaboradorIds: grupoAFinal.map((p) => p.colaboradorId),
          data,
        })
      }
      execute({ empresaId, data })
      if (mudancas.length > 0) buscarColaboradores({ empresaId })
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
            <Drawer
              direction="right"
              open={drawerPesagemAberto}
              handleOnly
              onOpenChange={(v) => {
                if (v) abrirDrawerPesagem()
                else setDrawerPesagemAberto(false)
              }}
            >
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={imprimindoPesagem || candidatosPapelA.length === 0}
                >
                  <Scale className="size-4" />
                  Imprimir pesagem
                </Button>
              </DrawerTrigger>
              <DrawerContent
                direction="right"
                variant="float"
                className="flex w-full flex-col gap-0 sm:max-w-md"
              >
                <DrawerHeader>
                  <DrawerTitle>Imprimir pesagem — 1º turno + administrativo</DrawerTitle>
                  <DrawerDescription>
                    Só esse papel imprime em lote. Marque quem sai do lote e
                    vai como pedido individual.
                  </DrawerDescription>
                </DrawerHeader>

                <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-6">
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium">
                      O que mais tem no cardápio hoje?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Arroz e feijão sempre entram. Marque o resto que tem
                      hoje.
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
                  </div>

                  <div className="flex flex-col gap-2 border-t pt-4">
                    <p className="text-sm font-medium">
                      Quem vai como pedido individual?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Desmarcado = entra no lote da pesagem. Marcado = vira
                      comanda avulsa (ex: marmita separada).
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {candidatosPapelA.map((pedido) => (
                        <label
                          key={pedido.colaboradorId}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={selecaoIndividual.has(pedido.colaboradorId)}
                            onCheckedChange={() =>
                              alternarIndividual(pedido.colaboradorId)
                            }
                          />
                          {pedido.nome}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <DrawerFooter className="flex-row justify-end gap-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setDrawerPesagemAberto(false)}
                    disabled={imprimindoPesagem}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    disabled={imprimindoPesagem}
                    onClick={imprimirPesagemEMarcar}
                  >
                    {imprimindoPesagem ? 'Imprimindo...' : 'Gerar papel'}
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
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
            precoModo={precoModo}
            pedeCafe={pedeCafe}
            pedeLanche={pedeLanche}
            pedeSuco={pedeSuco}
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
