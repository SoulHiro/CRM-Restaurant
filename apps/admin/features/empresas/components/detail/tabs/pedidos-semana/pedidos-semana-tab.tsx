'use client'

import { useState } from 'react'

import { EmptyState } from '@repo/ui/components/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'

import {
  flattenPedidosSemana,
  getDiasDisponiveis,
  getHojeISO,
  type PedidoSemanaRow,
} from '../../../../lib/pedidos-semana-helpers'
import { printPedidosFuncionarios } from '../../../../lib/print-pedidos'
import type { EmpresaFuncionario } from '../../../../lib/types'
import { PedidoSemanaRowItem } from './pedido-semana-row'
import { PedidosSemanaDias } from './pedidos-semana-dias'
import { PedidosSemanaToolbar } from './pedidos-semana-toolbar'

function rowKey(row: PedidoSemanaRow) {
  return `${row.funcionarioId}-${row.pedido.dia}`
}

export function PedidosSemanaTab({
  empresaNome,
  funcionarios,
}: {
  empresaNome: string
  funcionarios: EmpresaFuncionario[]
}) {
  const [rows, setRows] = useState<PedidoSemanaRow[]>(() =>
    flattenPedidosSemana(funcionarios)
  )

  const hoje = getHojeISO()
  const diasDisponiveis = getDiasDisponiveis(rows)
  const diaPadrao = diasDisponiveis.some((d) => d.dia === hoje)
    ? hoje
    : (diasDisponiveis[0]?.dia ?? null)

  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(diaPadrao)
  const [turnoSelecionado, setTurnoSelecionado] = useState('todos')

  if (rows.length === 0) {
    return <EmptyState message="Nenhum pedido registrado essa semana." />
  }

  function markAsImpresso(ids: Set<string>) {
    setRows((prev) =>
      prev.map((row) =>
        ids.has(rowKey(row))
          ? {
              ...row,
              pedido: { ...row.pedido, status: 'impresso', motivoErro: null },
            }
          : row
      )
    )
  }

  function printBatch(target: PedidoSemanaRow[]) {
    if (target.length === 0) return
    printPedidosFuncionarios(
      target.map((row) => ({
        nome: row.funcionarioNome,
        setor: row.setor,
        turno: row.turno,
        pedido: row.pedido,
      })),
      empresaNome
    )
    markAsImpresso(new Set(target.map(rowKey)))
  }

  const diaRows = diaSelecionado
    ? rows.filter((row) => row.pedido.dia === diaSelecionado)
    : rows

  const turnosDisponiveis = Array.from(
    new Set(diaRows.map((row) => row.turno))
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const diaRowsFiltradas =
    turnoSelecionado === 'todos'
      ? diaRows
      : diaRows.filter((row) => row.turno === turnoSelecionado)

  const pendentesOuErro = diaRowsFiltradas.filter(
    (row) => row.pedido.status !== 'impresso'
  )
  const jaImprimiuAlgum = diaRowsFiltradas.some(
    (row) => row.pedido.status === 'impresso'
  )
  const diaSemanaLabel =
    diasDisponiveis.find((d) => d.dia === diaSelecionado)?.diaSemanaLabel ??
    null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <PedidosSemanaDias
          dias={diasDisponiveis}
          selecionado={diaSelecionado}
          hoje={hoje}
          onSelect={(dia) => {
            setDiaSelecionado(dia)
            setTurnoSelecionado('todos')
          }}
        />

        <Select value={turnoSelecionado} onValueChange={setTurnoSelecionado}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os turnos</SelectItem>
            {turnosDisponiveis.map((turno) => (
              <SelectItem key={turno} value={turno}>
                {turno}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PedidosSemanaToolbar
        diaSemanaLabel={diaSemanaLabel}
        total={diaRowsFiltradas.length}
        restantes={pendentesOuErro.length}
        jaImprimiuAlgum={jaImprimiuAlgum}
        onPrintAll={() =>
          printBatch(jaImprimiuAlgum ? pendentesOuErro : diaRowsFiltradas)
        }
      />

      {diaRowsFiltradas.length === 0 ? (
        <EmptyState message="Nenhum pedido registrado nesse dia." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Prato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {diaRowsFiltradas.map((row) => (
              <PedidoSemanaRowItem
                key={rowKey(row)}
                row={row}
                onPrint={() => printBatch([row])}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
