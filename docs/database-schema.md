# Schema de Banco de Dados — Nosso Quintal

> Modelo conceitual completo, validado em rodada de perguntas + revisão de relacionamentos. Pronto para virar schema Drizzle real.

## Auth

```
user (Better Auth)
user_role
  - user_id (FK)
  - role: admin | caixa | financeiro | cozinha | garcom | empresa | funcionario | cliente
```

## Empresa

```
empresa
  - id, nome, endereco, zona, email_contato, telefone_contato
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
  -- presença de registro = empresa optou por não ter pedido nesse dia específico
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
  -- todo turno tem pelo menos 1 setor (criar "Geral" quando empresa não subdivide)
```

## Funcionário (pessoa global, N:N com empresa)

```
funcionario
  - id
  - nome (obrigatório)
  - cpf (obrigatório, encrypted)
  - whatsapp (opcional)
  - restricao_alimentar (nullable)

funcionario_empresa
  - id, funcionario_id (FK), setor_id (FK)
  - status: ativo | inativo
  - data_vinculo
  -- UNIQUE constraint: sem 2 vínculos ATIVOS simultâneos entre o mesmo funcionário e a mesma empresa
  -- empresa é sempre derivada via setor → turno → empresa (não duplicar empresa_id aqui)
```

## Cardápio

```
categoria_prato
  - id, nome (ex: massa, carne_vermelha, frango, peixe, salada)
  -- usado para lógica de sorteio (evita repetir categoria em dias seguidos)

prato
  - id, nome, categoria_id (FK)

prato_tamanho_preco
  - id, prato_id (FK), tamanho: P | M | G
  - preco, external_code (Consumer)
  -- UNIQUE (prato_id, tamanho)

item_adicional
  - id, nome, preco, external_code (Consumer)

ficha_tecnica_item
  - id, prato_id (FK), tamanho: P | M | G
  - insumo, quantidade, unidade

cardapio_dia
  - id, data, prato_id (FK)
  - destaque (bool — "prato do dia")
  -- UNIQUE (data, prato_id)
  -- Cardápio é GLOBAL (não varia por empresa), mesmo pool serve almoço e janta
```

## Pedido

```
pedido
  - id, funcionario_empresa_id (FK)
  - cardapio_dia_id (FK) -- garante que o prato escolhido estava disponível naquele dia
  - tamanho: P | M | G
  - status_impressao: pendente | impresso | erro_impressao
  - motivo_erro (nullable)
  - envio_consumer_id (FK, nullable) -- preenchido quando "Imprimir Todos" confirma sucesso
  - created_at, updated_at
  -- Funcionário pode atualizar (upsert) o próprio pedido via link público,
  -- mas SOMENTE para dias futuros (data > hoje). Hoje e passado ficam bloqueados.
  -- Atualização gera notificação (Pusher) para o caixa reimprimir.

pedido_item_adicional (N:N)
  - pedido_id (FK), item_adicional_id (FK)
```

## Consumer (integração fiscal)

```
envio_consumer
  - id, empresa_id (FK), data
  - status: enviado | confirmado | erro
  - nota_fiscal_numero, nota_fiscal_chave_acesso, nota_fiscal_emitida_em
  - created_at
  -- Representa o pedido CONSOLIDADO (todos os itens de todos os funcionários daquela
  -- empresa/dia) enviado ao Consumer. Um "pedido" nosso (por pessoa) vira um item
  -- dentro desse envio consolidado.
```

## Configurações

```
impressora
  - id, nome, tipo: comanda | etiqueta
  - identificador_qz
  - ativo
```

## Placar / Canais

```
canal
  - id, nome, ativo (bool)
  -- Lista flexível (Empresas, Salão, Delivery, iFood, 99Food, Fiado) — pode crescer/diminuir

registro_canal_dia
  - id, canal_id (FK), data
  - quantidade, valor
  - origem: manual | automatico
  -- UNIQUE (canal_id, data)
  -- Para canal "Fiado": valor deve ser CALCULADO (soma da tabela fiado), não digitado à parte
```

## Fiado

```
fiado
  - id, cliente_nome, valor
  - data_pedido, data_vencimento, data_pagamento (nullable)
  - status: pendente | pago | atrasado
```

## Entregador

```
entregador
  - id, nome, salario
  - modelo_contratual: CLT | MEI
  - status: ativo | inativo
  -- Sem zona fixa — modelo flexível (sai com o que tiver disponível na hora)
```

## Auditoria

```
audit_log
  - id
  - user_id (FK, nullable)
  - ator_descricao (nullable — ex: "Funcionário: Ana Souza via link público", para eventos sem user autenticado)
  - acao (ex: login, imprimiu_pedidos, editou_cardapio, erro_impressao)
  - detalhes (JSON)
  - created_at
```

## Pontos de atenção para a implementação

1. **CPF sempre criptografado** — nunca em texto plano no banco
2. **`pedido.envio_consumer_id`** só é preenchido após confirmação de sucesso do envio — antes disso, fica null
3. **Regra de edição de pedido:** funcionário só edita `data > hoje` — validar tanto no client quanto no server (Server Action / Route Handler)
4. **Payload do Consumer:** itens devem vir agrupados por prato (todos de um prato juntos, depois o próximo), não em ordem arbitrária
5. **`external_code`** vive em `prato_tamanho_preco` (cada tamanho é um SKU diferente), não em `prato`
