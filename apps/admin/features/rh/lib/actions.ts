'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'

import { planejarContaPagar } from '@/features/financeiro/lib/planejar-conta'
import { cpfValido, digitosDoCpf, finalDoCpf } from '@/lib/cpf'
import { cifrar, decifrar } from '@/lib/crypto'
import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { toMoneyString } from '@/lib/numeric'
import { ActionError, authActionClient } from '@/lib/safe-action'
import {
  audit_log,
  ausencia_funcionario,
  beneficio_funcionario,
  cargo,
  conta_a_pagar,
  entregador,
  folha_item,
  folha_pagamento,
  funcionario_interno,
  historico_salario,
} from '@repo/db'

import { rotuloCompetencia, subtipoDespesa, totalFolha } from './folha-helpers'
import {
  admitirFuncionarioSchema,
  competenciaSchema,
  desligarFuncionarioSchema,
  editarFuncionarioSchema,
  fecharFolhaSchema,
  idSchema,
  registrarAusenciaSchema,
  registrarSalarioSchema,
  upsertBeneficioSchema,
  upsertCargoSchema,
  upsertEntregadorSchema,
} from './schemas'

function revalidarRh(funcionarioId?: string) {
  revalidatePath('/funcionarios')
  revalidatePath('/entregadores')
  revalidatePath('/financeiro')
  if (funcionarioId) revalidatePath(`/funcionarios/${funcionarioId}`)
}

/**
 * Devolve o par cifrado/final, ou dois nulls quando o CPF não foi informado.
 * Guarda só os dígitos: com a máscara, o mesmo CPF digitado de dois jeitos
 * viraria dois valores diferentes no banco.
 */
function prepararCpf(cpf: string | undefined) {
  const informado = cpf?.trim()
  if (!informado) return { cpf_cifrado: null, cpf_final: null }

  if (!cpfValido(informado)) {
    throw new ActionError('CPF inválido — confira os dígitos')
  }

  const digitos = digitosDoCpf(informado)
  return { cpf_cifrado: cifrar(digitos), cpf_final: finalDoCpf(digitos) }
}

export const upsertCargoAction = authActionClient
  .schema(upsertCargoSchema)
  .action(async ({ parsedInput }) => {
    const valores = {
      nome: parsedInput.nome.trim(),
      salario_base: toMoneyString(parsedInput.salarioBase),
      valor_diaria_padrao:
        parsedInput.valorDiariaPadrao && parsedInput.valorDiariaPadrao > 0
          ? toMoneyString(parsedInput.valorDiariaPadrao)
          : null,
    }

    if (parsedInput.id) {
      await db.update(cargo).set(valores).where(eq(cargo.id, parsedInput.id))
      revalidarRh()
      return { cargoId: parsedInput.id }
    }

    const [criado] = await db
      .insert(cargo)
      .values(valores)
      .returning({ id: cargo.id })

    if (!criado) throw new ActionError('Não foi possível salvar o cargo')

    revalidarRh()
    return { cargoId: criado.id }
  })

export const deleteCargoAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const ocupado = await db.query.funcionario_interno.findFirst({
      where: eq(funcionario_interno.cargo_id, parsedInput.id),
      columns: { id: true },
    })

    if (ocupado) {
      throw new ActionError(
        'Esse cargo tem funcionários vinculados e não pode ser excluído.'
      )
    }

    await db.delete(cargo).where(eq(cargo.id, parsedInput.id))

    revalidarRh()
    return { cargoId: parsedInput.id }
  })

/**
 * Admitir nasce com a primeira vigência de salário no mesmo lote: um
 * funcionário sem histórico não entraria em folha nenhuma, e essa é a
 * primeira coisa que se esqueceria de fazer depois.
 */
export const admitirFuncionarioAction = authActionClient
  .schema(admitirFuncionarioSchema)
  .action(async ({ parsedInput, ctx }) => {
    const cargoRow = await db.query.cargo.findFirst({
      where: eq(cargo.id, parsedInput.cargoId),
      columns: { id: true },
    })
    if (!cargoRow) throw new ActionError('Cargo não encontrado')

    const [criado] = await db
      .insert(funcionario_interno)
      .values({
        nome: parsedInput.nome.trim(),
        ...prepararCpf(parsedInput.cpf),
        cnpj: parsedInput.cnpj?.trim() || null,
        cargo_id: parsedInput.cargoId,
        turno: parsedInput.turno,
        modelo_contratual: parsedInput.modeloContratual,
        data_admissao: parsedInput.dataAdmissao,
      })
      .returning({ id: funcionario_interno.id })

    if (!criado) throw new ActionError('Não foi possível admitir o funcionário')

    const statements: Statement[] = []

    if (parsedInput.ehEntregador) {
      statements.push(
        db.insert(entregador).values({
          funcionario_interno_id: criado.id,
          valor_diaria: toMoneyString(parsedInput.valorDiaria ?? 0),
          taxa_entrega_percentual:
            parsedInput.taxaEntregaPercentual == null
              ? null
              : parsedInput.taxaEntregaPercentual.toFixed(2),
          folga_semanal: parsedInput.folgaSemanal ?? null,
        })
      )
    } else {
      statements.push(
        db.insert(historico_salario).values({
          funcionario_interno_id: criado.id,
          valor: toMoneyString(parsedInput.salarioInicial),
          vigente_desde: parsedInput.dataAdmissao,
          motivo: 'admissao',
          user_id: ctx.user.id,
        })
      )
    }

    await executarLote(statements)

    revalidarRh(criado.id)
    return { funcionarioId: criado.id }
  })

export const editarFuncionarioAction = authActionClient
  .schema(editarFuncionarioSchema)
  .action(async ({ parsedInput }) => {
    const atual = await db.query.funcionario_interno.findFirst({
      where: eq(funcionario_interno.id, parsedInput.id),
      columns: { id: true, cpf_cifrado: true, cpf_final: true },
    })
    if (!atual) throw new ActionError('Funcionário não encontrado')

    // Campo em branco no formulário significa "não mexer no CPF", não "apagar":
    // a tela mostra só o mascarado, então quem editou nunca viu o valor inteiro.
    const cpf = parsedInput.cpf?.trim()
      ? prepararCpf(parsedInput.cpf)
      : { cpf_cifrado: atual.cpf_cifrado, cpf_final: atual.cpf_final }

    await db
      .update(funcionario_interno)
      .set({
        nome: parsedInput.nome.trim(),
        ...cpf,
        cnpj: parsedInput.cnpj?.trim() || null,
        cargo_id: parsedInput.cargoId,
        turno: parsedInput.turno,
        modelo_contratual: parsedInput.modeloContratual,
        data_admissao: parsedInput.dataAdmissao,
      })
      .where(eq(funcionario_interno.id, parsedInput.id))

    revalidarRh(parsedInput.id)
    return { funcionarioId: parsedInput.id }
  })

export const desligarFuncionarioAction = authActionClient
  .schema(desligarFuncionarioSchema)
  .action(async ({ parsedInput }) => {
    const atual = await db.query.funcionario_interno.findFirst({
      where: eq(funcionario_interno.id, parsedInput.id),
      columns: { status: true },
    })

    if (!atual) throw new ActionError('Funcionário não encontrado')
    if (atual.status === 'desligado') {
      throw new ActionError('Esse funcionário já está desligado.')
    }

    await db
      .update(funcionario_interno)
      .set({
        status: 'desligado',
        data_desligamento: parsedInput.dataDesligamento,
        motivo_desligamento: parsedInput.motivo,
      })
      .where(eq(funcionario_interno.id, parsedInput.id))

    revalidarRh(parsedInput.id)
    return { funcionarioId: parsedInput.id }
  })

export const readmitirFuncionarioAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(funcionario_interno)
      .set({
        status: 'ativo',
        data_desligamento: null,
        motivo_desligamento: null,
      })
      .where(eq(funcionario_interno.id, parsedInput.id))

    revalidarRh(parsedInput.id)
    return { funcionarioId: parsedInput.id }
  })

/**
 * Ler o CPF completo é evento, não consulta: passa por aqui e fica registrado
 * em `audit_log` — quem, de quem e quando.
 */
export const revelarCpfAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput, ctx }) => {
    const row = await db.query.funcionario_interno.findFirst({
      where: eq(funcionario_interno.id, parsedInput.id),
      columns: { nome: true, cpf_cifrado: true },
    })

    if (!row) throw new ActionError('Funcionário não encontrado')
    if (!row.cpf_cifrado) throw new ActionError('Esse funcionário não tem CPF cadastrado.')

    let cpf: string
    try {
      cpf = decifrar(row.cpf_cifrado)
    } catch {
      throw new ActionError(
        'Não foi possível ler o CPF — a chave de criptografia mudou?'
      )
    }

    await db.insert(audit_log).values({
      user_id: ctx.user.id,
      ator_descricao: ctx.user.name,
      acao: 'revelar_cpf',
      detalhes: { funcionarioId: parsedInput.id, funcionarioNome: row.nome },
    })

    return { cpf }
  })

export const registrarSalarioAction = authActionClient
  .schema(registrarSalarioSchema)
  .action(async ({ parsedInput, ctx }) => {
    const existente = await db.query.historico_salario.findFirst({
      where: and(
        eq(historico_salario.funcionario_interno_id, parsedInput.funcionarioId),
        eq(historico_salario.vigente_desde, parsedInput.vigenteDesde)
      ),
      columns: { id: true },
    })

    if (existente) {
      throw new ActionError(
        'Já existe uma vigência começando nesse dia. Escolha outra data ou apague a anterior.'
      )
    }

    const [criado] = await db
      .insert(historico_salario)
      .values({
        funcionario_interno_id: parsedInput.funcionarioId,
        valor: toMoneyString(parsedInput.valor),
        vigente_desde: parsedInput.vigenteDesde,
        motivo: parsedInput.motivo,
        observacao: parsedInput.observacao?.trim() || null,
        user_id: ctx.user.id,
      })
      .returning({ id: historico_salario.id })

    if (!criado) throw new ActionError('Não foi possível registrar o salário')

    revalidarRh(parsedInput.funcionarioId)
    return { salarioId: criado.id }
  })

export const deleteSalarioAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(historico_salario)
      .where(eq(historico_salario.id, parsedInput.id))

    revalidarRh()
    return { salarioId: parsedInput.id }
  })

export const upsertEntregadorAction = authActionClient
  .schema(upsertEntregadorSchema)
  .action(async ({ parsedInput }) => {
    const valores = {
      funcionario_interno_id: parsedInput.funcionarioId,
      valor_diaria: toMoneyString(parsedInput.valorDiaria),
      taxa_entrega_percentual:
        parsedInput.taxaEntregaPercentual == null
          ? null
          : parsedInput.taxaEntregaPercentual.toFixed(2),
      folga_semanal: parsedInput.folgaSemanal ?? null,
    }

    // Um funcionário é entregador uma vez só (unique no banco): repetir o
    // cadastro é atualizar a diária, não criar uma segunda extensão.
    const [salvo] = await db
      .insert(entregador)
      .values(valores)
      .onConflictDoUpdate({
        target: entregador.funcionario_interno_id,
        set: {
          valor_diaria: valores.valor_diaria,
          taxa_entrega_percentual: valores.taxa_entrega_percentual,
          folga_semanal: valores.folga_semanal,
        },
      })
      .returning({ id: entregador.id })

    if (!salvo) throw new ActionError('Não foi possível salvar a diária')

    revalidarRh(parsedInput.funcionarioId)
    return { entregadorId: salvo.id }
  })

export const removerEntregadorAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(entregador)
      .where(eq(entregador.funcionario_interno_id, parsedInput.id))

    revalidarRh(parsedInput.id)
    return { funcionarioId: parsedInput.id }
  })

export const registrarAusenciaAction = authActionClient
  .schema(registrarAusenciaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const valores = {
      funcionario_interno_id: parsedInput.funcionarioId,
      tipo: parsedInput.tipo,
      data_inicio: parsedInput.dataInicio,
      data_fim: parsedInput.dataFim,
      observacao: parsedInput.observacao?.trim() || null,
      user_id: ctx.user.id,
    }

    if (parsedInput.id) {
      await db
        .update(ausencia_funcionario)
        .set(valores)
        .where(eq(ausencia_funcionario.id, parsedInput.id))

      revalidarRh(parsedInput.funcionarioId)
      return { ausenciaId: parsedInput.id }
    }

    const [criada] = await db
      .insert(ausencia_funcionario)
      .values(valores)
      .returning({ id: ausencia_funcionario.id })

    if (!criada) throw new ActionError('Não foi possível registrar a ausência')

    revalidarRh(parsedInput.funcionarioId)
    return { ausenciaId: criada.id }
  })

export const deleteAusenciaAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(ausencia_funcionario)
      .where(eq(ausencia_funcionario.id, parsedInput.id))

    revalidarRh()
    return { ausenciaId: parsedInput.id }
  })

export const upsertBeneficioAction = authActionClient
  .schema(upsertBeneficioSchema)
  .action(async ({ parsedInput }) => {
    const valores = {
      funcionario_interno_id: parsedInput.funcionarioId,
      tipo: parsedInput.tipo,
      valor: toMoneyString(parsedInput.valor),
      recorrente: parsedInput.recorrente,
      observacao: parsedInput.observacao?.trim() || null,
    }

    if (parsedInput.id) {
      await db
        .update(beneficio_funcionario)
        .set(valores)
        .where(eq(beneficio_funcionario.id, parsedInput.id))

      revalidarRh(parsedInput.funcionarioId)
      return { beneficioId: parsedInput.id }
    }

    const [criado] = await db
      .insert(beneficio_funcionario)
      .values(valores)
      .returning({ id: beneficio_funcionario.id })

    if (!criado) throw new ActionError('Não foi possível salvar o benefício')

    revalidarRh(parsedInput.funcionarioId)
    return { beneficioId: criado.id }
  })

export const alternarBeneficioAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const atual = await db.query.beneficio_funcionario.findFirst({
      where: eq(beneficio_funcionario.id, parsedInput.id),
      columns: { ativo: true, funcionario_interno_id: true },
    })
    if (!atual) throw new ActionError('Benefício não encontrado')

    await db
      .update(beneficio_funcionario)
      .set({ ativo: !atual.ativo })
      .where(eq(beneficio_funcionario.id, parsedInput.id))

    revalidarRh(atual.funcionario_interno_id)
    return { beneficioId: parsedInput.id, ativo: !atual.ativo }
  })

export const deleteBeneficioAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(beneficio_funcionario)
      .where(eq(beneficio_funcionario.id, parsedInput.id))

    revalidarRh()
    return { beneficioId: parsedInput.id }
  })

/**
 * Fechar a folha é o momento em que RH vira dinheiro: cabeçalho, linhas e uma
 * conta a pagar por linha, tudo num lote só. Se uma falhar, nenhuma passa — e
 * o financeiro nunca fica com meia folha lançada.
 *
 * O `unique(competencia)` no banco é o que impede fechar o mesmo mês duas
 * vezes; a checagem aqui só existe para devolver uma mensagem legível.
 */
export const fecharFolhaAction = authActionClient
  .schema(fecharFolhaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const jaExiste = await db.query.folha_pagamento.findFirst({
      where: eq(folha_pagamento.competencia, parsedInput.competencia),
      columns: { id: true },
    })

    if (jaExiste) {
      throw new ActionError(
        `A folha de ${rotuloCompetencia(parsedInput.competencia)} já foi fechada.`
      )
    }

    const [folha] = await db
      .insert(folha_pagamento)
      .values({
        competencia: parsedInput.competencia,
        data_vencimento: parsedInput.dataVencimento,
        observacao: parsedInput.observacao?.trim() || null,
        user_id: ctx.user.id,
      })
      .returning({ id: folha_pagamento.id })

    if (!folha) throw new ActionError('Não foi possível fechar a folha')

    // As linhas precisam existir antes das contas: é o id delas que vira
    // `origem_id`, o que liga cada conta ao funcionário certo.
    const itens = await db
      .insert(folha_item)
      .values(
        parsedInput.linhas.map((linha) => ({
          folha_id: folha.id,
          funcionario_interno_id: linha.funcionarioId,
          tipo: linha.tipo,
          descricao: linha.descricao,
          valor: toMoneyString(linha.valor),
          data_vencimento: linha.dataVencimento,
        }))
      )
      .returning({
        id: folha_item.id,
        funcionario_interno_id: folha_item.funcionario_interno_id,
        tipo: folha_item.tipo,
        descricao: folha_item.descricao,
        valor: folha_item.valor,
        data_vencimento: folha_item.data_vencimento,
      })

    const nomes = new Map(
      (
        await db.query.funcionario_interno.findMany({
          where: inArray(
            funcionario_interno.id,
            itens.map((item) => item.funcionario_interno_id)
          ),
          columns: { id: true, nome: true },
        })
      ).map((f) => [f.id, f.nome])
    )

    const rotulo = rotuloCompetencia(parsedInput.competencia)

    await executarLote(
      itens.map((item) =>
        planejarContaPagar({
          descricao: `${item.descricao} — ${nomes.get(item.funcionario_interno_id) ?? 'funcionário'} (${rotulo})`,
          categoria: 'fixa',
          subtipo: subtipoDespesa(item.tipo, item.descricao),
          valor: Number(item.valor),
          // Cada linha traz o próprio vencimento: o entregador recebe por
          // semana, o mensalista uma vez só.
          dataVencimento: item.data_vencimento ?? parsedInput.dataVencimento,
          origemTipo: 'folha_item',
          origemId: item.id,
          userId: ctx.user.id,
        })
      )
    )

    revalidarRh()
    return {
      folhaId: folha.id,
      linhas: itens.length,
      total: totalFolha(parsedInput.linhas),
    }
  })

/**
 * Desfazer apaga as contas geradas, porque `transacao_financeira` é uma lista
 * plana que se soma — não há saldo encadeado como no estoque. Mas se alguma já
 * foi quitada, o dinheiro saiu: aí não se desfaz.
 */
export const desfazerFolhaAction = authActionClient
  .schema(competenciaSchema)
  .action(async ({ parsedInput }) => {
    const folha = await db.query.folha_pagamento.findFirst({
      where: eq(folha_pagamento.competencia, parsedInput.competencia),
      with: { itens: { columns: { id: true } } },
    })

    if (!folha) throw new ActionError('Essa folha não foi fechada.')

    const ids = folha.itens.map((item) => item.id)
    const contas = ids.length
      ? await db
          .select({ id: conta_a_pagar.id, status: conta_a_pagar.status })
          .from(conta_a_pagar)
          .where(
            and(
              eq(conta_a_pagar.origem_tipo, 'folha_item'),
              inArray(conta_a_pagar.origem_id, ids)
            )
          )
      : []

    if (contas.some((conta) => conta.status === 'pago')) {
      throw new ActionError(
        'Alguma conta dessa folha já foi paga. Desfaça o pagamento no financeiro antes.'
      )
    }

    const statements: Statement[] = []
    if (contas.length) {
      statements.push(
        db.delete(conta_a_pagar).where(
          inArray(
            conta_a_pagar.id,
            contas.map((conta) => conta.id)
          )
        )
      )
    }
    // `folha_item` cai por cascade junto do cabeçalho.
    statements.push(
      db.delete(folha_pagamento).where(eq(folha_pagamento.id, folha.id))
    )

    await executarLote(statements)

    revalidarRh()
    return { competencia: parsedInput.competencia }
  })
