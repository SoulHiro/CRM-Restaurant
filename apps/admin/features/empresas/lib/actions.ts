'use server'

import { revalidatePath } from 'next/cache'

import { createId } from '@paralleldrive/cuid2'
import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { ActionError, actionClient, authActionClient } from '@/lib/safe-action'
import { onlyDigits } from '@repo/ui/lib/masks'
import { colaborador_pedido, empresa, pedido_dia_importado } from '@repo/db'
import { eq } from 'drizzle-orm'
import {
  createEmpresaSchema,
  createFuncionarioSchema,
  createPausaSchema,
  deletePausaSchema,
  importarPedidosSchema,
  listarColaboradoresSchema,
  listarPedidosDoDiaSchema,
  obterImpressoraComandaSchema,
  updateFuncionarioSchema,
  updateFuncionarioStatusSchema,
} from './schemas'
import { getImpressoraComanda, getPedidosDoDia } from './queries'

export const createEmpresaAction = authActionClient
  .schema(createEmpresaSchema)
  .action(async ({ parsedInput }) => {
    const existente = await db.query.empresa.findFirst({
      where: (e, { eq }) => eq(e.cnpj, onlyDigits(parsedInput.cnpj)),
      columns: { id: true },
    })
    if (existente) {
      throw new ActionError('Já existe uma empresa cadastrada com esse CNPJ.')
    }

    const [criada] = await db
      .insert(empresa)
      .values({
        nome: parsedInput.nome.trim(),
        cnpj: onlyDigits(parsedInput.cnpj),
        responsavel_nome: parsedInput.responsavelNome?.trim() || null,
        email_contato: parsedInput.emailContato?.trim() || null,
        telefone_contato: parsedInput.telefoneContato?.trim() || null,
        cep: parsedInput.cep?.trim() || null,
        logradouro: parsedInput.logradouro?.trim() || null,
        numero: parsedInput.numero?.trim() || null,
        complemento: parsedInput.complemento?.trim() || null,
        bairro: parsedInput.bairro?.trim() || null,
        cidade: parsedInput.cidade?.trim() || null,
        uf: parsedInput.uf?.trim() || null,
        status: parsedInput.status,
      })
      .returning({ id: empresa.id })

    if (!criada) throw new ActionError('Não foi possível cadastrar a empresa')

    revalidatePath('/empresas')
    return { empresaId: criada.id }
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

export const obterImpressoraComandaAction = authActionClient
  .schema(obterImpressoraComandaSchema)
  .action(async () => {
    const impressora = await getImpressoraComanda()
    return { impressora }
  })

export const listarPedidosDoDiaAction = authActionClient
  .schema(listarPedidosDoDiaSchema)
  .action(async ({ parsedInput }) => {
    const pedidos = await getPedidosDoDia(
      parsedInput.empresaId,
      parsedInput.data
    )
    return { pedidos }
  })

export const listarColaboradoresAction = authActionClient
  .schema(listarColaboradoresSchema)
  .action(async ({ parsedInput }) => {
    const colaboradores = await db.query.colaborador_pedido.findMany({
      where: (c, { and: andOp, eq: eqOp }) =>
        andOp(eqOp(c.empresa_id, parsedInput.empresaId), eqOp(c.ativo, true)),
      columns: { id: true, nome: true },
      orderBy: (c, { asc }) => [asc(c.nome)],
    })

    return { colaboradores }
  })

/**
 * Upsert em duas tabelas por lote: colaborador novo entra com um id gerado
 * na hora (`createId()`), porque o `db.batch` do neon-http não deixa um
 * statement ler o resultado do anterior — sem isso não daria pra referenciar
 * o colaborador recém-criado no mesmo lote.
 */
export const importarPedidosAction = authActionClient
  .schema(importarPedidosSchema)
  .action(async ({ parsedInput }) => {
    const empresaExiste = await db.query.empresa.findFirst({
      where: eq(empresa.id, parsedInput.empresaId),
      columns: { id: true },
    })
    if (!empresaExiste) {
      throw new ActionError('Empresa não encontrada.')
    }

    const idPorColaboradorNovo = new Map<
      string,
      { id: string; whatsapp: string | null }
    >()

    for (const item of parsedInput.itens) {
      if (item.colaboradorId) continue
      if (!idPorColaboradorNovo.has(item.nome)) {
        idPorColaboradorNovo.set(item.nome, {
          id: createId(),
          whatsapp: item.whatsapp,
        })
      }
    }

    const statements: Statement[] = []

    for (const [nome, info] of idPorColaboradorNovo) {
      statements.push(
        db.insert(colaborador_pedido).values({
          id: info.id,
          empresa_id: parsedInput.empresaId,
          nome,
          whatsapp: info.whatsapp,
        })
      )
    }

    for (const item of parsedInput.itens) {
      const colaboradorId =
        item.colaboradorId ?? idPorColaboradorNovo.get(item.nome)?.id

      if (!colaboradorId) {
        throw new ActionError(
          `Não foi possível resolver o colaborador "${item.nome}".`
        )
      }

      statements.push(
        db
          .insert(pedido_dia_importado)
          .values({
            colaborador_id: colaboradorId,
            data: item.data,
            turno: item.turno,
            tamanho: item.tamanho,
            prato: item.prato,
            observacao: item.observacao,
            arquivo_origem: parsedInput.arquivoOrigem,
            respondido_em: item.respondidoEm ? new Date(item.respondidoEm) : null,
          })
          .onConflictDoUpdate({
            target: [
              pedido_dia_importado.colaborador_id,
              pedido_dia_importado.data,
            ],
            set: {
              turno: item.turno,
              tamanho: item.tamanho,
              prato: item.prato,
              observacao: item.observacao,
              arquivo_origem: parsedInput.arquivoOrigem,
              respondido_em: item.respondidoEm
                ? new Date(item.respondidoEm)
                : null,
              importado_em: new Date(),
            },
          })
      )
    }

    await executarLote(statements)

    revalidatePath(`/empresas/${parsedInput.empresaId}`)

    return {
      colaboradoresNovos: idPorColaboradorNovo.size,
      diasImportados: parsedInput.itens.length,
    }
  })
