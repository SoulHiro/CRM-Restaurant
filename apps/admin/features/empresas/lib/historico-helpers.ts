import type { EmpresaFuncionario, EmpresaFuncionarioPedido } from './types'

export interface PedidoSemanaRow {
  funcionarioId: string
  funcionarioNome: string
  setor: string
  turno: string
  pedido: EmpresaFuncionarioPedido
}

export function getHojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// Fim (domingo) da semana atual — o formulário do funcionário é respondido
// no início da semana e vale pra ela inteira, nunca pra semana seguinte, então
// o filtro de histórico não deve deixar selecionar datas além desse limite.
export function getFimSemanaAtualISO(): string {
  const hoje = new Date()
  const diaSemana = hoje.getDay()
  const diasAteDomingo = diaSemana === 0 ? 0 : 7 - diaSemana
  hoje.setDate(hoje.getDate() + diasAteDomingo)
  return hoje.toISOString().slice(0, 10)
}

export interface SemanaAgrupada {
  semanaLabel: string
  inicioSemana: string
  rows: PedidoSemanaRow[]
}

export function flattenHistoricoSemanas(
  funcionarios: EmpresaFuncionario[]
): SemanaAgrupada[] {
  const porSemana = new Map<string, SemanaAgrupada>()

  for (const funcionario of funcionarios) {
    for (const semana of funcionario.historicoSemanas) {
      const bucket = porSemana.get(semana.semanaLabel) ?? {
        semanaLabel: semana.semanaLabel,
        inicioSemana: semana.inicioSemana,
        rows: [],
      }

      for (const pedido of semana.pedidos) {
        if (!pedido.prato) continue
        bucket.rows.push({
          funcionarioId: funcionario.id,
          funcionarioNome: funcionario.nome,
          setor: funcionario.setor,
          turno: funcionario.turno,
          pedido,
        })
      }

      porSemana.set(semana.semanaLabel, bucket)
    }
  }

  return Array.from(porSemana.values())
    .map((semana) => ({
      ...semana,
      rows: [...semana.rows].sort((a, b) => {
        const porDia = a.pedido.dia.localeCompare(b.pedido.dia)
        if (porDia !== 0) return porDia
        return (a.pedido.prato ?? '').localeCompare(
          b.pedido.prato ?? '',
          'pt-BR'
        )
      }),
    }))
    .sort((a, b) => b.inicioSemana.localeCompare(a.inicioSemana))
}

export interface HistoricoFilters {
  q: string
  from: string | null
  to: string | null
}

export function filterHistorico(
  semanas: SemanaAgrupada[],
  filters: HistoricoFilters
): SemanaAgrupada[] {
  const query = filters.q.trim().toLowerCase()

  return semanas
    .map((semana) => ({
      ...semana,
      rows: semana.rows.filter((row) => {
        if (filters.from && row.pedido.dia < filters.from) return false
        if (filters.to && row.pedido.dia > filters.to) return false
        if (query && !row.funcionarioNome.toLowerCase().includes(query)) {
          return false
        }
        return true
      }),
    }))
    .filter((semana) => semana.rows.length > 0)
}
