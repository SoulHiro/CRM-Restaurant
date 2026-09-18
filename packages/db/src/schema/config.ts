import {
  boolean,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

import { organization } from './auth'

export const impressoraTipoEnum = pgEnum('impressora_tipo', [
  'comanda',
  'etiqueta',
  'pesagem',
])

export const impressora = pgTable('impressora', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  tipo: impressoraTipoEnum('tipo').notNull(),
  identificador_qz: text('identificador_qz').notNull(),
  ativo: boolean('ativo').notNull().default(true),
})

/**
 * Singleton — sempre uma linha só, id fixo (não CUID). Um único layout de
 * comanda vale pro restaurante inteiro; não há tela nem necessidade de
 * layout por empresa hoje.
 */
export const configuracaoComanda = pgTable('configuracao_comanda', {
  id: text('id').primaryKey().default('default'),
  // Chaves dos campos opcionais, na ordem em que aparecem na comanda —
  // um campo ausente da lista é um campo escondido. O nome do colaborador
  // não entra aqui: é sempre o topo fixo da comanda.
  campos: jsonb('campos').$type<string[]>().notNull(),
  // Qual `impressora` (tipo comanda) recebe os pedidos — nullable: sem
  // escolha ainda, cai no fallback de "primeira comanda ativa".
  impressora_id: text('impressora_id').references(() => impressora.id, {
    onDelete: 'set null',
  }),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * Singleton — mesma ideia de `configuracaoComanda`. Nome/endereço/CNPJ/IE do
 * restaurante NÃO moram aqui — são fixos, vivem em `NEXT_PUBLIC_RESTAURANTE_*`
 * (ver `apps/admin/lib/dados-restaurante.ts`); as colunas correspondentes
 * ainda existem fisicamente no Neon, sem uso, para evitar um DROP COLUMN
 * destrutivo. Café/suco/lanche não têm preço padrão global, são digitados na
 * hora, direto no drawer "Finalizar dia" de cada empresa.
 */
export const configuracaoResumoDia = pgTable('configuracao_resumo_dia', {
  id: text('id').primaryKey().default('default'),
  // URL de imagem já hospedada — sem upload de arquivo configurado ainda
  // (sem token do Vercel Blob), mesmo padrão de "cola o link" já usado em
  // outros lugares do app enquanto isso não existe.
  logo_url: text('logo_url'),
  cor_marca: text('cor_marca'),
  // Ordem/visibilidade das linhas do cabeçalho da nota de fechamento do dia
  // (nome, endereço, CNPJ+IE) — mesma ideia de `configuracaoComanda.campos`,
  // só que pro resumo do dia em vez da comanda.
  layout_campos: jsonb('layout_campos').$type<string[]>(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * Singleton — mesma ideia de `configuracaoComanda`, mas pro papel de
 * pesagem (empresas com `empresa.fluxo_pedido = 'pesagem'`). Sem `campos`:
 * o layout desse papel não é configurável por enquanto.
 */
export const configuracaoPesagem = pgTable('configuracao_pesagem', {
  id: text('id').primaryKey().default('default'),
  impressora_id: text('impressora_id').references(() => impressora.id, {
    onDelete: 'set null',
  }),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * Singleton — horários de funcionamento do restaurante. `HH:mm` em texto
 * (não `time`) pra ficar direto pra comparar/exibir sem lidar com fuso; a
 * validação de formato fica na Server Action, não no banco. Usado pelo
 * toggle rápido "aparece no almoço/janta" de `produto` (catalogo.ts) e,
 * futuramente, pra abrir/fechar automaticamente o delivery/salão.
 */
export const configuracaoHorarioFuncionamento = pgTable(
  'configuracao_horario_funcionamento',
  {
    id: text('id').primaryKey().default('default'),
    almoco_inicio: text('almoco_inicio'),
    almoco_fim: text('almoco_fim'),
    janta_inicio: text('janta_inicio'),
    janta_fim: text('janta_fim'),
    delivery_abre: text('delivery_abre'),
    delivery_fecha: text('delivery_fecha'),
    local_abre: text('local_abre'),
    local_fecha: text('local_fecha'),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  }
)

/**
 * Singleton — os números que alimentam o cálculo de preço sugerido e a cor
 * de margem do catálogo (ver features/catalogo/lib/precificacao-helpers.ts).
 * Os 4 limiares nascem com um padrão razoável e ficam editáveis aqui, sem
 * precisar mexer em código pra ajustar a faixa de cada cor.
 */
export const configuracaoPrecificacao = pgTable(
  'configuracao_precificacao',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    // Um registro por organização — Nosso Quintal (marmita) e Diniz Gourmet
    // (hambúrguer/bebida) têm estrutura de custo e margem completamente
    // diferentes, não faz sentido compartilhar os mesmos limiares.
    organization_id: text('organization_id').references(() => organization.id),
    custo_operacional_por_minuto: numeric('custo_operacional_por_minuto', {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default('0'),
    // Percentual de margem sobre o custo de produção — abaixo de amarelo é
    // vermelho (prejuízo), acima de roxo é lucro excessivo demais.
    limiar_amarelo_pct: numeric('limiar_amarelo_pct', { precision: 6, scale: 2 })
      .notNull()
      .default('0'),
    limiar_verde_pct: numeric('limiar_verde_pct', { precision: 6, scale: 2 })
      .notNull()
      .default('30'),
    limiar_azul_pct: numeric('limiar_azul_pct', { precision: 6, scale: 2 })
      .notNull()
      .default('100'),
    limiar_roxo_pct: numeric('limiar_roxo_pct', { precision: 6, scale: 2 })
      .notNull()
      .default('200'),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.organization_id),
    index('configuracao_precificacao_organization_idx').on(t.organization_id),
  ]
)
