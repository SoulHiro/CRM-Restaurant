'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { toMoneyString, toNumericString } from '@/lib/numeric'
import { ActionError, authActionClient } from '@/lib/safe-action'
import {
  adicional,
  categoria_produto,
  classificacao,
  produto,
  produto_adicional,
  produto_classificacao,
  produto_disponibilidade_janela,
  produto_ficha_tecnica_item,
} from '@repo/db'

import {
  criarAdicionalSchema,
  criarCategoriaProdutoSchema,
  criarClassificacaoSchema,
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
        disponibilidade_status: parsedInput.disponibilidadeStatus,
        aparece_almoco: parsedInput.apareceAlmoco,
        aparece_janta: parsedInput.apareceJanta,
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

    if (parsedInput.disponibilidadeStatus === 'personalizado') {
      statements.push(
        db.insert(produto_disponibilidade_janela).values(
          parsedInput.janelas.map((janela) => ({
            produto_id: criado.id,
            dia_semana: janela.diaSemana,
            hora_inicio: janela.horaInicio,
            hora_fim: janela.horaFim,
          }))
        )
      )
    }

    if (parsedInput.classificacaoIds.length > 0) {
      statements.push(
        db.insert(produto_classificacao).values(
          parsedInput.classificacaoIds.map((classificacaoId) => ({
            produto_id: criado.id,
            classificacao_id: classificacaoId,
          }))
        )
      )
    }

    if (parsedInput.adicionalIds.length > 0) {
      statements.push(
        db.insert(produto_adicional).values(
          parsedInput.adicionalIds.map((adicionalId) => ({
            produto_id: criado.id,
            adicional_id: adicionalId,
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

export const criarClassificacaoAction = authActionClient
  .schema(criarClassificacaoSchema)
  .action(async ({ parsedInput }) => {
    const [criada] = await db
      .insert(classificacao)
      .values({ nome: parsedInput.nome.trim(), aplica_a: parsedInput.aplicaA })
      .returning({
        id: classificacao.id,
        nome: classificacao.nome,
        aplica_a: classificacao.aplica_a,
      })

    if (!criada) throw new ActionError('Não foi possível criar a classificação')

    revalidarCatalogo()
    return { id: criada.id, nome: criada.nome, aplicaA: criada.aplica_a }
  })

export const criarAdicionalAction = authActionClient
  .schema(criarAdicionalSchema)
  .action(async ({ parsedInput }) => {
    const [criado] = await db
      .insert(adicional)
      .values({
        nome: parsedInput.nome.trim(),
        preco: toMoneyString(parsedInput.preco),
      })
      .returning({
        id: adicional.id,
        nome: adicional.nome,
        preco: adicional.preco,
      })

    if (!criado) throw new ActionError('Não foi possível criar o adicional')

    revalidarCatalogo()
    return criado
  })
