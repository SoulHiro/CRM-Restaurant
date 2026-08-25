'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { hojeISO } from '@/lib/formatters'
import { toMoneyString, toNumericString } from '@/lib/numeric'
import { ActionError, authActionClient } from '@/lib/safe-action'
import {
  adicional,
  categoria_produto,
  grupo_adicional,
  produto,
  produto_dia_semana,
  produto_ficha_tecnica_item,
  produto_ficha_tecnica_tamanho_override,
  produto_grupo_adicional,
  produto_tamanho,
} from '@repo/db'

import {
  criarAdicionalItemSchema,
  criarCategoriaProdutoSchema,
  criarGrupoAdicionalSchema,
  criarProdutoSchema,
  editarProdutoSchema,
  type CriarProdutoSchemaInput,
} from './schemas'

function revalidarCatalogo(produtoId?: string) {
  revalidatePath('/catalogo/produtos')
  revalidatePath('/catalogo/delivery')
  if (produtoId) revalidatePath(`/catalogo/produtos/${produtoId}`)
}

function montarValoresProduto(parsedInput: CriarProdutoSchemaInput) {
  return {
    nome: parsedInput.nome.trim(),
    categoria_id: parsedInput.categoriaId,
    tipo: parsedInput.tipo,
    descricao: parsedInput.descricao?.trim() || null,
    foto_url: parsedInput.fotoUrl?.trim() || null,
    video_url: parsedInput.videoUrl?.trim() || null,
    disponivel_delivery: parsedInput.disponivelDelivery,
    disponivel_local: parsedInput.disponivelLocal,
    pausado_em: parsedInput.pausadoHoje ? hojeISO() : null,
    aparece_almoco: parsedInput.apareceAlmoco,
    aparece_janta: parsedInput.apareceJanta,
    classificacoes: parsedInput.classificacoes,
    tempo_medio_preparo_minutos: parsedInput.tempoMedioPreparoMinutos,
    tem_tamanhos: parsedInput.temTamanhos,
    preco_venda: parsedInput.temTamanhos
      ? null
      : toMoneyString(parsedInput.precoVenda),
    desconto_tipo: parsedInput.descontoTipo === 'valorFixo' ? 'valor_fixo' as const : 'percentual' as const,
    desconto_valor:
      parsedInput.descontoValor == null
        ? null
        : toMoneyString(parsedInput.descontoValor),
  }
}

/**
 * Tamanhos e linhas de ficha técnica precisam do próprio id antes dos
 * overrides poderem referenciá-los — por isso os inserts rodam em sequência
 * (não dá pra encadear resultado entre statements de um único `db.batch` no
 * driver neon-http). Só o que não depende de id gerado aqui (dias da semana,
 * grupos de adicionais) vai pro lote no final.
 */
async function inserirDependenciasProduto(
  produtoId: string,
  parsedInput: CriarProdutoSchemaInput
) {
  const tamanhoIdPorKey = new Map<string, string>()
  if (parsedInput.tamanhos.length > 0) {
    const tamanhosCriados = await db
      .insert(produto_tamanho)
      .values(
        parsedInput.tamanhos.map((tamanho, index) => ({
          produto_id: produtoId,
          nome: tamanho.nome.trim(),
          peso_gramas: Math.round(tamanho.pesoGramas),
          preco_venda: toMoneyString(tamanho.precoVenda),
          is_base: tamanho.ehBase,
          ordem: index,
        }))
      )
      .returning({ id: produto_tamanho.id })

    parsedInput.tamanhos.forEach((tamanho, index) => {
      const linha = tamanhosCriados[index]
      if (linha) tamanhoIdPorKey.set(tamanho.key, linha.id)
    })
  }

  const fichaTecnicaIdPorInsumo = new Map<string, string>()
  if (parsedInput.fichaTecnica.length > 0) {
    const linhasCriadas = await db
      .insert(produto_ficha_tecnica_item)
      .values(
        parsedInput.fichaTecnica.map((item) => ({
          produto_id: produtoId,
          estoque_item_id: item.estoqueItemId,
          quantidade: toNumericString(item.quantidade),
          tipo_escala: item.tipoEscala,
        }))
      )
      .returning({ id: produto_ficha_tecnica_item.id })

    parsedInput.fichaTecnica.forEach((item, index) => {
      const linha = linhasCriadas[index]
      if (linha) fichaTecnicaIdPorInsumo.set(item.estoqueItemId, linha.id)
    })
  }

  const overrides = parsedInput.fichaTecnica.flatMap((item) => {
    if (item.tipoEscala !== 'fixo') return []
    const fichaTecnicaItemId = fichaTecnicaIdPorInsumo.get(item.estoqueItemId)
    if (!fichaTecnicaItemId) return []

    return item.overridesPorTamanho.flatMap((override) => {
      const produtoTamanhoId = tamanhoIdPorKey.get(override.tamanhoKey)
      if (!produtoTamanhoId) return []
      return [
        {
          ficha_tecnica_item_id: fichaTecnicaItemId,
          produto_tamanho_id: produtoTamanhoId,
          estoque_item_id: override.estoqueItemId,
          quantidade: toNumericString(override.quantidade),
        },
      ]
    })
  })

  if (overrides.length > 0) {
    await db.insert(produto_ficha_tecnica_tamanho_override).values(overrides)
  }

  const statements: Statement[] = []

  if (parsedInput.diasSemana.length > 0) {
    statements.push(
      db.insert(produto_dia_semana).values(
        parsedInput.diasSemana.map((diaSemana) => ({
          produto_id: produtoId,
          dia_semana: diaSemana,
        }))
      )
    )
  }

  if (parsedInput.grupoAdicionalIds.length > 0) {
    statements.push(
      db.insert(produto_grupo_adicional).values(
        parsedInput.grupoAdicionalIds.map((grupoId) => ({
          produto_id: produtoId,
          grupo_id: grupoId,
        }))
      )
    )
  }

  await executarLote(statements)
}

export const criarProdutoAction = authActionClient
  .schema(criarProdutoSchema)
  .action(async ({ parsedInput }) => {
    const [criado] = await db
      .insert(produto)
      .values(montarValoresProduto(parsedInput))
      .returning({ id: produto.id })

    if (!criado) throw new ActionError('Não foi possível cadastrar o produto')

    await inserirDependenciasProduto(criado.id, parsedInput)

    revalidarCatalogo(criado.id)
    return { produtoId: criado.id }
  })

export const editarProdutoAction = authActionClient
  .schema(editarProdutoSchema)
  .action(async ({ parsedInput }) => {
    const [atualizado] = await db
      .update(produto)
      .set(montarValoresProduto(parsedInput))
      .where(eq(produto.id, parsedInput.id))
      .returning({ id: produto.id })

    if (!atualizado) throw new ActionError('Produto não encontrado')

    // Ficha técnica, tamanhos, dias da semana e grupos de adicionais são
    // configuração do produto, não um livro-razão histórico — substituir
    // tudo a cada edição é seguro (diferente de estoque_movimento/
    // transacao_financeira, que nunca podem ser reescritos).
    await Promise.all([
      db.delete(produto_tamanho).where(eq(produto_tamanho.produto_id, atualizado.id)),
      db
        .delete(produto_ficha_tecnica_item)
        .where(eq(produto_ficha_tecnica_item.produto_id, atualizado.id)),
      db
        .delete(produto_dia_semana)
        .where(eq(produto_dia_semana.produto_id, atualizado.id)),
      db
        .delete(produto_grupo_adicional)
        .where(eq(produto_grupo_adicional.produto_id, atualizado.id)),
    ])

    await inserirDependenciasProduto(atualizado.id, parsedInput)

    revalidarCatalogo(atualizado.id)
    return { produtoId: atualizado.id }
  })

export const criarCategoriaProdutoAction = authActionClient
  .schema(criarCategoriaProdutoSchema)
  .action(async ({ parsedInput }) => {
    const [criada] = await db
      .insert(categoria_produto)
      .values({ nome: parsedInput.nome.trim() })
      .returning({ id: categoria_produto.id, nome: categoria_produto.nome })

    if (!criada) throw new ActionError('Não foi possível criar a categoria')

    revalidarCatalogo()
    return criada
  })

export const criarGrupoAdicionalAction = authActionClient
  .schema(criarGrupoAdicionalSchema)
  .action(async ({ parsedInput }) => {
    const [criado] = await db
      .insert(grupo_adicional)
      .values({
        nome: parsedInput.nome.trim(),
        disponivel_almoco: parsedInput.disponivelAlmoco,
        disponivel_janta: parsedInput.disponivelJanta,
      })
      .returning({ id: grupo_adicional.id })

    if (!criado) throw new ActionError('Não foi possível criar o grupo')

    revalidatePath('/catalogo/adicionais')
    return { grupoId: criado.id }
  })

export const criarAdicionalItemAction = authActionClient
  .schema(criarAdicionalItemSchema)
  .action(async ({ parsedInput }) => {
    const [criado] = await db
      .insert(adicional)
      .values({
        grupo_id: parsedInput.grupoId,
        nome: parsedInput.nome.trim(),
        preco: toMoneyString(parsedInput.preco),
        foto_url: parsedInput.fotoUrl?.trim() || null,
        quantidade_minima: parsedInput.quantidadeMinima,
        quantidade_maxima: parsedInput.quantidadeMaxima,
      })
      .returning({ id: adicional.id })

    if (!criado) throw new ActionError('Não foi possível criar o item')

    revalidatePath(`/catalogo/adicionais/${parsedInput.grupoId}`)
    return { adicionalId: criado.id }
  })
