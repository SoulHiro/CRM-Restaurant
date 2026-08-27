import { Palmtree, UserCheck, UserMinus, UserX, UtensilsCrossed } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { PersonAvatar } from '@repo/ui/components/person-avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip'
import { cn } from '@repo/ui/lib/utils'

import { formatDateBR } from '@/lib/formatters'
import type { ColaboradorEmpresaItem } from '../../../../lib/types'
import { AtivoInativoBadge } from '../../../shared/ativo-inativo-badge'

export function FuncionarioRow({
  colaborador,
  mostrarSeparado,
  onAlternarAtivo,
  onAlternarSeparado,
  onAlternarFerias,
  onMarcarVisitante,
}: {
  colaborador: ColaboradorEmpresaItem
  /** Só empresas com fluxo_pedido='pesagem' usam o toggle "marmita separada". */
  mostrarSeparado: boolean
  onAlternarAtivo: () => void
  onAlternarSeparado: () => void
  onAlternarFerias: () => void
  onMarcarVisitante: () => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg bg-card p-4 sm:flex-row sm:items-center sm:justify-between',
        !colaborador.ativo && 'opacity-60'
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar name={colaborador.nome} className="size-9 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{colaborador.nome}</span>
          <span className="truncate text-sm text-muted-foreground">
            {colaborador.whatsapp ?? 'Sem WhatsApp cadastrado'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">
            {colaborador.totalPedidos}{' '}
            {colaborador.totalPedidos === 1 ? 'pedido' : 'pedidos'}
          </span>
          <span className="text-xs text-muted-foreground">
            {colaborador.ultimoPedidoEm
              ? `Último em ${formatDateBR(colaborador.ultimoPedidoEm)}`
              : 'Nenhum pedido ainda'}
          </span>
        </div>

        {mostrarSeparado && colaborador.separado && (
          <Badge variant="secondary">Separado</Badge>
        )}

        {colaborador.emFerias && <Badge variant="secondary">De férias</Badge>}

        <AtivoInativoBadge active={colaborador.ativo} />

        {mostrarSeparado && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={
                    colaborador.separado
                      ? `Voltar ${colaborador.nome} pra pesagem em lote`
                      : `Marcar ${colaborador.nome} como marmita separada`
                  }
                  onClick={onAlternarSeparado}
                >
                  <UtensilsCrossed
                    className={cn(
                      'size-4',
                      colaborador.separado && 'text-primary'
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {colaborador.separado
                  ? 'Voltar pra pesagem em lote'
                  : 'Marcar como marmita separada'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  colaborador.emFerias
                    ? `Voltar ${colaborador.nome} das férias`
                    : `Marcar ${colaborador.nome} como de férias`
                }
                disabled={!colaborador.ativo}
                onClick={onAlternarFerias}
              >
                <Palmtree
                  className={cn('size-4', colaborador.emFerias && 'text-primary')}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {colaborador.emFerias ? 'Voltar das férias' : 'Marcar como de férias'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  colaborador.ativo
                    ? `Marcar ${colaborador.nome} como inativo`
                    : `Reativar ${colaborador.nome}`
                }
                onClick={onAlternarAtivo}
              >
                {colaborador.ativo ? (
                  <UserX className="size-4" />
                ) : (
                  <UserCheck className="size-4 text-primary" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {colaborador.ativo ? 'Marcar inativo' : 'Reativar'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Marcar ${colaborador.nome} como visitante`}
                  >
                    <UserMinus className="size-4" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>Não é funcionário (visitante)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Marcar como visitante?</AlertDialogTitle>
              <AlertDialogDescription>
                {colaborador.nome} sai da aba Funcionários e da conta de
                &ldquo;não respondeu&rdquo; da Visão geral — usado quando foi
                cadastrado por engano como funcionário, mas na verdade só
                comeu naquele dia. O histórico de pedidos continua intacto, e
                a pessoa continua disponível pra lançar um pedido avulso no
                futuro.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onMarcarVisitante}>
                Marcar como visitante
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
