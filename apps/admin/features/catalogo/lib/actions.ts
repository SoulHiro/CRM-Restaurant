'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { hojeISO } from '@/lib/formatters'
import { toMoneyString, toNumericString } from '@/lib/numeric'
import { ActionError, tenantActionClient } from '@/lib/safe-action'
import {
  categoria_produto,
  produto,
  produto_ficha_tecnica_item,
  produto_ficha_tecnica_tamanho_override,
  produto_tamanho,
} from '@repo/db'

import { getProdutoDetalhe, todosInsumosPertencemAoTenant } from './queries'
import {
  criarCategoriaProdutoSchema,
  criarProdutoSchema,
  duplicarProdutoSchema,
  editarProdutoSchema,
  type CriarProdutoSchemaInput,
} from './schemas'

function revalidarCatalogo(produtoId?: string) {
  revalidatePath('/catalogo/produtos')
  if (produtoId) revalidatePath(`/catalogo/produtos/${produtoId}`)
}

/**
 * Descrição, vídeo, canais, turno e desconto são conceito de cardápio
 * digital (vitrine pro cliente escolher) — este sistema não tem isso, fica
 * com a Brendi numa parceria futura. As colunas continuam existindo no
 * banco (mudar isso é uma migração à parte), só que sempre gravadas com um
 * valor neutro em vez de vir do formulário. `foto_url` é exceção — continua
 * vindo do formulário porque `features/consumo-funcionario` usa a foto pro
 * funcionário reconhecer o item na hora de lançar consumo.
 */
function montarValoresProduto(
  organizationId: string,
  parsedInput: CriarProdutoSchemaInput
) {
  return {
    organization_id: organizationId,
    nome: parsedInput.nome.trim(),
    categoria_id: parsedInput.categoriaId,
    tipo: parsedInput.tipo,
    descricao: null,
    foto_url: parsedInput.fotoUrl?.trim() || null,
    video_url: null,
    disponivel_delivery: false,
    disponivel_local: true,
    pausado_em: parsedInput.pausadoHoje ? hojeISO() : null,
    aparece_almoco: true,
    aparece_janta: true,
    classificacoes: [],
    tempo_medio_preparo_minutos: parsedInput.tempoMedioPreparoMinutos,
    tem_tamanhos: parsedInput.temTamanhos,
    preco_venda: parsedInput.temTamanhos
      ? null
      : toMoneyString(parsedInput.precoVenda),
    desconto_tipo: 'percentual' as const,
    desconto_valor: null,
  }
}

/**
 * Tamanhos e linhas de ficha técnica precisam do próprio id antes dos
 * overrides poderem referenciá-los — por isso os inserts rodam em sequência
 * (não dá pra encadear resultado entre statements de um único `db.batch` no
 * driver neon-http).
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
}

/** Todo `estoqueItemId` da ficha técnica (linha base + overrides de tamanho) precisa ser do mesmo estabelecimento do produto. */
async function validarInsumosDoTenant(
  organizationId: string,
  parsedInput: CriarProdutoSchemaInput
) {
  const ids = [
    ...parsedInput.fichaTecnica.map((item) => item.estoqueItemId),
    ...parsedInput.fichaTecnica.flatMap((item) =>
      item.overridesPorTamanho
        .map((o) => o.estoqueItemId)
        .filter((id): id is string => id != null)
    ),
  ]
  if (!(await todosInsumosPertencemAoTenant(organizationId, ids))) {
    throw new ActionError(
      'Um dos insumos da ficha técnica não pertence a este estabelecimento.'
    )
  }
}

export const criarProdutoAction = tenantActionClient
  .schema(criarProdutoSchema)
  .action(async ({ parsedInput, ctx }) => {
    await validarInsumosDoTenant(ctx.organizationId, parsedInput)

    const [criado] = await db
      .insert(produto)
      .values(montarValoresProduto(ctx.organizationId, parsedInput))
      .returning({ id: produto.id })

    if (!criado) throw new ActionError('Não foi possível cadastrar o produto')

    await inserirDependenciasProduto(criado.id, parsedInput)

    revalidarCatalogo(criado.id)
    return { produtoId: criado.id }
  })

export const editarProdutoAction = tenantActionClient
  .schema(editarProdutoSchema)
  .action(async ({ parsedInput, ctx }) => {
    await validarInsumosDoTenant(ctx.organizationId, parsedInput)

    const [atualizado] = await db
      .update(produto)
      .set(montarValoresProduto(ctx.organizationId, parsedInput))
      .where(
        and(
          eq(produto.id, parsedInput.id),
          eq(produto.organization_id, ctx.organizationId)
        )
      )
      .returning({ id: produto.id })

    if (!atualizado) throw new ActionError('Produto não encontrado')

    // Ficha técnica e tamanhos são configuração do produto, não um
    // livro-razão histórico — substituir tudo a cada edição é seguro
    // (diferente de estoque_movimento/transacao_financeira, que nunca podem
    // ser reescritos).
    await Promise.all([
      db.delete(produto_tamanho).where(eq(produto_tamanho.produto_id, atualizado.id)),
      db
        .delete(produto_ficha_tecnica_item)
        .where(eq(produto_ficha_tecnica_item.produto_id, atualizado.id)),
    ])

    await inserirDependenciasProduto(atualizado.id, parsedInput)

    revalidarCatalogo(atualizado.id)
    return { produtoId: atualizado.id }
  })

/**
 * Cópia rasa de tudo que `montarValoresProduto`/`inserirDependenciasProduto`
 * gravam — ficha técnica, tamanhos, dias da semana e grupos de adicionais
 * incluídos. Nasce pausado hoje pra não aparecer no delivery/local por
 * engano antes de alguém revisar preço e nome.
 */
export const duplicarProdutoAction = tenantActionClient
  .schema(duplicarProdutoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const original = await getProdutoDetalhe(
      ctx.organizationId,
      parsedInput.produtoId
    )
    if (!original) throw new ActionError('Produto não encontrado')

    const dadosCopia: CriarProdutoSchemaInput = {
      ...original,
      nome: `${original.nome} (cópia)`,
      pausadoHoje: true,
    }

    const [criado] = await db
      .insert(produto)
      .values(montarValoresProduto(ctx.organizationId, dadosCopia))
      .returning({ id: produto.id })

    if (!criado) throw new ActionError('Não foi possível duplicar o produto')

    await inserirDependenciasProduto(criado.id, dadosCopia)

    revalidarCatalogo(criado.id)
    return { produtoId: criado.id }
  })

export const criarCategoriaProdutoAction = tenantActionClient
  .schema(criarCategoriaProdutoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [criada] = await db
      .insert(categoria_produto)
      .values({ organization_id: ctx.organizationId, nome: parsedInput.nome.trim() })
      .returning({ id: categoria_produto.id, nome: categoria_produto.nome })

    if (!criada) throw new ActionError('Não foi possível criar a categoria')

    revalidarCatalogo()
    return criada
  })
