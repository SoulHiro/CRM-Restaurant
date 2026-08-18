'use server'

import { revalidatePath } from 'next/cache'

import { createId } from '@paralleldrive/cuid2'
import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { ActionError, actionClient, authActionClient } from '@/lib/safe-action'
import { onlyDigits } from '@repo/ui/lib/masks'
import {
  colaborador_pedido,
  empresa,
  empresa_preco_padrao,
  fechamento_dia_empresa,
  fechamento_dia_item,
  pedido_dia_importado,
} from '@repo/db'
import { and, eq } from 'drizzle-orm'
import {
  createEmpresaSchema,
  createFuncionarioSchema,
  createPausaSchema,
  deletePausaSchema,
  finalizarDiaSchema,
  importarPedidosSchema,
  listarColaboradoresSchema,
  listarFechamentosSchema,
  listarPedidosDoDiaSchema,
  obterFechamentoDoDiaSchema,
  obterImpressoraComandaSchema,
  obterPrecosEmpresaSchema,
  reabrirDiaSchema,
  removerPedidoSchema,
  salvarPrecosEmpresaSchema,
  updateFuncionarioSchema,
  updateFuncionarioStatusSchema,
} from './schemas'
import {
  getContagemTamanhos,
  getFechamentoDoDia,
  getImpressoraComanda,
  getPedidosDoDia,
  getPrecosEmpresa,
  listarFechamentosDaEmpresa,
} from './queries'
import { toMoneyString } from '@/lib/numeric'

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
            tipo: item.tipo,
            turno: item.turno,
            tamanho: item.tamanho,
            prato: item.prato,
            preco: item.preco != null ? toMoneyString(item.preco) : null,
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
              tipo: item.tipo,
              turno: item.turno,
              tamanho: item.tamanho,
              prato: item.prato,
              preco: item.preco != null ? toMoneyString(item.preco) : null,
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

export const obterFechamentoDoDiaAction = authActionClient
  .schema(obterFechamentoDoDiaSchema)
  .action(async ({ parsedInput }) => {
    const fechamento = await getFechamentoDoDia(
      parsedInput.empresaId,
      parsedInput.data
    )
    return { fechamento }
  })

/**
 * P/M/G/lanche nunca vêm do cliente — são recalculados aqui, na hora, a
 * partir dos pedidos reais daquele dia. Preço por tamanho de marmita e de
 * café/suco são o que o usuário informa no "Finalizar dia"; lanche já traz
 * o próprio preço travado desde quando foi lançado manualmente (ver
 * `pedido_dia_importado.preco`). Cada marmita e cada lanche viram uma linha
 * em `fechamento_dia_item` — nome, prato/lanche e tamanho gravados como
 * snapshot, para o histórico e uma eventual reimpressão sobreviverem à
 * limpeza de `pedido_dia_importado`/`colaborador_pedido`.
 */
export const finalizarDiaAction = authActionClient
  .schema(finalizarDiaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const jaFechado = await getFechamentoDoDia(
      parsedInput.empresaId,
      parsedInput.data
    )
    if (jaFechado) {
      throw new ActionError('Esse dia já foi finalizado para essa empresa.')
    }

    const [contagem, pedidos] = await Promise.all([
      getContagemTamanhos(parsedInput.empresaId, parsedInput.data),
      getPedidosDoDia(parsedInput.empresaId, parsedInput.data),
    ])

    const precoPorTamanho: Record<'P' | 'M' | 'G', number> = {
      P: parsedInput.precoUnitarioP,
      M: parsedInput.precoUnitarioM,
      G: parsedInput.precoUnitarioG,
    }

    const [criado] = await db
      .insert(fechamento_dia_empresa)
      .values({
        empresa_id: parsedInput.empresaId,
        data: parsedInput.data,
        quantidade_p: contagem.p,
        preco_unitario_p: toMoneyString(parsedInput.precoUnitarioP),
        quantidade_m: contagem.m,
        preco_unitario_m: toMoneyString(parsedInput.precoUnitarioM),
        quantidade_g: contagem.g,
        preco_unitario_g: toMoneyString(parsedInput.precoUnitarioG),
        quantidade_cafe: parsedInput.quantidadeCafe,
        preco_unitario_cafe: toMoneyString(parsedInput.precoUnitarioCafe),
        quantidade_suco: parsedInput.quantidadeSuco,
        preco_unitario_suco: toMoneyString(parsedInput.precoUnitarioSuco),
        quantidade_lanche: contagem.lanche,
        finalizado_por: ctx.user.name,
      })
      .returning({ id: fechamento_dia_empresa.id })

    if (!criado) throw new ActionError('Não foi possível finalizar o dia')

    const itensMarmita = pedidos.filter(
      (p): p is typeof p & { tamanho: 'P' | 'M' | 'G' } =>
        p.tipo === 'marmita' && p.tamanho != null && !p.recusou
    )
    const itensLanche = pedidos.filter((p) => p.tipo === 'lanche' && !p.recusou)

    const linhas = [
      ...itensMarmita.map((item) => ({
        fechamento_id: criado.id,
        colaborador_nome: item.nome,
        tipo: 'marmita' as const,
        prato: item.prato,
        tamanho: item.tamanho,
        preco: toMoneyString(precoPorTamanho[item.tamanho]),
      })),
      ...itensLanche.map((item) => ({
        fechamento_id: criado.id,
        colaborador_nome: item.nome,
        tipo: 'lanche' as const,
        prato: item.prato,
        tamanho: null,
        preco: toMoneyString(item.preco ?? 0),
      })),
    ]

    if (linhas.length > 0) {
      await db.insert(fechamento_dia_item).values(linhas)
    }

    revalidatePath(`/empresas/${parsedInput.empresaId}`)

    return {
      quantidadeP: contagem.p,
      quantidadeM: contagem.m,
      quantidadeG: contagem.g,
    }
  })

/**
 * Apaga o fechamento — não edita. Se errou algo, refaz do zero: reabre,
 * ajusta os pedidos (adiciona/remove), finaliza de novo. Nunca deixa dois
 * fechamentos pro mesmo dia (a UNIQUE de `fechamento_dia_empresa` já
 * garantiria isso mesmo sem essa checagem, mas a mensagem fica melhor aqui).
 */
export const reabrirDiaAction = authActionClient
  .schema(reabrirDiaSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(fechamento_dia_empresa)
      .where(
        and(
          eq(fechamento_dia_empresa.empresa_id, parsedInput.empresaId),
          eq(fechamento_dia_empresa.data, parsedInput.data)
        )
      )

    revalidatePath(`/empresas/${parsedInput.empresaId}`)
  })

export const listarFechamentosAction = authActionClient
  .schema(listarFechamentosSchema)
  .action(async ({ parsedInput }) => {
    const fechamentos = await listarFechamentosDaEmpresa(parsedInput.empresaId)
    return { fechamentos }
  })

export const removerPedidoAction = authActionClient
  .schema(removerPedidoSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(pedido_dia_importado)
      .where(
        and(
          eq(pedido_dia_importado.colaborador_id, parsedInput.colaboradorId),
          eq(pedido_dia_importado.data, parsedInput.data)
        )
      )

    revalidatePath('/empresas')
  })

export const obterPrecosEmpresaAction = authActionClient
  .schema(obterPrecosEmpresaSchema)
  .action(async ({ parsedInput }) => {
    const precos = await getPrecosEmpresa(parsedInput.empresaId)
    return { precos }
  })

export const salvarPrecosEmpresaAction = authActionClient
  .schema(salvarPrecosEmpresaSchema)
  .action(async ({ parsedInput }) => {
    const statements: Statement[] = parsedInput.itens.map((item) =>
      db
        .insert(empresa_preco_padrao)
        .values({
          empresa_id: parsedInput.empresaId,
          tipo: item.tipo,
          nome: item.nome.trim(),
          preco: toMoneyString(item.preco),
        })
        .onConflictDoUpdate({
          target: [empresa_preco_padrao.empresa_id, empresa_preco_padrao.tipo],
          set: { nome: item.nome.trim(), preco: toMoneyString(item.preco) },
        })
    )

    await executarLote(statements)

    revalidatePath(`/empresas/${parsedInput.empresaId}`)

    return { itens: parsedInput.itens }
  })
