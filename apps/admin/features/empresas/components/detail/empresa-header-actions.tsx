'use client'

import { Copy, ExternalLink, MessageCircle, Store } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog'
import { PersonAvatar } from '@repo/ui/components/person-avatar'
import { onlyDigits } from '@repo/ui/lib/masks'

import { urlFormularioPublico } from '@/lib/urls'
import type { EmpresaListItem } from '../../lib/types'

/**
 * Só ícones no header, sem chip/borda ao redor — o avatar abre um modal
 * central com o link do formulário (em vez do dropdown que tinha antes),
 * separado do ícone de contato direto com o responsável, que é uma ação
 * diferente (falar com a pessoa, não compartilhar o link).
 */
export function EmpresaHeaderActions({
  empresa,
}: {
  empresa: EmpresaListItem
}) {
  async function copiarLink() {
    if (!empresa.slug) return
    await navigator.clipboard.writeText(urlFormularioPublico(empresa.slug))
    toast.success('Link copiado')
  }

  const linkContatoResponsavel = empresa.responsavelTelefone
    ? `https://wa.me/55${onlyDigits(empresa.responsavelTelefone)}`
    : null

  const linkEnviarFormulario = empresa.slug
    ? `https://wa.me/?text=${encodeURIComponent(
        `Cardápio da semana da ${empresa.nome}: ${urlFormularioPublico(empresa.slug)}`
      )}`
    : null

  return (
    <div className="flex items-center gap-1">
      {linkContatoResponsavel && (
        <Button variant="ghost" size="icon" asChild>
          <a
            href={linkContatoResponsavel}
            target="_blank"
            rel="noreferrer"
            aria-label="Entrar em contato com o responsável pelo WhatsApp"
          >
            <MessageCircle className="size-4" />
          </a>
        </Button>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label={`Link do formulário de ${empresa.nome}`}
            className="cursor-pointer rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <PersonAvatar name={empresa.nome} className="size-8" />
          </button>
        </DialogTrigger>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
          <div className="flex h-28 items-center justify-center bg-accent">
            <Store className="size-10 text-foreground/70" />
          </div>

          <div className="flex flex-col gap-4 p-6">
            <DialogHeader className="items-center gap-1 text-center sm:text-center">
              <DialogTitle>Link do formulário</DialogTitle>
              <DialogDescription>
                {empresa.nome} — é por aqui que os funcionários respondem o
                cardápio da semana.
              </DialogDescription>
            </DialogHeader>

            {empresa.slug ? (
              <>
                <p className="truncate rounded-md border border-input bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
                  {urlFormularioPublico(empresa.slug)}
                </p>

                <div className="flex gap-2">
                  {linkEnviarFormulario && (
                    <Button className="flex-1" asChild>
                      <a
                        href={linkEnviarFormulario}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="size-4" />
                        Enviar link
                      </a>
                    </Button>
                  )}
                  <Button
                    variant={linkEnviarFormulario ? 'outline' : 'default'}
                    className="flex-1"
                    onClick={copiarLink}
                  >
                    <Copy className="size-4" />
                    Copiar
                  </Button>
                </div>

                <a
                  href={urlFormularioPublico(empresa.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  Abrir formulário
                </a>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Sem link configurado — cadastre em Configurações → Link do
                formulário.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
