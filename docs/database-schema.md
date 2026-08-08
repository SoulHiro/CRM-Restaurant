# Schema de Banco de Dados — Nosso Quintal (v2, consolidado)

> Modelo completo e validado — resultado de rodada de perguntas, validação de relacionamentos e auditoria final. Documento de referência única para implementação. Ver também o Notion (🥘 Nosso Quintal) para o racional completo de cada decisão.

## Auth

```
user (Better Auth)

user_role
  - user_id (FK)
  - role: admin | caixa | financeiro | cozinha | garcom | empresa | funcionario | cliente
  -- usuário pode ter mais de um role
```

## Empresa

```
empresa
  - id, nome, endereco, zona, email_contato, telefone_contato
  - external_code_consumer (código do cliente no Consumer — para fase futura de integração)
  - status: ativo | inativo
  - created_at

empresa_contrato
  - id, empresa_id (FK)
  - arquivo_url (Vercel Blob)
  - valor, vigencia_inicio, vigencia_fim, prazo_pagamento
  - vigente (bool)
  - uploaded_at

empresa_pausa_dia
  - id, empresa_id (FK), data
  - motivo (nullable)
  -- presença de registro = empresa optou por não ter pedido nesse dia

reconciliacao_funcionario
  - id, empresa_id (FK)
  - arquivo_excel (Vercel Blob)
  - data_envio
  - funcionarios_adicionados (JSON)
  - funcionarios_removidos (JSON)
  - status: pendente | processado
  - processado_por (user_id FK, nullable)
```

## Turno / Setor

```
turno
  - id, empresa_id (FK), nome
  - horario_inicio, horario_fim
  - refeicao_gerada: almoco | janta
  - modalidade (ex: transport | marmita)
  - forms_link_slug (UNIQUE)

setor
  - id, turno_id (FK), nome
  -- todo turno tem pelo menos 1 setor (criar "Geral" quando não subdivide)
```

## Funcionário (empresa-cliente — pessoa GLOBAL, N:N com empresa)

```
funcionario
  - id
  - nome (obrigatório)
  - cpf (obrigatório, ENCRYPTED)
  - whatsapp (opcional)
  - restricao_alimentar (nullable) -- DEVE constar no template de impressão de comanda/etiqueta

funcionario_empresa
  - id, funcionario_id (FK), setor_id (FK)
  - status: ativo | inativo
  - data_vinculo
  -- UNIQUE: sem 2 vínculos ATIVOS simultâneos entre mesmo funcionário e mesma empresa
  -- empresa é sempre derivada via setor → turno → empresa (nunca duplicar empresa_id aqui)
```

## Cardápio (GLOBAL — não varia por empresa, mesmo pool almoço/janta)

```
categoria_prato
  - id, nome (ex: massa, carne_vermelha, frango, peixe, salada)
  -- usado no sorteio para evitar repetir categoria em dias seguidos

prato
  - id, nome, categoria_id (FK)

prato_tamanho_preco
  - id, prato_id (FK), tamanho: P | M | G
  - preco, external_code (Consumer — cada tamanho é um SKU diferente)
  -- UNIQUE (prato_id, tamanho)

item_adicional
  - id, nome, preco, external_code

ficha_tecnica_item
  - id, prato_id (FK), tamanho: P | M | G
  - insumo, quantidade, unidade

cardapio_dia
  - id, data, prato_id (FK)
  - destaque (bool — "prato do dia")
  -- UNIQUE (data, prato_id)
```

## Pedido

```
pedido
  - id, funcionario_empresa_id (FK)
  - cardapio_dia_id (FK) -- garante prato disponível naquele dia
  - tamanho: P | M | G
  - status_impressao: pendente | impresso | erro_impressao
  - motivo_erro (nullable)
  - envio_consumer_id (FK, nullable) -- FASE INICIAL: pode ficar sempre null (lançamento manual)
  - created_at, updated_at
  -- editável pelo funcionário via link público SOMENTE para data > hoje
  -- atualização gera notificação (Pusher) para o caixa reimprimir

pedido_item_adicional (N:N)
  - pedido_id (FK), item_adicional_id (FK)
```

## Consumer (integração fiscal — FASE FUTURA, manual por enquanto)

```
envio_consumer
  - id, empresa_id (FK), data
  - status: enviado | confirmado | erro
  - nota_fiscal_numero, nota_fiscal_chave_acesso, nota_fiscal_emitida_em
  - created_at
```

## Configurações

```
impressora
  - id, nome, tipo: comanda | etiqueta
  - identificador_qz
  - ativo
```

## Estoque (fonte de verdade PRÓPRIA — não espelho do AnotaAí) — IMPLEMENTADO

```
estoque_item
  - id, nome, unidade: un | kg | g | l | ml | cx | pct
  - quantidade_atual, ponto_reposicao   -- numeric(12,3)
  - validade (nullable, quando aplicável)
  - fornecedor_padrao_id (FK, nullable)
  - ativo (bool) -- soft-delete: preserva histórico, some da lista e das contagens
  - created_at, updated_at
  -- índices: nome, ativo, validade

estoque_movimento                       -- livro-razão append-only
  - id, estoque_item_id (FK)
  - tipo: entrada_compra | perda | ajuste_inventario | baixa_venda | ajuste_manual
  - quantidade (ASSINADA — negativa em saída), saldo_resultante
  - origem_tipo, origem_id (nullable)   -- perda | inventario | compra
  - observacao, user_id (FK, nullable), created_at
  -- índice: (estoque_item_id, created_at)

perda_estoque
  - id, estoque_item_id (FK)
  - quantidade, motivo: vencido | quebra | erro_preparo | outro
  - data, responsavel, user_id (FK, nullable), observacao, created_at
  -- índices: data, estoque_item_id

historico_preco_insumo
  - id, estoque_item_id (FK), fornecedor_id (FK, nullable)
  - preco, data_vigencia, created_at
  -- índice: (estoque_item_id, data_vigencia)

inventario_fisico                       -- cabeçalho da contagem
  - id, data, responsavel
  - status: em_andamento | finalizado
  - observacao, created_at, finalizado_em (nullable)

inventario_fisico_item                  -- linhas da contagem
  - id, inventario_id (FK, cascade), estoque_item_id (FK, cascade)
  - quantidade_sistema  -- snapshot congelado na abertura
  - quantidade_contada (nullable — null = ainda não contado)
  - diferenca (nullable)
  -- UNIQUE (inventario_id, estoque_item_id)
```

**`estoque_movimento` é o único caminho que altera `quantidade_atual`** (helper
`features/estoque/lib/aplicar-movimento.ts`). `quantidade_atual` é cache
denormalizado; o histórico de por que o saldo mudou vive no livro-razão. Isso é
o que permite a baixa automática por venda entrar depois sem refatoração.

**`inventario_fisico` é cabeçalho + linhas**, não a tabela plana do desenho
original — permite contagem parcial persistida e duas contagens no mesmo dia
sem ambiguidade.

**Alertas:** hoje derivados por query no servidor (`quantidade_atual <=
ponto_reposicao` e `validade <= hoje + 3 dias`), exibidos no painel de
`/estoque`. Pusher entra como publish adicional quando houver credencial —
sem mudança de schema.
**Fluxo de baixa:** venda de qualquer canal → consulta ficha_tecnica_item →
grava movimento `baixa_venda` → decrementa estoque_item. **Fase futura.**

## Compras e Fornecedores

`fornecedor` já existe no banco (criado junto com o módulo de Estoque, para
que `estoque_item.fornecedor_padrao_id` e `historico_preco_insumo.fornecedor_id`
fossem FKs reais desde o início). Ainda **sem UI** — entra na Fase 2.

```
fornecedor
  - id, nome, contato, prazo_entrega_dias, prazo_pagamento, created_at

fornecedor_item (N:N — múltiplos fornecedores por insumo)
  - fornecedor_id (FK), estoque_item_id (FK)
  - preco, prazo_entrega_dias

compra
  - id, fornecedor_id (FK), estoque_item_id (FK)
  - item, quantidade, valor_unitario
  - numero_nota_fiscal
  - arquivo_nota_fiscal (Vercel Blob — PDF)
  - categoria_despesa: insumo | equipamento | manutencao | outro
  - status: pedido_feito | aguardando_entrega | recebido
  - data_pedido, data_recebimento (nullable), forma_pagamento

avaliacao_fornecedor
  - id, fornecedor_id (FK)
  - data, nota (1-5), observacao
  - tipo: atraso | qualidade | produto_vencido | outro
```

## Financeiro Consolidado — IMPLEMENTADO (Fase 2a)

```
transacao_financeira                    -- livro-razão do dinheiro, fonte ÚNICA do DRE
  - id, tipo: receita | despesa
  - origem: manual | anotai | ifood | pagbank | marmita_b2b
  - valor          -- numeric(12,2), SEMPRE positivo; o sinal vem de `tipo`
  - data, descricao
  - categoria: fixa | variavel (nullable — só despesa)
  - subtipo: aluguel | salario | vale_transporte | imposto | fornecedor |
             insumo | equipamento | manutencao | taxa_plataforma | outro (nullable)
  - origem_tipo, origem_id (nullable)   -- conta_a_pagar | conta_a_receber_b2b
  - referencia_externa, sincronizado_em (nullable)  -- prontos p/ integração futura
  - user_id (FK, nullable), created_at
  -- índices: data, (tipo,data), origem, (origem_tipo,origem_id)

conta_a_pagar
  - id, descricao, categoria, subtipo
  - valor, data_vencimento
  - status: pendente | pago
  - data_pagamento (nullable), observacao, user_id (nullable), created_at

conta_a_receber_b2b
  - id, empresa_id (FK, NULLABLE), empresa_nome (text, obrigatório)
  - periodo (ex: "2026-08"), valor, data_vencimento
  - status: pendente | pago
  - data_pagamento (nullable), observacao, user_id (nullable), created_at

meta
  - id, descricao, tipo: financeira | operacional
  - valor_alvo (nullable), inicio, prazo, ativa, created_at

progresso_meta                          -- só aportes/retiradas manuais
  - id, meta_id (FK cascade), data
  - valor          -- DELTA (+aporte / −retirada), não total acumulado
  - origem: dre_automatico | ajuste_manual
  - observacao, user_id (nullable), created_at
```

**A regra que sustenta o módulo:** `transacao_financeira` é para dinheiro o que
`estoque_movimento` é para estoque. Conta a pagar/receber é **previsão** e nunca entra
no DRE direto — só vira linha no livro-razão quando marcada como paga, e a transação
nasce no mesmo `db.batch` da mudança de status. Desfazer o pagamento apaga a transação
vinculada. É isso que impede o mesmo dinheiro ser contado duas vezes.

**Três desvios deliberados do desenho original:**

1. `status` guarda só `pendente | pago` — **"atrasado" é derivado** (`pendente &&
   vencimento < hoje`). Guardar as três exigiria um job para virar pendente→atrasado;
   sem ele rodando, o dado mentiria. Mesmo princípio dos alertas de estoque.
2. `meta.inicio` é campo novo — somar "o lucro desde o começo do período" exige uma
   data de partida.
3. `progresso_meta.valor` é delta, não `valor_acumulado`: o progresso automático é
   calculado ao vivo do DRE, então a tabela só guarda o que o DRE não enxerga.

**DRE Simplificado:** Receita − Despesa = Lucro, por mês, lido só de `transacao_financeira`.
Separa despesa fixa de variável para mostrar o ponto de equilíbrio.
**Margem por Canal:** agrupa `transacao_financeira` por origem (iFood 12-26,5%, AnotaAí 0%
de comissão — desconto entra na fase de integração).
**Ainda fora (Fase 2b):** `compra`, `fornecedor_item`, `avaliacao_fornecedor` e a UI de
fornecedor. A tabela `fornecedor` já existe desde a Fase 1.

## Metas (unificado — inclui Meta de Novembro)

```
meta
  - id, descricao, prazo
  - tipo: financeira | operacional
  - valor_alvo (nullable, preenchido quando tipo=financeira)

melhoria
  - id, meta_id (FK)
  - descricao, valor_estimado, prioridade, status: ideia | planejado | em_execucao | concluido

progresso_meta
  - id, meta_id (FK)
  - data, valor_acumulado
  - origem: dre_automatico | ajuste_manual
```

## RH Interno — PRIORIDADE DE IMPLEMENTAÇÃO (em sequência)

```
cargo
  - id, nome (ex: Cozinheiro, Caixa, Garçom, Entregador)
  - salario_base

funcionarios_internos
  - id, nome
  - cpf (ENCRYPTED)
  - cnpj (nullable — apenas se modelo_contratual = PJ)
  - cargo_id (FK)
  - salario (herda de cargo.salario_base, com ajuste individual opcional)
  - turno: dia | noite | ambos
  - modelo_contratual: CLT | PJ | temporario | estagio
  - data_admissao
  - status: ativo | desligado
  - motivo_desligamento: dispensado_sem_justa_causa | dispensado_com_justa_causa | pedido_demissao | fim_contrato (nullable)
  - user_id (FK, nullable — apenas quem tem login no sistema: admin/caixa/financeiro/cozinha)

entregador (extensão de funcionarios_internos)
  - funcionario_interno_id (FK)
  - valor_diaria (R$100, fixo para todos)
  - taxa_entrega_percentual (repasse quando aplicável)
  - modelo_contratual: CLT | MEI | informal
  -- SEM zona fixa (modelo flexível confirmado)

ausencia_funcionario
  - id, funcionario_interno_id (FK)
  - tipo: atestado_medico | folga | ferias | falta_justificada | falta_injustificada
  - data_inicio, data_fim
  - documento_anexo (Vercel Blob, nullable)
  - observacao

beneficio_funcionario
  - id, funcionario_interno_id (FK)
  - tipo: vale_transporte | outro
  - valor, data_referencia
  - status: pago | pendente | atrasado
  -- alimenta conta_a_pagar (Financeiro)
```

## Ocorrências e Feedback

```
ocorrencia
  - id, data_hora
  - tipo: reclamacao | elogio | erro_operacional
  - origem: salao | ifood | anotai | whatsapp | entrega
  - vinculado_tipo: cliente | empresa | funcionario | entregador
  - vinculado_id
  - pedido_id (FK, nullable)
  - gravidade: baixa | media | alta
  - suspeita_fraude (bool)
  - sinais_observados (texto, nullable)
  - descricao
  - acao_envolvido (o que foi feito com a pessoa envolvida)
  - acao_preventiva (o que mudou estruturalmente, nullable)
  - status: aberto | em_resolucao | resolvido
  - responsavel
```

**SLA de resposta:** Alta = mesmo dia | Média = 24h | Baixa = 48h.

## CRM de Clientes

```
cliente
  - id, nome, telefone, canal_preferido
  - segmento: avulso | b2b
  -- Escopo: apenas Nosso Quintal. Diniz Gourmet é negócio separado, fora deste CRM.

historico_pedido_cliente
  - id, cliente_id (FK), canal, data, valor
```

## Fiado

```
fiado
  - id
  - cliente_id (FK, nullable — conecta ao CRM quando existir cadastro)
  - cliente_nome (texto, fallback quando não há cliente_id)
  - valor, data_pedido, data_vencimento, data_pagamento (nullable)
  - status: pendente | pago | atrasado
```

## Documentos e Compliance

```
documentos_ativos_compliance
  - id, item
  - negocio: nosso_quintal | diniz_gourmet
  - tipo: licenca | validade_item | manutencao
  - data_vencimento
  - status: ok | proximo_vencimento | vencido | manutencao_agendada | em_andamento | concluida
  - responsavel
```

## Entregas

```
entregador -- ver RH Interno (extensão de funcionarios_internos), NÃO tabela standalone
```

## Auditoria

```
audit_log
  - id
  - user_id (FK, nullable)
  - ator_descricao (nullable — para eventos sem login, ex: funcionário via link público)
  - acao (ex: login, imprimiu_pedidos, editou_cardapio, erro_impressao)
  - detalhes (JSON)
  - created_at
```

---

## Notas críticas para implementação

1. **CPF sempre criptografado** — funcionario.cpf e funcionarios_internos.cpf, nunca texto plano
2. **Consumer é FASE FUTURA** — pedido.envio_consumer_id e envio_consumer ficam prontos no schema, mas a integração automática NÃO é prioridade da primeira fase; lançamento pode ser manual
3. **Regra de edição de pedido:** funcionário só edita `data > hoje` — validar client E server
4. **external_code vive em prato_tamanho_preco** (cada tamanho é um SKU), não em prato
5. **entregador é extensão de funcionarios_internos** — não criar tabela standalone.
   ⚠️ **Dívida aberta:** `packages/db/src/schema/entregador.ts` hoje define
   `entregador` como tabela standalone e ela já existe no Neon. Corrigir na
   Fase 3, quando `funcionarios_internos` nascer.
6. **transacao_financeira é populada manualmente na fase inicial** — sem sync automático de API ainda
7. **meta unifica Meta de Novembro (tipo=financeira) com metas operacionais** — não são sistemas separados
