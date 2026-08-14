import { RhTabs } from '@/features/rh/components/rh-tabs'
import { competenciaDe } from '@/features/rh/lib/folha-helpers'
import {
  getCargos,
  getFolhaDaCompetencia,
  getFolhasFechadas,
  getFuncionarios,
  getPreviaFolha,
} from '@/features/rh/lib/queries'
import type { TurnoTrabalho } from '@/features/rh/lib/types'
import { hojeISO } from '@/lib/formatters'

function texto(valor: string | string[] | undefined): string {
  return typeof valor === 'string' ? valor : ''
}

function parseStatus(
  valor: string | string[] | undefined
): 'ativo' | 'desligado' | 'todos' {
  return valor === 'desligado' || valor === 'todos' ? valor : 'ativo'
}

function parseTurno(
  valor: string | string[] | undefined
): TurnoTrabalho | 'todos' {
  return valor === 'dia' || valor === 'noite' || valor === 'ambos'
    ? valor
    : 'todos'
}

function parseCompetencia(
  valor: string | string[] | undefined,
  padrao: string
): string {
  return typeof valor === 'string' && /^\d{4}-\d{2}$/.test(valor)
    ? valor
    : padrao
}

/** Sábado por padrão — é quando o entregador costuma receber. */
function parseDiaPagamento(valor: string | string[] | undefined): number {
  const dia = typeof valor === 'string' ? Number(valor) : NaN
  return Number.isInteger(dia) && dia >= 0 && dia <= 6 ? dia : 6
}

export default async function FuncionariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const hoje = hojeISO()
  const competencia = parseCompetencia(params.competencia, competenciaDe(hoje))

  const [funcionarios, cargos, previa, fechada, historico] = await Promise.all([
    getFuncionarios(),
    getCargos(),
    getPreviaFolha(competencia, parseDiaPagamento(params.pagamento)),
    getFolhaDaCompetencia(competencia),
    getFolhasFechadas(),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Funcionários</h1>
        <p className="text-sm text-muted-foreground">
          Quem trabalha aqui, quanto ganha, quem faltou — e a folha do mês
          virando conta a pagar sozinha.
        </p>
      </div>

      <RhTabs
        funcionarios={funcionarios}
        cargos={cargos}
        competencia={competencia}
        previa={previa}
        fechada={fechada}
        historico={historico.filter((f) => f.competencia !== competencia)}
        filtros={{
          busca: texto(params.busca),
          cargoId: texto(params.cargo),
          status: parseStatus(params.status),
          turno: parseTurno(params.turno),
        }}
        hoje={hoje}
      />
    </div>
  )
}
