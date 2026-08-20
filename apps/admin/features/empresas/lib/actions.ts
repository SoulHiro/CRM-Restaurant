'use server'

import { revalidatePath, updateTag } from 'next/cache'

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
import { and, eq, inArray } from 'drizzle-orm'
import { normalizar } from './importacao-helpers'
import {
  TAG_EMPRESAS_LISTA,
  tagEmpresa,
  tagEmpresaFechamentos,
  tagEmpresaPedidos,
  tagEmpresaPrecos,
} from './cache-tags'
import {
  atualizarColaboradorAtivoSchema,
  atualizarColaboradoresSeparadosSchema,
  atualizarColaboradorSeparadoSchema,
  atualizarConfiguracaoEmpresaSchema,
  atualizarPedidoSchema,
  atualizarPrecoPedidoSchema,
  createEmpresaSchema,
  createPausaSchema,
  deletePausaSchema,
  finalizarDiaSchema,
  importarPedidosSchema,
  listarColaboradoresEmpresaSchema,
  listarColaboradoresSchema,
  listarFaturamentoMensalSchema,
  listarFechamentosSchema,
  listarPedidosDoDiaSchema,
  marcarPedidosImpressosSchema,
  marcarRecusaSchema,
  obterFechamentoDoDiaSchema,
  obterImpressoraComandaSchema,
  obterImpressoraPesagemSchema,
  obterPrecosEmpresaSchema,
  reabrirDiaSchema,
  removerPedidoSchema,
  salvarPrecosEmpresaSchema,
} from './schemas'
import {
  getColaboradoresEmpresa,
  getContagemTamanhos,
  getFaturamentoMensal,
  getFechamentoDoDia,
  getImpressoraComanda,
  getImpressoraPesagem,
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
    updateTag(TAG_EMPRESAS_LISTA)
    return { empresaId: criada.id }
  })

/**
 * Aba "Configurações" da empresa — fluxo de pedido (padrão/pesagem), se o
 * resumo do dia mostra o bloco de quantidades, modo de preço da marmita
 * (por tamanho/único) e quais itens extras (café/lanche/suco) ela pede.
 * Tudo num único action porque os campos sempre são editados juntos, na
 * mesma tela.
 */
export const atualizarConfiguracaoEmpresaAction = authActionClient
  .schema(atualizarConfiguracaoEmpresaSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(empresa)
      .set({
        fluxo_pedido: parsedInput.fluxoPedido,
        resumo_mostra_quantidades: parsedInput.resumoMostraQuantidades,
        preco_modo: parsedInput.precoModo,
        pede_cafe: parsedInput.pedeCafe,
        pede_lanche: parsedInput.pedeLanche,
        pede_suco: parsedInput.pedeSuco,
      })
      .where(eq(empresa.id, parsedInput.empresaId))

    revalidatePath('/empresas')
    updateTag(TAG_EMPRESAS_LISTA)
    updateTag(tagEmpresa(parsedInput.empresaId))
  })

export const listarColaboradoresEmpresaAction = authActionClient
  .schema(listarColaboradoresEmpresaSchema)
  .action(async ({ parsedInput }) => {
    const colaboradores = await getColaboradoresEmpresa(parsedInput.empresaId)
    return { colaboradores }
  })

export const atualizarColaboradorAtivoAction = authActionClient
  .schema(atualizarColaboradorAtivoSchema)
  .action(async ({ parsedInput }) => {
    const [atualizado] = await db
      .update(colaborador_pedido)
      .set({ ativo: parsedInput.ativo })
      .where(eq(colaborador_pedido.id, parsedInput.colaboradorId))
      .returning({ empresa_id: colaborador_pedido.empresa_id })

    revalidatePath('/empresas')
    updateTag(TAG_EMPRESAS_LISTA)
    if (atualizado) updateTag(tagEmpresa(atualizado.empresa_id))
  })

/** "Marmita separada" — só relevante em empresas com fluxo_pedido='pesagem'. */
export const atualizarColaboradorSeparadoAction = authActionClient
  .schema(atualizarColaboradorSeparadoSchema)
  .action(async ({ parsedInput }) => {
    const [atualizado] = await db
      .update(colaborador_pedido)
      .set({ separado: parsedInput.separado })
      .where(eq(colaborador_pedido.id, parsedInput.colaboradorId))
      .returning({ empresa_id: colaborador_pedido.empresa_id })

    if (atualizado) updateTag(tagEmpresaPedidos(atualizado.empresa_id))
  })

/**
 * Igual à de cima, mas pra quando várias pessoas mudam de status de uma vez
 * (ex: o drawer de "Imprimir pesagem", onde o usuário marca quem sai do
 * lote na hora de imprimir) — um `executarLote` em vez de N chamadas
 * sequenciais.
 */
export const atualizarColaboradoresSeparadosAction = authActionClient
  .schema(atualizarColaboradoresSeparadosSchema)
  .action(async ({ parsedInput }) => {
    const statements: Statement[] = parsedInput.atualizacoes.map((item) =>
      db
        .update(colaborador_pedido)
        .set({ separado: item.separado })
        .where(eq(colaborador_pedido.id, item.colaboradorId))
    )

    await executarLote(statements)

    const empresaId = await empresaDoColaborador(
      parsedInput.atualizacoes[0]!.colaboradorId
    )
    if (empresaId) updateTag(tagEmpresaPedidos(empresaId))
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

export const obterImpressoraPesagemAction = authActionClient
  .schema(obterImpressoraPesagemSchema)
  .action(async () => {
    const impressora = await getImpressoraPesagem()
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
 *
 * Nunca cria um colaborador duplicado por causa de acento/maiúscula
 * diferente — todo `colaboradorId: null` é primeiro conferido contra os
 * nomes já cadastrados na empresa (via `normalizar`, mesma função que a
 * planilha usa pra sugerir vínculo) antes de gerar um id novo. Bate =
 * reaproveita o colaborador existente, silenciosamente.
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

    const colaboradoresExistentes = await db.query.colaborador_pedido.findMany({
      where: eq(colaborador_pedido.empresa_id, parsedInput.empresaId),
      columns: { id: true, nome: true },
    })
    const idPorNomeNormalizado = new Map(
      colaboradoresExistentes.map((c) => [normalizar(c.nome), c.id])
    )

    const idPorColaboradorNovo = new Map<
      string,
      {
        id: string
        nome: string
        whatsapp: string | null
        tipo: 'funcionario' | 'visitante'
      }
    >()

    for (const item of parsedInput.itens) {
      if (item.colaboradorId) continue
      const chave = normalizar(item.nome)
      if (idPorNomeNormalizado.has(chave)) continue
      if (!idPorColaboradorNovo.has(chave)) {
        idPorColaboradorNovo.set(chave, {
          id: createId(),
          nome: item.nome,
          whatsapp: item.whatsapp,
          tipo: item.colaboradorTipo,
        })
      }
    }

    const statements: Statement[] = []

    for (const info of idPorColaboradorNovo.values()) {
      statements.push(
        db.insert(colaborador_pedido).values({
          id: info.id,
          empresa_id: parsedInput.empresaId,
          nome: info.nome,
          whatsapp: info.whatsapp,
          tipo: info.tipo,
        })
      )
    }

    const colaboradorIdsResolvidos: string[] = []

    for (const item of parsedInput.itens) {
      const colaboradorId =
        item.colaboradorId ??
        idPorNomeNormalizado.get(normalizar(item.nome)) ??
        idPorColaboradorNovo.get(normalizar(item.nome))?.id

      if (!colaboradorId) {
        throw new ActionError(
          `Não foi possível resolver o colaborador "${item.nome}".`
        )
      }
      colaboradorIdsResolvidos.push(colaboradorId)

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
            respondido_em: item.respondidoEm
              ? new Date(item.respondidoEm)
              : null,
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
    updateTag(TAG_EMPRESAS_LISTA)
    updateTag(tagEmpresa(parsedInput.empresaId))
    updateTag(tagEmpresaPedidos(parsedInput.empresaId))

    return {
      colaboradoresNovos: idPorColaboradorNovo.size,
      diasImportados: parsedInput.itens.length,
      colaboradorIds: colaboradorIdsResolvidos,
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

    const empresaConfig = await db.query.empresa.findFirst({
      where: eq(empresa.id, parsedInput.empresaId),
      columns: { preco_modo: true },
    })
    if (!empresaConfig) throw new ActionError('Empresa não encontrada.')

    const [contagem, pedidos] = await Promise.all([
      getContagemTamanhos(parsedInput.empresaId, parsedInput.data),
      getPedidosDoDia(parsedInput.empresaId, parsedInput.data),
    ])

    const precoUnico = parsedInput.precoUnitarioMarmitaUnica
    const precoPorTamanho: Record<'P' | 'M' | 'G', number> = {
      P: parsedInput.precoUnitarioP,
      M: parsedInput.precoUnitarioM,
      G: parsedInput.precoUnitarioG,
    }
    const usaPrecoUnico = empresaConfig.preco_modo === 'unico'

    // No modo único a empresa não marca tamanho nenhum (ex: COFEL) — toda
    // marmita do dia entra pelo preço fixo, com ou sem tamanho na linha.
    const itensMarmita = pedidos.filter(
      (p) =>
        p.tipo === 'marmita' &&
        (usaPrecoUnico || p.tamanho != null) &&
        !p.recusou
    )
    const itensLanche = pedidos.filter((p) => p.tipo === 'lanche' && !p.recusou)

    function precoDaMarmita(item: (typeof itensMarmita)[number]): number {
      if (item.preco != null) return item.preco
      if (usaPrecoUnico) return precoUnico
      return precoPorTamanho[item.tamanho as 'P' | 'M' | 'G']
    }

    const totalMarmitas = itensMarmita.reduce(
      (soma, item) => soma + precoDaMarmita(item),
      0
    )
    const totalLanches = itensLanche.reduce(
      (soma, item) => soma + (item.preco ?? 0),
      0
    )
    const totalCafe = parsedInput.quantidadeCafe * parsedInput.precoUnitarioCafe
    const totalSuco = parsedInput.quantidadeSuco * parsedInput.precoUnitarioSuco
    const valorTotal = totalMarmitas + totalLanches + totalCafe + totalSuco

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
        quantidade_marmita_unica: usaPrecoUnico ? itensMarmita.length : 0,
        preco_unitario_marmita_unica: usaPrecoUnico
          ? toMoneyString(precoUnico)
          : '0',
        quantidade_cafe: parsedInput.quantidadeCafe,
        preco_unitario_cafe: toMoneyString(parsedInput.precoUnitarioCafe),
        quantidade_suco: parsedInput.quantidadeSuco,
        preco_unitario_suco: toMoneyString(parsedInput.precoUnitarioSuco),
        quantidade_lanche: contagem.lanche,
        valor_total: toMoneyString(valorTotal),
        finalizado_por: ctx.user.name,
      })
      .returning({ id: fechamento_dia_empresa.id })

    if (!criado) throw new ActionError('Não foi possível finalizar o dia')

    const linhas = [
      ...itensMarmita.map((item) => ({
        fechamento_id: criado.id,
        colaborador_nome: item.nome,
        tipo: 'marmita' as const,
        prato: item.prato,
        tamanho: item.tamanho,
        preco: toMoneyString(precoDaMarmita(item)),
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
    updateTag(tagEmpresaFechamentos(parsedInput.empresaId))

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
    updateTag(tagEmpresaFechamentos(parsedInput.empresaId))
  })

export const listarFechamentosAction = authActionClient
  .schema(listarFechamentosSchema)
  .action(async ({ parsedInput }) => {
    const fechamentos = await listarFechamentosDaEmpresa(
      parsedInput.empresaId,
      {
        from: parsedInput.from,
        to: parsedInput.to,
      }
    )
    return { fechamentos }
  })

export const listarFaturamentoMensalAction = authActionClient
  .schema(listarFaturamentoMensalSchema)
  .action(async ({ parsedInput }) => {
    const faturamentoMensal = await getFaturamentoMensal(
      parsedInput.empresaId,
      { from: parsedInput.from, to: parsedInput.to }
    )
    return { faturamentoMensal }
  })

/**
 * Nenhum desses três actions recebe `empresaId` do cliente (só
 * `colaboradorId`, já suficiente pro `WHERE`) — pra invalidar a tag certa
 * de cache, resolve o dono do colaborador com uma leitura indexada rápida
 * antes de escrever. Mais barato que adicionar `empresaId` em todo schema/
 * prop-drilling só pra isso.
 */
async function empresaDoColaborador(
  colaboradorId: string
): Promise<string | null> {
  const row = await db.query.colaborador_pedido.findFirst({
    where: (c, { eq: eqOp }) => eqOp(c.id, colaboradorId),
    columns: { empresa_id: true },
  })
  return row?.empresa_id ?? null
}

export const removerPedidoAction = authActionClient
  .schema(removerPedidoSchema)
  .action(async ({ parsedInput }) => {
    const empresaId = await empresaDoColaborador(parsedInput.colaboradorId)

    await db
      .delete(pedido_dia_importado)
      .where(
        and(
          eq(pedido_dia_importado.colaborador_id, parsedInput.colaboradorId),
          eq(pedido_dia_importado.data, parsedInput.data)
        )
      )

    revalidatePath('/empresas')
    updateTag(TAG_EMPRESAS_LISTA)
    if (empresaId) updateTag(tagEmpresaPedidos(empresaId))
  })

export const marcarRecusaAction = authActionClient
  .schema(marcarRecusaSchema)
  .action(async ({ parsedInput }) => {
    const empresaId = await empresaDoColaborador(parsedInput.colaboradorId)

    await db
      .update(pedido_dia_importado)
      .set({ recusou: parsedInput.recusou })
      .where(
        and(
          eq(pedido_dia_importado.colaborador_id, parsedInput.colaboradorId),
          eq(pedido_dia_importado.data, parsedInput.data)
        )
      )

    revalidatePath('/empresas')
    updateTag(TAG_EMPRESAS_LISTA)
    if (empresaId) updateTag(tagEmpresaPedidos(empresaId))
  })

/**
 * Edita prato/turno/tamanho/observação de um pedido já existente — não
 * mexe em `tipo` (marmita/lanche) nem em preço, que têm caminho próprio
 * (recriar o pedido e `atualizarPrecoPedidoAction`, respectivamente).
 */
export const atualizarPedidoAction = authActionClient
  .schema(atualizarPedidoSchema)
  .action(async ({ parsedInput }) => {
    const empresaId = await empresaDoColaborador(parsedInput.colaboradorId)

    await db
      .update(pedido_dia_importado)
      .set({
        prato: parsedInput.prato.trim(),
        turno: parsedInput.turno,
        tamanho: parsedInput.tamanho,
        observacao: parsedInput.observacao?.trim() || null,
      })
      .where(
        and(
          eq(pedido_dia_importado.colaborador_id, parsedInput.colaboradorId),
          eq(pedido_dia_importado.data, parsedInput.data)
        )
      )

    revalidatePath('/empresas')
    if (empresaId) updateTag(tagEmpresaPedidos(empresaId))
  })

/**
 * Chamado depois que a impressão de verdade (QZ Tray) já terminou — marca
 * `impresso_em = agora` pra essas comandas saírem de "novo"/"atualizado"
 * pra "impresso" na tela. `empresaId` vem do primeiro colaborador do lote
 * (todos vêm da mesma empresa, sempre — a tela de pedidos é por empresa).
 */
export const marcarPedidosImpressosAction = authActionClient
  .schema(marcarPedidosImpressosSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(pedido_dia_importado)
      .set({ impresso_em: new Date() })
      .where(
        and(
          inArray(
            pedido_dia_importado.colaborador_id,
            parsedInput.colaboradorIds
          ),
          eq(pedido_dia_importado.data, parsedInput.data)
        )
      )

    const empresaId = await empresaDoColaborador(parsedInput.colaboradorIds[0]!)
    if (empresaId) updateTag(tagEmpresaPedidos(empresaId))
  })

/**
 * Preço específico desse pedido, sobrepondo o padrão — marmita normalmente
 * usa o preço do tamanho (decidido no "Finalizar dia"), lanche já tem preço
 * próprio; isso deixa qualquer um dos dois zerado ou com outro valor sem
 * afetar os demais pedidos do mesmo tamanho/lanche. `null` volta ao padrão.
 */
export const atualizarPrecoPedidoAction = authActionClient
  .schema(atualizarPrecoPedidoSchema)
  .action(async ({ parsedInput }) => {
    const empresaId = await empresaDoColaborador(parsedInput.colaboradorId)

    await db
      .update(pedido_dia_importado)
      .set({
        preco:
          parsedInput.preco != null ? toMoneyString(parsedInput.preco) : null,
      })
      .where(
        and(
          eq(pedido_dia_importado.colaborador_id, parsedInput.colaboradorId),
          eq(pedido_dia_importado.data, parsedInput.data)
        )
      )

    revalidatePath('/empresas')
    if (empresaId) updateTag(tagEmpresaPedidos(empresaId))
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
    updateTag(tagEmpresaPrecos(parsedInput.empresaId))

    return { itens: parsedInput.itens }
  })
