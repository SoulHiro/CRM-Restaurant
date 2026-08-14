import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

import { user } from './auth'

export const turnoTrabalhoEnum = pgEnum('turno_trabalho', [
  'dia',
  'noite',
  'ambos',
])

/**
 * Um enum só para todos os vínculos, inclusive os do entregador (MEI,
 * informal). O entregador é uma extensão do funcionário, então ter um segundo
 * `modelo_contratual` na extensão só abriria espaço para os dois discordarem.
 */
export const modeloContratualEnum = pgEnum('modelo_contratual', [
  'CLT',
  'PJ',
  'MEI',
  'temporario',
  'estagio',
  'informal',
])

export const funcionarioStatusEnum = pgEnum('funcionario_interno_status', [
  'ativo',
  'desligado',
])

export const motivoDesligamentoEnum = pgEnum('motivo_desligamento', [
  'dispensado_sem_justa_causa',
  'dispensado_com_justa_causa',
  'pedido_demissao',
  'fim_contrato',
])

export const motivoSalarioEnum = pgEnum('motivo_salario', [
  'admissao',
  'reajuste',
  'promocao',
  'acordo',
])

export const ausenciaTipoEnum = pgEnum('ausencia_tipo', [
  'atestado_medico',
  'folga',
  'ferias',
  'falta_justificada',
  'falta_injustificada',
])

export const beneficioTipoEnum = pgEnum('beneficio_tipo', [
  'vale_transporte',
  'vale_refeicao',
  'bonus',
  'outro',
])

export const folhaItemTipoEnum = pgEnum('folha_item_tipo', [
  'salario',
  'diaria',
  'beneficio',
])

const DINHEIRO = { precision: 12, scale: 2 } as const

export const cargo = pgTable('cargo', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  salario_base: numeric('salario_base', DINHEIRO).notNull(),
  // Cargo que paga por diária em vez de salário fixo (entregador). Os dois
  // convivem: o cargo sugere o valor, cada pessoa pode ter o seu.
  valor_diaria_padrao: numeric('valor_diaria_padrao', DINHEIRO),
  ativo: boolean('ativo').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

/**
 * Quem trabalha no restaurante. Não confundir com `funcionario`, que é o
 * funcionário da empresa-cliente (quem pede marmita).
 *
 * O CPF nunca é gravado em claro: `cpf_cifrado` é AES-256-GCM e `cpf_final`
 * guarda só os últimos dígitos, para exibir e buscar sem decifrar a tabela
 * inteira. Ver `apps/admin/lib/crypto.ts`.
 */
export const funcionario_interno = pgTable(
  'funcionario_interno',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    nome: text('nome').notNull(),
    cpf_cifrado: text('cpf_cifrado'),
    cpf_final: text('cpf_final'),
    cnpj: text('cnpj'),
    cargo_id: text('cargo_id')
      .notNull()
      .references(() => cargo.id),
    turno: turnoTrabalhoEnum('turno').notNull().default('dia'),
    modelo_contratual: modeloContratualEnum('modelo_contratual')
      .notNull()
      .default('CLT'),
    data_admissao: date('data_admissao').notNull(),
    data_desligamento: date('data_desligamento'),
    status: funcionarioStatusEnum('status').notNull().default('ativo'),
    motivo_desligamento: motivoDesligamentoEnum('motivo_desligamento'),
    // Só quem tem login no sistema (admin/caixa/financeiro/cozinha).
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('funcionario_interno_status_idx').on(t.status),
    index('funcionario_interno_cargo_idx').on(t.cargo_id),
  ]
)

/**
 * Salário é linha, não coluna: um reajuste hoje não pode reescrever a folha de
 * um mês já fechado. O valor atual é derivado (última vigência <= a data), o
 * mesmo desenho de `historico_preco_insumo` no estoque.
 */
export const historico_salario = pgTable(
  'historico_salario',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    funcionario_interno_id: text('funcionario_interno_id')
      .notNull()
      .references(() => funcionario_interno.id, { onDelete: 'cascade' }),
    valor: numeric('valor', DINHEIRO).notNull(),
    vigente_desde: date('vigente_desde').notNull(),
    motivo: motivoSalarioEnum('motivo').notNull().default('reajuste'),
    observacao: text('observacao'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('historico_salario_func_idx').on(
      t.funcionario_interno_id,
      t.vigente_desde
    ),
  ]
)

/**
 * Extensão, não pessoa: entregador É um `funcionario_interno` que também
 * recebe por diária. O `unique` garante que ninguém vire entregador duas
 * vezes. Sem zona fixa — o modelo é flexível.
 */
export const entregador = pgTable('entregador', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  funcionario_interno_id: text('funcionario_interno_id')
    .notNull()
    .unique()
    .references(() => funcionario_interno.id, { onDelete: 'cascade' }),
  valor_diaria: numeric('valor_diaria', DINHEIRO).notNull(),
  taxa_entrega_percentual: numeric('taxa_entrega_percentual', {
    precision: 5,
    scale: 2,
  }),
  /**
   * Dia fixo de folga na semana (0 = domingo … 6 = sábado), no padrão do
   * `getUTCDay`. Nullable porque nem todo entregador tem dia fixo — quem só
   * entra no rodízio de sábado registra a folga como ausência quando ela cai.
   */
  folga_semanal: integer('folga_semanal'),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const ausencia_funcionario = pgTable(
  'ausencia_funcionario',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    funcionario_interno_id: text('funcionario_interno_id')
      .notNull()
      .references(() => funcionario_interno.id, { onDelete: 'cascade' }),
    tipo: ausenciaTipoEnum('tipo').notNull(),
    data_inicio: date('data_inicio').notNull(),
    data_fim: date('data_fim').notNull(),
    // Vercel Blob — o campo nasce aqui, o upload liga quando houver token.
    documento_anexo: text('documento_anexo'),
    observacao: text('observacao'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('ausencia_funcionario_idx').on(
      t.funcionario_interno_id,
      t.data_inicio
    ),
  ]
)

export const beneficio_funcionario = pgTable(
  'beneficio_funcionario',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    funcionario_interno_id: text('funcionario_interno_id')
      .notNull()
      .references(() => funcionario_interno.id, { onDelete: 'cascade' }),
    tipo: beneficioTipoEnum('tipo').notNull(),
    valor: numeric('valor', DINHEIRO).notNull(),
    // Recorrente entra na folha de todo mês; o resto é lançamento avulso.
    recorrente: boolean('recorrente').notNull().default(true),
    ativo: boolean('ativo').notNull().default(true),
    observacao: text('observacao'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('beneficio_funcionario_idx').on(t.funcionario_interno_id)]
)

/**
 * Cabeçalho da competência. `competencia` é UNIQUE — é o que impede fechar o
 * mesmo mês duas vezes e gerar a folha em dobro no financeiro.
 */
export const folha_pagamento = pgTable('folha_pagamento', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  competencia: text('competencia').notNull().unique(),
  data_vencimento: date('data_vencimento').notNull(),
  observacao: text('observacao'),
  user_id: text('user_id').references(() => user.id),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const folha_item = pgTable(
  'folha_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    folha_id: text('folha_id')
      .notNull()
      .references(() => folha_pagamento.id, { onDelete: 'cascade' }),
    funcionario_interno_id: text('funcionario_interno_id')
      .notNull()
      .references(() => funcionario_interno.id),
    tipo: folhaItemTipoEnum('tipo').notNull(),
    descricao: text('descricao').notNull(),
    valor: numeric('valor', DINHEIRO).notNull(),
    /**
     * Vencimento próprio da linha. Entregador recebe por semana, então cada
     * semana do mês vence num dia diferente; nulo cai no vencimento da folha,
     * que é o caso do mensalista.
     */
    data_vencimento: date('data_vencimento'),
  },
  (t) => [
    unique().on(t.folha_id, t.funcionario_interno_id, t.tipo, t.descricao),
    index('folha_item_folha_idx').on(t.folha_id),
  ]
)

export const cargoRelations = relations(cargo, ({ many }) => ({
  funcionarios: many(funcionario_interno),
}))

export const funcionarioInternoRelations = relations(
  funcionario_interno,
  ({ one, many }) => ({
    cargo: one(cargo, {
      fields: [funcionario_interno.cargo_id],
      references: [cargo.id],
    }),
    usuario: one(user, {
      fields: [funcionario_interno.user_id],
      references: [user.id],
    }),
    entregador: one(entregador),
    salarios: many(historico_salario),
    ausencias: many(ausencia_funcionario),
    beneficios: many(beneficio_funcionario),
    itensFolha: many(folha_item),
  })
)

export const historicoSalarioRelations = relations(
  historico_salario,
  ({ one }) => ({
    funcionario: one(funcionario_interno, {
      fields: [historico_salario.funcionario_interno_id],
      references: [funcionario_interno.id],
    }),
    usuario: one(user, {
      fields: [historico_salario.user_id],
      references: [user.id],
    }),
  })
)

export const entregadorRelations = relations(entregador, ({ one }) => ({
  funcionario: one(funcionario_interno, {
    fields: [entregador.funcionario_interno_id],
    references: [funcionario_interno.id],
  }),
}))

export const ausenciaFuncionarioRelations = relations(
  ausencia_funcionario,
  ({ one }) => ({
    funcionario: one(funcionario_interno, {
      fields: [ausencia_funcionario.funcionario_interno_id],
      references: [funcionario_interno.id],
    }),
    usuario: one(user, {
      fields: [ausencia_funcionario.user_id],
      references: [user.id],
    }),
  })
)

export const beneficioFuncionarioRelations = relations(
  beneficio_funcionario,
  ({ one }) => ({
    funcionario: one(funcionario_interno, {
      fields: [beneficio_funcionario.funcionario_interno_id],
      references: [funcionario_interno.id],
    }),
  })
)

export const folhaPagamentoRelations = relations(
  folha_pagamento,
  ({ one, many }) => ({
    itens: many(folha_item),
    usuario: one(user, {
      fields: [folha_pagamento.user_id],
      references: [user.id],
    }),
  })
)

export const folhaItemRelations = relations(folha_item, ({ one }) => ({
  folha: one(folha_pagamento, {
    fields: [folha_item.folha_id],
    references: [folha_pagamento.id],
  }),
  funcionario: one(funcionario_interno, {
    fields: [folha_item.funcionario_interno_id],
    references: [funcionario_interno.id],
  }),
}))
