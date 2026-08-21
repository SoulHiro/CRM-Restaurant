'use server'

import { pedido_dia_importado } from '@repo/db'

import { db } from '@/lib/db'
import { ActionError, actionClient } from '@/lib/safe-action'

import { getRespostasColaborador } from './queries'
import { buscarRespostasSchema, enviarRespostaSchema } from './schemas'

export const buscarRespostasAction = actionClient
  .schema(buscarRespostasSchema)
  .action(async ({ parsedInput }) => {
    const respostas = await getRespostasColaborador(
      parsedInput.colaboradorId,
      parsedInput.from,
      parsedInput.to
    )
    return { respostas }
  })

/**
 * Grava direto em `pedido_dia_importado` — mesma tabela que a importação de
 * planilha usa no admin, então comanda/pesagem/resumo do dia continuam
 * funcionando sem mudar nada. Upsert por `colaborador_id`+`data` (índice
 * único já existe): reabrir o link e reenviar atualiza a resposta, não
 * duplica.
 */
export const enviarRespostaAction = actionClient
  .schema(enviarRespostaSchema)
  .action(async ({ parsedInput }) => {
    const colaborador = await db.query.colaborador_pedido.findFirst({
      where: (c, { and, eq }) =>
        and(
          eq(c.id, parsedInput.colaboradorId),
          eq(c.empresa_id, parsedInput.empresaId),
          eq(c.ativo, true)
        ),
      columns: { id: true },
    })
    if (!colaborador) {
      throw new ActionError('Colaborador não encontrado.')
    }

    const agora = new Date()

    for (const resposta of parsedInput.respostas) {
      const recusou = resposta.prato == null
      const prato = resposta.prato ?? 'Não vou almoçar'

      await db
        .insert(pedido_dia_importado)
        .values({
          colaborador_id: parsedInput.colaboradorId,
          data: resposta.data,
          tipo: 'marmita',
          prato,
          tamanho: resposta.tamanho,
          recusou,
          arquivo_origem: 'cardapio-publico',
          respondido_em: agora,
        })
        .onConflictDoUpdate({
          target: [
            pedido_dia_importado.colaborador_id,
            pedido_dia_importado.data,
          ],
          set: {
            prato,
            tamanho: resposta.tamanho,
            recusou,
            arquivo_origem: 'cardapio-publico',
            respondido_em: agora,
            importado_em: agora,
          },
        })
    }
  })
