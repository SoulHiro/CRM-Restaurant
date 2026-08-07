import Link from 'next/link'
import { CalendarClock, PackageX } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'

import { DIAS_ALERTA_VENCIMENTO } from '../../lib/estoque-helpers'
import type { AlertasEstoque } from '../../lib/types'
import { NivelEstoqueBadge } from '../shared/nivel-estoque-badge'
import { Quantidade } from '../shared/quantidade'

function AlertaVazio({ mensagem }: { mensagem: string }) {
  return (
    <p className="flex h-full items-center text-sm text-muted-foreground">
      {mensagem}
    </p>
  )
}

function rotuloPrazo(dias: number): string {
  if (dias < 0) return `venceu há ${Math.abs(dias)}d`
  if (dias === 0) return 'vence hoje'
  if (dias === 1) return 'vence amanhã'
  return `faltam ${dias}d`
}

export function AlertasEstoquePanel({ alertas }: { alertas: AlertasEstoque }) {
  const { estoqueBaixo, vencimentoProximo } = alertas

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="flex flex-col border-0">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Acabando</CardTitle>
            <CardDescription>
              Quantidade no ponto de reposição ou abaixo dele.
            </CardDescription>
          </div>
          <PackageX className="size-5 shrink-0 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          {estoqueBaixo.length === 0 ? (
            <AlertaVazio mensagem="Nada acabando por aqui." />
          ) : (
            <ul className="flex flex-col gap-2">
              {estoqueBaixo.slice(0, 6).map((alerta) => (
                <li key={alerta.itemId}>
                  <Link
                    href={`/estoque/${alerta.itemId}`}
                    className="flex items-center justify-between gap-4 rounded-lg bg-muted px-3 py-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {alerta.nome}
                      </span>
                      <NivelEstoqueBadge nivel={alerta.nivel} />
                    </span>
                    <span className="shrink-0 text-right text-sm">
                      <Quantidade
                        valor={alerta.quantidadeAtual}
                        unidade={alerta.unidade}
                        className="font-medium"
                      />
                      <span className="block text-xs text-muted-foreground">
                        repor em {alerta.pontoReposicao}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {estoqueBaixo.length > 6 && (
                <li className="px-3 pt-1 text-xs text-muted-foreground">
                  e mais {estoqueBaixo.length - 6}{' '}
                  {estoqueBaixo.length - 6 === 1 ? 'item' : 'itens'}
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="flex flex-col border-0">
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-base">Vencendo</CardTitle>
            <CardDescription>
              Perecível a {DIAS_ALERTA_VENCIMENTO} dias ou menos do prazo.
            </CardDescription>
          </div>
          <CalendarClock className="size-5 shrink-0 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          {vencimentoProximo.length === 0 ? (
            <AlertaVazio mensagem="Nenhum perecível perto do prazo." />
          ) : (
            <ul className="flex flex-col gap-2">
              {vencimentoProximo.slice(0, 6).map((alerta) => (
                <li key={alerta.itemId}>
                  <Link
                    href={`/estoque/${alerta.itemId}`}
                    className="flex items-center justify-between gap-4 rounded-lg bg-muted px-3 py-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {alerta.nome}
                      </span>
                      <span
                        className={
                          alerta.diasRestantes < 0
                            ? 'text-xs font-medium text-destructive'
                            : 'text-xs font-medium text-amber-600 dark:text-amber-400'
                        }
                      >
                        {rotuloPrazo(alerta.diasRestantes)}
                      </span>
                    </span>
                    <Quantidade
                      valor={alerta.quantidadeAtual}
                      unidade={alerta.unidade}
                      className="shrink-0 text-sm font-medium"
                    />
                  </Link>
                </li>
              ))}
              {vencimentoProximo.length > 6 && (
                <li className="px-3 pt-1 text-xs text-muted-foreground">
                  e mais {vencimentoProximo.length - 6}{' '}
                  {vencimentoProximo.length - 6 === 1 ? 'item' : 'itens'}
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
