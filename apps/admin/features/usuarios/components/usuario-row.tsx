'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { KeyRound, LogIn, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { Role } from '@repo/auth'
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

import { formatDateBR } from '@/lib/formatters'
import { authClient } from '@/lib/auth-client'
import {
  atualizarUsuarioAction,
  redefinirSenhaAction,
  removerUsuarioAction,
} from '../lib/actions'
import { CARGOS_INTERNOS, ROLE_LABELS } from '../lib/roles'
import type { UsuarioItem } from '../lib/types'

export function UsuarioRow({
  usuario,
  souEu,
}: {
  usuario: UsuarioItem
  souEu: boolean
}) {
  const router = useRouter()

  const [editarAberto, setEditarAberto] = useState(false)
  const [nomeInput, setNomeInput] = useState(usuario.name)
  const [cargoInput, setCargoInput] = useState<Role>(usuario.role ?? 'caixa')

  const [senhaAberto, setSenhaAberto] = useState(false)
  const [senhaInput, setSenhaInput] = useState('')

  const [impersonando, setImpersonando] = useState(false)

  const { execute: salvarUsuario, isExecuting: salvandoUsuario } = useAction(
    atualizarUsuarioAction,
    {
      onSuccess: () => {
        toast.success('Usuário atualizado')
        setEditarAberto(false)
        router.refresh()
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Não foi possível atualizar'),
    }
  )

  const { execute: salvarSenha, isExecuting: salvandoSenha } = useAction(
    redefinirSenhaAction,
    {
      onSuccess: () => {
        toast.success('Senha redefinida')
        setSenhaAberto(false)
        setSenhaInput('')
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Não foi possível redefinir a senha'),
    }
  )

  const { execute: remover, isExecuting: removendo } = useAction(
    removerUsuarioAction,
    {
      onSuccess: () => {
        toast.success('Usuário removido')
        router.refresh()
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Não foi possível remover'),
    }
  )

  async function impersonar() {
    setImpersonando(true)
    try {
      await authClient.admin.impersonateUser({ userId: usuario.id })
      toast.success(`Entrando como ${usuario.name}...`)
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Não foi possível entrar na conta desse usuário')
    } finally {
      setImpersonando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">
          {usuario.name}
          {souEu && (
            <span className="ml-2 text-xs text-muted-foreground">(você)</span>
          )}
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {usuario.email}
        </span>
        <span className="text-xs text-muted-foreground">
          Criado em {formatDateBR(usuario.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-semibold">
          {usuario.role ? ROLE_LABELS[usuario.role] : '—'}
        </Badge>
        {usuario.banned && <Badge variant="destructive">Bloqueado</Badge>}

        <Popover
          open={editarAberto}
          onOpenChange={(open) => {
            setEditarAberto(open)
            if (open) {
              setNomeInput(usuario.name)
              setCargoInput(usuario.role ?? 'caixa')
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${usuario.name}`}
            >
              <Pencil className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Nome</Label>
                <Input
                  value={nomeInput}
                  onChange={(e) => setNomeInput(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Cargo</Label>
                <Select
                  value={cargoInput}
                  onValueChange={(v) => setCargoInput(v as Role)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGOS_INTERNOS.map((cargo) => (
                      <SelectItem key={cargo} value={cargo}>
                        {ROLE_LABELS[cargo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={salvandoUsuario || !nomeInput.trim()}
                  onClick={() =>
                    salvarUsuario({
                      userId: usuario.id,
                      name: nomeInput.trim(),
                      role: cargoInput,
                    })
                  }
                >
                  Salvar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover
          open={senhaAberto}
          onOpenChange={(open) => {
            setSenhaAberto(open)
            if (open) setSenhaInput('')
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Redefinir senha de ${usuario.name}`}
            >
              <KeyRound className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Nova senha</Label>
                <Input
                  type="password"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={salvandoSenha || senhaInput.length < 8}
                  onClick={() =>
                    salvarSenha({ userId: usuario.id, password: senhaInput })
                  }
                >
                  Redefinir
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {!souEu && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Entrar como ${usuario.name}`}
            disabled={impersonando}
            onClick={impersonar}
          >
            <LogIn className="size-4" />
          </Button>
        )}

        {!souEu && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remover ${usuario.name}`}
                disabled={removendo}
              >
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
                <AlertDialogDescription>
                  {usuario.name} não vai mais conseguir entrar no sistema. Essa
                  ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => remover({ userId: usuario.id })}
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
