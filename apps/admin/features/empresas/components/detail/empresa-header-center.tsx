import { maskCnpj } from '@repo/ui/lib/masks'

import type { EmpresaListItem } from '../../lib/types'

/**
 * Nome + CNPJ centralizados no header do sidebar inset — só texto, sem
 * fundo/borda, de propósito: é contexto de "onde eu estou", não uma ação.
 * As ações (link do formulário, contato) vivem em `EmpresaHeaderActions`,
 * do lado direito.
 */
export function EmpresaHeaderCenter({ empresa }: { empresa: EmpresaListItem }) {
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="whitespace-nowrap text-sm font-medium text-foreground/80">
        {empresa.nome}
      </span>
      {empresa.cnpj && (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {maskCnpj(empresa.cnpj)}
        </span>
      )}
    </div>
  )
}
