'use server'

import { eq } from 'drizzle-orm'

import { colaborador_pedido, empresa, pedido_dia_importado } from '@repo/db'

import { db } from '@/lib/db'
import { hojeISO } from '@/lib/formatters'
import { ActionError, actionClient } from '@/lib/safe-action'

import { mesclarExtras } from './cardapio-helpers'
import { diaEditavel } from './edicao-helpers'
import {
  getCardapioSemana,
  getExtrasEmpresa,
  getRespostasColaborador,
} from './queries'
import {
  buscarCardapioSemanaSchema,
  buscarRespostasSchema,
  enviarRespostaSchema,
} from './schemas'

export const buscarRespostasAction = actionClient
  .schema(buscarRespostasSchema)
  .action(async ({ parsedInput }) => {
    const respostas = await getRespostasColaborador(
      parsedInput.colaboradorId,
      parsedInput.turno,
      parsedInput.from,
      parsedInput.to
    )
    return { respostas }
  })

export const buscarCardapioSemanaAction = actionClient
  .schema(buscarCardapioSemanaSchema)
  .action(async ({ parsedInput }) => {
    const [cardapioCompleto, extras] = await Promise.all([
      getCardapioSemana(parsedInput.from, parsedInput.to),
      getExtrasEmpresa(parsedInput.empresaId, parsedInput.from, parsedInput.to),
    ])
    // Mesmo corte de `page.tsx` — o cardápio é gerado inteiro pro
    // restaurante, cada empresa só enxerga as N primeiras alternativas dela,
    // mais os extras exclusivos por cima.
    const cardapioCortado = cardapioCompleto.map((dia) => ({
      ...dia,
      alternativas: dia.alternativas.slice(
        0,
        parsedInput.cardapioQtdAlternativas
      ),
    }))
    const cardapio = mesclarExtras(cardapioCortado, extras)
    return { cardapio }
  })

/**
 * Grava direto em `pedido_dia_importado` — mesma tabela que a importação de
 * planilha usa no admin, então comanda/pesagem/resumo do dia continuam
 * funcionando sem mudar nada. Upsert por `colaborador_id`+`data`+`turno`
 * (índice único real da tabela — turno faz parte da chave porque a mesma
 * pessoa pode ter almoço E jantar no mesmo dia): reabrir o link e reenviar
 * pro mesmo turno atualiza a resposta, não duplica.
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

    const empresaRow = await db.query.empresa.findFirst({
      where: eq(empresa.id, parsedInput.empresaId),
      columns: { preco_modo: true },
    })
    if (empresaRow?.preco_modo === 'por_tamanho' && !parsedInput.tamanho) {
      throw new ActionError('Escolha o tamanho da marmita antes de enviar.')
    }

    // Mesma regra de `resposta-form.tsx` (amanhã livre, hoje só até as 7h) —
    // a tela já filtra isso antes de montar o pedido, mas quem decide de
    // verdade é o servidor.
    const hoje = hojeISO()
    const respostasEditaveis = parsedInput.respostas.filter((r) =>
      diaEditavel(r.data, hoje)
    )

    if (parsedInput.whatsapp) {
      await db
        .update(colaborador_pedido)
        .set({ whatsapp: parsedInput.whatsapp })
        .where(eq(colaborador_pedido.id, parsedInput.colaboradorId))
    }

    const agora = new Date()

    for (const resposta of respostasEditaveis) {
      const recusou = resposta.prato == null
      const prato = resposta.prato ?? 'Não vou almoçar'

      await db
        .insert(pedido_dia_importado)
        .values({
          colaborador_id: parsedInput.colaboradorId,
          data: resposta.data,
          tipo: 'marmita',
          turno: parsedInput.turno,
          prato,
          tamanho: parsedInput.tamanho,
          observacao: resposta.observacao,
          recusou,
          arquivo_origem: 'cardapio-publico',
          respondido_em: agora,
        })
        .onConflictDoUpdate({
          target: [
            pedido_dia_importado.colaborador_id,
            pedido_dia_importado.data,
            pedido_dia_importado.turno,
          ],
          set: {
            prato,
            tamanho: parsedInput.tamanho,
            observacao: resposta.observacao,
            recusou,
            arquivo_origem: 'cardapio-publico',
            respondido_em: agora,
            importado_em: agora,
          },
        })
    }
  })
