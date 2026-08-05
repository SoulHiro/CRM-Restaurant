'use server'

import { actionClient } from '@/lib/safe-action'
import { createEmpresaSchema } from './schemas'

// Convenção para a futura `createPausaAction` (aba Pausas, botão "Nova
// pausa" ainda não-funcional): actionClient.schema(createPausaSchema).action(...)

export const createEmpresaAction = actionClient
  .schema(createEmpresaSchema)
  .action(async ({ parsedInput }) => {
    // TODO(db): substituir por `await db.insert(empresa).values(...)` quando as
    // migrations de empresa/empresa_contrato/empresa_pausa_dia estiverem prontas.
    void parsedInput
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { empresaId: crypto.randomUUID() }
  })
