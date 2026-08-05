'use server'

import { actionClient } from '@/lib/safe-action'
import {
  createEmpresaSchema,
  createFuncionarioSchema,
  createPausaSchema,
  deletePausaSchema,
  updateFuncionarioSchema,
  updateFuncionarioStatusSchema,
} from './schemas'

export const createEmpresaAction = actionClient
  .schema(createEmpresaSchema)
  .action(async ({ parsedInput }) => {
    // TODO(db): substituir por `await db.insert(empresa).values(...)` quando as
    // migrations de empresa/empresa_contrato/empresa_pausa_dia estiverem prontas.
    void parsedInput
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { empresaId: crypto.randomUUID() }
  })

export const createFuncionarioAction = actionClient
  .schema(createFuncionarioSchema)
  .action(async ({ parsedInput }) => {
    // TODO(db): substituir por insert real em funcionario/funcionario_empresa,
    // vinculando via setor → turno → empresa quando as migrations estiverem prontas.
    void parsedInput
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { funcionarioId: crypto.randomUUID() }
  })

export const updateFuncionarioAction = actionClient
  .schema(updateFuncionarioSchema)
  .action(async ({ parsedInput }) => {
    // TODO(db): substituir por `await db.update(funcionario)...` quando as
    // migrations estiverem prontas.
    void parsedInput
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { funcionarioId: parsedInput.id }
  })

export const updateFuncionarioStatusAction = actionClient
  .schema(updateFuncionarioStatusSchema)
  .action(async ({ parsedInput }) => {
    // TODO(db): substituir por update do vínculo funcionario_empresa quando
    // as migrations estiverem prontas.
    void parsedInput
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { funcionarioId: parsedInput.id }
  })

export const createPausaAction = actionClient
  .schema(createPausaSchema)
  .action(async ({ parsedInput }) => {
    // TODO(db): substituir por `await db.insert(empresaPausaDia).values(...)`
    // quando as migrations estiverem prontas.
    void parsedInput
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { pausaId: crypto.randomUUID() }
  })

export const deletePausaAction = actionClient
  .schema(deletePausaSchema)
  .action(async ({ parsedInput }) => {
    // TODO(db): substituir por `await db.delete(empresaPausaDia)...` quando
    // as migrations estiverem prontas.
    void parsedInput
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { pausaId: parsedInput.id }
  })
