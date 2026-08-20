'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import type { Role } from '@repo/auth'
import { Button } from '@repo/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { criarUsuarioAction } from '../lib/actions'
import { CARGOS_INTERNOS, ROLE_LABELS } from '../lib/roles'

export function CriarUsuarioDrawer() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('caixa')

  const { execute, isExecuting } = useAction(criarUsuarioAction, {
    onSuccess: () => {
      toast.success('Usuário criado')
      setOpen(false)
      setName('')
      setEmail('')
      setPassword('')
      setRole('caixa')
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível criar o usuário')
    },
  })

  function confirmar() {
    if (!name.trim() || !email.trim() || password.length < 8) return
    execute({ name: name.trim(), email: email.trim(), password, role })
  }

  return (
    <Drawer direction="right" open={open} handleOnly onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Novo usuário
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 sm:max-w-md"
      >
        <DrawerHeader>
          <DrawerTitle>Novo usuário</DrawerTitle>
          <DrawerDescription>
            O cargo já define automaticamente o que essa pessoa consegue ver no
            sistema.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Cargo</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
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
        </div>

        <DrawerFooter className="flex-row justify-end gap-2 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExecuting}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            disabled={
              isExecuting ||
              !name.trim() ||
              !email.trim() ||
              password.length < 8
            }
          >
            {isExecuting ? 'Criando...' : 'Criar usuário'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
