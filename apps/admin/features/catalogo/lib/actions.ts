'use server'

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
  produto_grupo_adicional,
} from '@repo/db'

import {
  criarAdicionalItemSchema,
  criarCategoriaProdutoSchema,
  criarGrupoAdicionalSchema,
  criarProdutoSchema,
} from './schemas'

function revalidarCatalogo(produtoId?: string) {
  revalidatePath('/catalogo/produtos')
  revalidatePath('/catalogo/delivery')
  if (produtoId) revalidatePath(`/catalogo/produtos/${produtoId}`)
}

export const criarProdutoAction = authActionClient
  .schema(criarProdutoSchema)
  .action(async ({ parsedInput }) => {
    const [criado] = await db
      .insert(produto)
      .values({
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
        preco_venda: toMoneyString(parsedInput.precoVenda),
        desconto_percentual:
          parsedInput.descontoPercentual == null
            ? null
            : toMoneyString(parsedInput.descontoPercentual),
      })
      .returning({ id: produto.id })

    if (!criado) throw new ActionError('Não foi possível cadastrar o produto')

    const statements: Statement[] = []

    if (parsedInput.fichaTecnica.length > 0) {
      statements.push(
        db.insert(produto_ficha_tecnica_item).values(
          parsedInput.fichaTecnica.map((item) => ({
            produto_id: criado.id,
            estoque_item_id: item.estoqueItemId,
            quantidade: toNumericString(item.quantidade),
          }))
        )
      )
    }

    if (parsedInput.diasSemana.length > 0) {
      statements.push(
        db.insert(produto_dia_semana).values(
          parsedInput.diasSemana.map((diaSemana) => ({
            produto_id: criado.id,
            dia_semana: diaSemana,
          }))
        )
      )
    }

    if (parsedInput.grupoAdicionalIds.length > 0) {
      statements.push(
        db.insert(produto_grupo_adicional).values(
          parsedInput.grupoAdicionalIds.map((grupoId) => ({
            produto_id: criado.id,
            grupo_id: grupoId,
          }))
        )
      )
    }

    await executarLote(statements)

    revalidarCatalogo(criado.id)
    return { produtoId: criado.id }
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
