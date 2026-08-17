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
  - created_at, updated_at
  -- editável pelo funcionário via link público SOMENTE para data > hoje
  -- atualização gera notificação (Pusher) para o caixa reimprimir

pedido_item_adicional (N:N)
  - pedido_id (FK), item_adicional_id (FK)
```

Sem integração fiscal/PDV externa (Consumer) — a impressão é só local, via
QZ Tray (ver "Configurações" abaixo e "Pedidos importados por planilha").

## Configurações — `impressora` IMPLEMENTADO (Fase 4)

```
impressora
  - id, nome, tipo: comanda | etiqueta
  - identificador_qz
  - ativo
```

## Pedidos importados por planilha — IMPLEMENTADO (Fase 4)

Fluxo leve e paralelo ao `funcionario`/`pedido` estruturados acima. As
empresas-cliente hoje respondem via Google Forms semanal (uma linha por
pessoa, por semana) e a planilha de respostas é importada direto — sem CPF,
sem setor, sem vínculo com `cardapio_dia`/`prato`. Enquanto isso for
suficiente, não force o encaixe no fluxo estruturado; promover para lá exige
CPF e setor, que a planilha não fornece.

```
colaborador_pedido
  - id, empresa_id (FK empresa, cascade)
  - nome, whatsapp (nullable)
  - ativo (bool, default true) -- soft: nunca deletado
  -- INDEX (empresa_id, nome)

pedido_dia_importado
  - id, colaborador_id (FK colaborador_pedido, cascade)
  - data (date -- um dia real, calculado na importação a partir da
    "Semana do Cardápio" da planilha + offset do dia da semana)
  - turno: almoco | jantar (nullable)
  - tamanho: P | M | G (nullable)
  - prato (text, nullable -- texto livre, como veio da planilha)
  - observacao (text, nullable)
  - arquivo_origem (text, nullable -- nome do arquivo, sem Blob)
  - respondido_em (timestamp, nullable -- carimbo de data/hora ORIGINAL da
    resposta no formulário, não quando importamos)
  - importado_em
  -- UNIQUE (colaborador_id, data) -- reimportar a mesma semana faz upsert
  -- INDEX (data)
```

A armadilha do formato do Google Forms: o texto das colunas de dia
("Segunda-Feira 17/08/2026") é só o rótulo da semana *atualmente aberta* no
formulário — não muda por linha. A data real de cada linha vem exclusivamente
do campo "Semana do Cardápio", em texto livre (formato inconsistente entre
empresas: separador `a`/`Á`/`á`). `features/empresas/lib/importacao-helpers.ts`
faz esse parsing e mapeia colunas por regex, não por texto exato — absorve a
variação de formato entre planilhas de empresas diferentes.

O carimbo de data/hora chega do xlsx como `Date` de verdade (`cellDates:
true` no parse do SheetJS) — não como número serial do Excel, que só entra
como fallback se a célula não estiver formatada como data.

## Configuração de impressão — `configuracao_comanda` IMPLEMENTADO (Fase 4)

```
configuracao_comanda
  - id (fixo: 'default' — singleton, sempre uma linha só)
  - campos (jsonb, string[] -- chaves dos campos opcionais, na ordem em
    que aparecem abaixo do nome na comanda: turno, prato, tamanho,
    observacao, empresa, respondido_em, impresso_em)
  - updated_at
```

Um layout só vale pro restaurante inteiro (não por empresa). O nome do
colaborador nunca entra em `campos` — é sempre o topo fixo e grande da
comanda, não configurável. Editável em `/configuracoes`
(`features/configuracoes/`), com pré-visualização ao vivo do PDF real.

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

## Compras e Fornecedores — IMPLEMENTADO (Fase 2b)

`fornecedor` já existia (criado junto com Estoque, para que
`estoque_item.fornecedor_padrao_id` e `historico_preco_insumo.fornecedor_id`
fossem FKs reais desde o início) e agora tem UI em `/compras`.

```
fornecedor
  - id, nome, contato, prazo_entrega_dias, prazo_pagamento, created_at
  -- prazo_pagamento é TEXTO LIVRE ("30 dias", "à vista", "15/30"): é assim
  --   que a condição vem na conversa. `diasDoPrazo()` lê o primeiro número.

compra                                  -- CABEÇALHO: uma nota fiscal
  - id, fornecedor_id (FK)
  - numero_nota_fiscal (nullable)
  - arquivo_nota_fiscal (nullable — Vercel Blob, fase futura)
  - categoria_despesa (reusa despesa_subtipo do Financeiro)
  - status: pedido_feito | aguardando_entrega | recebido | cancelado
  - data_pedido, data_recebimento (nullable), forma_pagamento, observacao
  - user_id (FK, nullable), created_at
  - index: (status, data_pedido), fornecedor_id

compra_item                             -- LINHAS da nota
  - id, compra_id (FK cascade), estoque_item_id (FK)
  - quantidade numeric(12,3), valor_unitario numeric(12,2)
  - unique (compra_id, estoque_item_id)
  -- total da linha é DERIVADO, nunca gravado

fornecedor_item (N:N — múltiplos fornecedores por insumo)
  - id, fornecedor_id (FK cascade), estoque_item_id (FK cascade)
  - preco, prazo_entrega_dias (nullable), observacao, created_at
  - unique (fornecedor_id, estoque_item_id)

avaliacao_fornecedor
  - id, fornecedor_id (FK cascade)
  - data, nota (1-5), observacao
  - tipo: atraso | qualidade | produto_vencido | outro
  - user_id (FK, nullable), created_at
  - index: (fornecedor_id, data)
```

Uma nota é **uma entrega e um pagamento só** — por isso cabeçalho + linhas, e
não um registro por item (mesma decisão do inventário físico).

**Registrar compra** (um `db.batch`): insere `compra` + `compra_item[]` +
`conta_a_pagar` com `origem_tipo='compra'`. É o que elimina a digitação dupla:
a despesa não depende de alguém lembrar de lançá-la.

**Marcar recebida** (um `db.batch`): `status → recebido`, um movimento
`entrada_compra` por linha (via `planejarMovimento`, do Estoque) e uma linha
nova em `historico_preco_insumo` com o fornecedor. **É irreversível**: os
movimentos encadeiam `saldo_resultante`, e apagá-los faria todo movimento
posterior daquele item mentir. Depois de recebida, a correção é por "Ajustar
quantidade". Antes disso dá para cancelar — e o cancelamento apaga a conta a
pagar gerada (bloqueado se ela já foi quitada).

Entrega atrasada é **derivada** (`pedido + prazo_entrega_dias < hoje`), nunca
gravada — mesma regra do "estoque baixo" e da "conta atrasada".

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
  - origem_tipo, origem_id (nullable)   -- 'compra' hoje; salário/benefício na Fase 3
  -- índices: (status,data_vencimento), data_vencimento, (origem_tipo,origem_id)

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

## RH Interno — IMPLEMENTADO (Fase 3)

```
cargo
  - id, nome (ex: Cozinheiro, Caixa, Garçom, Entregador)
  - salario_base numeric(12,2)          -- por mês
  - valor_diaria_padrao (nullable)      -- por dia, em cargo de diarista
  - ativo, created_at
  -- os dois são só a SUGESTÃO que aparece ao admitir; o valor de cada pessoa
  -- vem do histórico de salário ou da extensão entregador. Cargo com
  -- `valor_diaria_padrao` preenchido já marca o admitido como entregador.

funcionario_interno                     -- quem trabalha NO restaurante
  - id, nome
  - cpf_cifrado (nullable), cpf_final (nullable)   -- ver Criptografia do CPF
  - cnpj (nullable — só quando PJ/MEI)
  - cargo_id (FK)
  - turno: dia | noite | ambos
  - modelo_contratual: CLT | PJ | MEI | temporario | estagio | informal
  - data_admissao, data_desligamento (nullable)
  - status: ativo | desligado
  - motivo_desligamento (nullable): dispensado_sem_justa_causa |
      dispensado_com_justa_causa | pedido_demissao | fim_contrato
  - user_id (FK, nullable — só quem tem login: admin/caixa/financeiro/cozinha)
  - index: status, cargo_id
  -- SEM coluna de salário: ver historico_salario
  -- NÃO confundir com `funcionario`, que é o funcionário da empresa-CLIENTE

historico_salario
  - id, funcionario_interno_id (FK cascade)
  - valor numeric(12,2), vigente_desde date
  - motivo: admissao | reajuste | promocao | acordo
  - observacao, user_id (nullable), created_at
  - index: (funcionario_interno_id, vigente_desde)

entregador                              -- EXTENSÃO, não tabela de pessoa
  - id, funcionario_interno_id (FK cascade, UNIQUE)
  - valor_diaria numeric(12,2)
  - taxa_entrega_percentual (nullable)
  - folga_semanal integer (nullable)    -- 0 = domingo … 6 = sábado
  - created_at
  -- SEM zona fixa (modelo flexível confirmado)
  -- SEM modelo_contratual próprio: já está no funcionário

ausencia_funcionario
  - id, funcionario_interno_id (FK cascade)
  - tipo: atestado_medico | folga | ferias | falta_justificada | falta_injustificada
  - data_inicio, data_fim
  - documento_anexo (nullable — Vercel Blob, campo nasce, upload liga depois)
  - observacao, user_id (nullable), created_at
  - index: (funcionario_interno_id, data_inicio)

beneficio_funcionario
  - id, funcionario_interno_id (FK cascade)
  - tipo: vale_transporte | vale_refeicao | bonus | outro
  - valor numeric(12,2)
  - recorrente boolean   -- entra na folha todo mês
  - ativo boolean, observacao, created_at
  -- SEM status próprio: quem controla pagamento é a conta_a_pagar gerada

folha_pagamento                         -- CABEÇALHO da competência
  - id, competencia text UNIQUE ('YYYY-MM')
  - data_vencimento, observacao, user_id (nullable), created_at

folha_item                              -- LINHAS
  - id, folha_id (FK cascade), funcionario_interno_id (FK)
  - tipo: salario | diaria | beneficio
  - descricao ("03/08 a 08/08 · 6 diárias", "Vale transporte"), valor
  - data_vencimento (nullable)          -- próprio da linha; nulo cai no da folha
  - unique (folha_id, funcionario_interno_id, tipo, descricao)
```

### Como a diária do entregador é contada

Regras da operação, todas em `features/rh/lib/ausencia-helpers.ts`:

- **Domingo não se trabalha** — nunca é dia de diária, antes de qualquer outra
  regra. A semana de trabalho é **segunda a sábado**.
- **Folga fixa semanal**: cada entregador escolhe um dia (`folga_semanal`) e ele
  sai da conta todo mês, sem ninguém precisar registrar nada.
- **Rodízio de sábado**: não é dia fixo de ninguém, então entra como
  `ausencia_funcionario` do tipo `folga` quando acontece — ~1 registro por mês
  por pessoa, em vez de 5.
- Os três se juntam num `Set` de datas, nunca em subtrações somadas: atestado
  que cai justo na folga não pode descontar duas diárias.

Agosto/2026, diária de R$100: 31 dias − 5 domingos = 26 úteis. Quem folga na
segunda fica com 21 diárias (R$2.100); quem não tem dia fixo, 26 (R$2.600).

**Salário é linha, não coluna.** `historico_salario` é para o RH o que
`historico_preco_insumo` é para o estoque: o valor atual é derivado (última
vigência `<= a data`), nunca gravado no funcionário. É isso que impede um
reajuste de hoje reescrever a folha de um mês já fechado — a folha de agosto
pergunta pelo salário vigente **em** agosto.

**Fechar a folha** (um `db.batch`): grava `folha_pagamento` + `folha_item[]` +
uma `conta_a_pagar` por linha (`origem_tipo='folha_item'`, subtipo `salario`
para salário/diária e `vale_transporte` para o benefício). A prévia é montada
na hora e **editável antes de confirmar** — quantidade, valor e vencimento de
cada linha —, porque folha real sempre tem ajuste.

**Mensalista e diarista fecham juntos, mas pagam diferente.** O mensalista sai
numa linha só, vencendo no dia escolhido para a competência. O entregador recebe
por semana, então vira **uma linha por semana de segunda a sábado**, cada uma
com seu vencimento: a primeira ocorrência do dia de pagamento em ou depois do
fim da semana. Pagando no sábado, a semana vence no próprio sábado dela; pagando
na quarta, vence na quarta seguinte. O dia é escolhido na tela ao fechar
(`?pagamento=0..6`, padrão sábado).

A semana que atravessa a virada do mês entra recortada: só a parte que cai
dentro da competência, e o resto aparece na folha do mês seguinte. Sem esse
recorte, a mesma semana seria paga duas vezes.

**Desfazer a folha** apaga as contas geradas — diferente de receber compra, não
há saldo encadeado aqui. Mas se alguma já foi quitada, o dinheiro saiu e o
desfazer é bloqueado. `unique(competencia)` impede fechar o mesmo mês duas vezes.

### Criptografia do CPF

`cpf_cifrado` é AES-256-GCM (`apps/admin/lib/crypto.ts`, `node:crypto`, chave em
`CPF_ENCRYPTION_KEY`); `iv` e `authTag` viajam dentro do próprio blob, e a tag é
o que faz a leitura **falhar** se o valor for adulterado no banco. `cpf_final`
guarda só os últimos 5 dígitos em claro, para a tela mostrar `•••.•••.123-45` e
buscar sem decifrar a tabela inteira. Guarda **só os dígitos**: com a máscara, o
mesmo CPF digitado de dois jeitos viraria dois valores diferentes.

`queries.ts` nunca devolve o CPF completo. Ler o número inteiro é uma action
própria (`revelarCpfAction`) que registra em `audit_log` quem revelou, de quem e
quando. As funções puras de máscara e validação ficam em `lib/cpf.ts`, que não é
server-only — só cifrar/decifrar precisa do servidor.

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
5. **entregador é extensão de funcionario_interno** — não criar tabela standalone.
   ✅ Resolvido na Fase 3: a tabela standalone (que tinha `nome` e `salario`
   próprios) foi derrubada e recriada com `funcionario_interno_id UNIQUE`.
6. **transacao_financeira é populada manualmente na fase inicial** — sem sync automático de API ainda
7. **meta unifica Meta de Novembro (tipo=financeira) com metas operacionais** — não são sistemas separados
