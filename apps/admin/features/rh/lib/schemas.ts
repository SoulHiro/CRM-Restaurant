import { z } from 'zod'

import {
  AUSENCIA_TIPOS,
  BENEFICIO_TIPOS,
  FOLHA_ITEM_TIPOS,
  MODELOS_CONTRATUAIS,
  MOTIVOS_DESLIGAMENTO,
  MOTIVOS_SALARIO,
  TURNOS_TRABALHO,
} from './types'

const dinheiro = z.coerce
  .number({ invalid_type_error: 'Informe um valor' })
  .min(0, 'Não pode ser negativo')
  .max(99_999_999, 'Valor alto demais')

const dinheiroPositivo = dinheiro.refine(
  (value) => value > 0,
  'Informe um valor maior que zero'
)

export const idSchema = z.object({ id: z.string().min(1) })
export type IdInput = z.infer<typeof idSchema>

export const upsertCargoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Informe o nome do cargo'),
  salarioBase: dinheiro,
  valorDiariaPadrao: dinheiro.optional(),
})

export type UpsertCargoInput = z.infer<typeof upsertCargoSchema>

export function upsertCargoDefaultValues(): UpsertCargoInput {
  return { nome: '', salarioBase: 0, valorDiariaPadrao: undefined }
}

/**
 * `cpf` é opcional no schema mas validado quando vem: um CPF errado só
 * aparece no contracheque, meses depois. A validação de dígito verificador
 * mora em `lib/crypto.ts` e é aplicada na action, que é onde o valor é
 * cifrado — o schema só garante o formato.
 */
export const admitirFuncionarioSchema = z
  .object({
    nome: z.string().min(1, 'Informe o nome'),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    cargoId: z.string().min(1, 'Escolha o cargo'),
    turno: z.enum(TURNOS_TRABALHO),
    modeloContratual: z.enum(MODELOS_CONTRATUAIS),
    dataAdmissao: z.string().min(1, 'Informe a data de admissão'),
    salarioInicial: dinheiro,
    // Preenchido só quando o cargo é de entregador.
    valorDiaria: dinheiro.optional(),
    taxaEntregaPercentual: z.coerce
      .number()
      .min(0, 'Não pode ser negativo')
      .max(100, 'No máximo 100%')
      .optional(),
    folgaSemanal: z.coerce.number().int().min(0).max(6).optional(),
    ehEntregador: z.boolean(),
  })
  .refine((v) => !v.ehEntregador || (v.valorDiaria ?? 0) > 0, {
    message: 'Entregador precisa de um valor de diária',
    path: ['valorDiaria'],
  })
  .refine((v) => v.ehEntregador || v.salarioInicial > 0, {
    message: 'Informe o salário inicial',
    path: ['salarioInicial'],
  })

export type AdmitirFuncionarioInput = z.infer<typeof admitirFuncionarioSchema>

export function admitirFuncionarioDefaultValues(
  hoje: string
): AdmitirFuncionarioInput {
  return {
    nome: '',
    cpf: '',
    cnpj: '',
    cargoId: '',
    turno: 'dia',
    modeloContratual: 'CLT',
    dataAdmissao: hoje,
    salarioInicial: 0,
    valorDiaria: undefined,
    taxaEntregaPercentual: undefined,
    folgaSemanal: undefined,
    ehEntregador: false,
  }
}

/** Editar não mexe em salário: reajuste tem drawer e histórico próprios. */
export const editarFuncionarioSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1, 'Informe o nome'),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  cargoId: z.string().min(1, 'Escolha o cargo'),
  turno: z.enum(TURNOS_TRABALHO),
  modeloContratual: z.enum(MODELOS_CONTRATUAIS),
  dataAdmissao: z.string().min(1, 'Informe a data de admissão'),
})

export type EditarFuncionarioInput = z.infer<typeof editarFuncionarioSchema>

export const desligarFuncionarioSchema = z.object({
  id: z.string().min(1),
  dataDesligamento: z.string().min(1, 'Informe a data'),
  motivo: z.enum(MOTIVOS_DESLIGAMENTO),
  observacao: z.string().optional(),
})

export type DesligarFuncionarioInput = z.infer<
  typeof desligarFuncionarioSchema
>

export const registrarSalarioSchema = z.object({
  funcionarioId: z.string().min(1),
  valor: dinheiroPositivo,
  vigenteDesde: z.string().min(1, 'Informe a partir de quando vale'),
  motivo: z.enum(MOTIVOS_SALARIO),
  observacao: z.string().optional(),
})

export type RegistrarSalarioInput = z.infer<typeof registrarSalarioSchema>

export function registrarSalarioDefaultValues(
  funcionarioId: string,
  hoje: string
): RegistrarSalarioInput {
  return {
    funcionarioId,
    valor: 0,
    vigenteDesde: hoje,
    motivo: 'reajuste',
    observacao: '',
  }
}

export const upsertEntregadorSchema = z.object({
  funcionarioId: z.string().min(1),
  valorDiaria: dinheiroPositivo,
  taxaEntregaPercentual: z.coerce
    .number()
    .min(0, 'Não pode ser negativo')
    .max(100, 'No máximo 100%')
    .optional(),
  // 0 = domingo … 6 = sábado; ausente quando não há dia fixo de folga.
  folgaSemanal: z.coerce
    .number()
    .int()
    .min(0)
    .max(6)
    .optional(),
})

export type UpsertEntregadorInput = z.infer<typeof upsertEntregadorSchema>

export const registrarAusenciaSchema = z
  .object({
    id: z.string().optional(),
    funcionarioId: z.string().min(1),
    tipo: z.enum(AUSENCIA_TIPOS),
    dataInicio: z.string().min(1, 'Informe o início'),
    dataFim: z.string().min(1, 'Informe o fim'),
    observacao: z.string().optional(),
  })
  .refine((v) => v.dataFim >= v.dataInicio, {
    message: 'O fim não pode ser antes do início',
    path: ['dataFim'],
  })

export type RegistrarAusenciaInput = z.infer<typeof registrarAusenciaSchema>

export function registrarAusenciaDefaultValues(
  funcionarioId: string,
  hoje: string
): RegistrarAusenciaInput {
  return {
    funcionarioId,
    tipo: 'atestado_medico',
    dataInicio: hoje,
    dataFim: hoje,
    observacao: '',
  }
}

export const upsertBeneficioSchema = z.object({
  id: z.string().optional(),
  funcionarioId: z.string().min(1),
  tipo: z.enum(BENEFICIO_TIPOS),
  valor: dinheiroPositivo,
  recorrente: z.boolean(),
  observacao: z.string().optional(),
})

export type UpsertBeneficioInput = z.infer<typeof upsertBeneficioSchema>

export function upsertBeneficioDefaultValues(
  funcionarioId: string
): UpsertBeneficioInput {
  return {
    funcionarioId,
    tipo: 'vale_transporte',
    valor: 0,
    recorrente: true,
    observacao: '',
  }
}

const COMPETENCIA = /^\d{4}-\d{2}$/

export const fecharFolhaSchema = z.object({
  competencia: z.string().regex(COMPETENCIA, 'Competência inválida'),
  dataVencimento: z.string().min(1, 'Informe o vencimento'),
  observacao: z.string().optional(),
  linhas: z
    .array(
      z.object({
        funcionarioId: z.string().min(1),
        tipo: z.enum(FOLHA_ITEM_TIPOS),
        descricao: z.string().min(1),
        valor: dinheiro,
        dataVencimento: z.string().min(1, 'Informe o vencimento da linha'),
      })
    )
    .min(1, 'A folha não tem nenhuma linha para fechar'),
})

export type FecharFolhaInput = z.infer<typeof fecharFolhaSchema>

export const competenciaSchema = z.object({
  competencia: z.string().regex(COMPETENCIA, 'Competência inválida'),
})

export type CompetenciaInput = z.infer<typeof competenciaSchema>
