---
target: apps/admin/features/estoque
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-07T01-02-57Z
slug: apps-admin-features-estoque
---
Method: dual-agent (A: revisão de design isolada · B: detector determinístico + evidência HTML autenticada)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Toasts e indicador por linha na contagem de inventário; falta indicador de "salvando" na busca (debounce silencioso). |
| 2 | Match System / Real World | 3 | Linguagem de restaurante ("repor em", "vencendo", "Quebrou/estragou"); "ponto de reposição" é o único termo técnico, mas explicado inline. |
| 3 | User Control and Freedom | 3 | Cancelar em todo drawer, "Limpar filtros" em 1 clique; nenhuma forma de desfazer um ajuste de quantidade já salvo. |
| 4 | Consistency and Standards | 4 | Mesmo padrão de linha-cartão/badge/drawer em toda a feature. |
| 5 | Error Prevention | 3 | Zod bloqueia inválido; nenhuma confirmação para preço digitado errado. |
| 6 | Recognition Rather Than Recall | 2 | Botões de Filtrar/Ordenar são ícone-só sem rótulo visível; painel de filtros fecha a cada navegação. |
| 7 | Flexibility and Efficiency of Use | **1** | Zero atalho de teclado, zero ação em lote, cadastro fecha o drawer inteiro a cada item salvo. |
| 8 | Aesthetic and Minimalist Design | 4 | Sem decoração, cada elemento tem função. |
| 9 | Error Recovery | 3 | Erros mantêm o form preenchido; contagem de inventário reverte valor com segurança em erro de rede. |
| 10 | Help and Documentation | 2 | `FormDescription` inline cobre os pontos certos, mas o Editar mistura 4 tipos de mudança sem indicar qual campo pertence a qual. |
| **Total** | | **28/40** | **Good, no limite com Acceptable** |

O heurístico 7 — exatamente o que você pediu para pesar mais — está isolado no fundo da tabela e é o que mais puxa a nota pra baixo.

## Design Specificity Verdict

**Revisão manual (A):** visualmente o módulo é fiel ao design system (mesma "Placa do Quintal", mesmo vocabulário de badge/drawer de `features/empresas`) — não é genérico na aparência. Mas na dimensão que importa aqui, fluxo de trabalho, a estrutura é o padrão "tabela + drawer CRUD" de qualquer admin, sem nenhuma decisão pensada para sequência (cadastrar item 1, 2, 3 sem fricção) ou para lote. A composição "tamanho da embalagem × nº de embalagens" no cadastro é a única decisão verdadeiramente pensada pro domínio (garrafa de 900ml, saco de 5kg) — boa, mas isolada.

**Scan determinístico (B):** 0 achados. Rodei o detector duas vezes (estoque e, como controle, `features/empresas`) para confirmar que não é o scanner ficando mudo por engano — voltou limpo nos dois casos, com checagem manual por hex hardcoded e cor fora do token, nada encontrado. Não há violação técnica de padrão de código a reportar aqui — os problemas achados são todos de fluxo, não de implementação.

**Evidência de navegador:** não havia ferramenta de navegador disponível nesta sessão. O agente B autenticou de verdade (login real, cookie de sessão) e buscou o HTML server-renderizado de `/estoque`, `/estoque/[id]` e `/estoque/inventario` — as três carregam com dado real, sem erro. Mas como isso é só o payload inicial do servidor, **não há evidência visual dos drawers** (Novo item, Editar) nem comparação mobile×desktop real — esses só existem depois da hidratação + um clique, que curl não consegue disparar. O achado de P0 sobre o `DrawerFooter` não fixo no bottom sheet vem só da leitura de código (`packages/ui/src/components/drawer.tsx`), não de uma captura visual confirmando o corte na tela — vale testar num celular de verdade antes de arriscar a correção.

## Overall Impression

O módulo está sólido, correto e visualmente consistente — mas foi desenhado com a mentalidade "um item por vez, fluxo completo, sem pressa", que é o oposto do que você pediu. O maior problema não é nenhum bug: é que a sessão passada acabou de **consolidar** 3 ações num drawer só (Editar) bem na hora em que "corrigir rápido" é o requisito central — a decisão anterior de simplificar botões foi na direção contrária à de otimizar velocidade de correção pontual.

## What's Working

1. **"Tamanho da embalagem × quantas embalagens"** no cadastro reconhece como você realmente pensa em estoque (garrafas, sacos, caixas), não como um número solto de banco de dados.
2. **A prévia "Vai somar/tirar X no histórico"** no Editar mostra o efeito antes de salvar, sem exigir cálculo mental.
3. **Autosave por linha na contagem de inventário** (debounce de 600ms, ícone de check) é o único ponto do módulo que já entende "muitos itens em sequência, sem fricção de clicar Salvar a cada um" — é o padrão que falta no resto.

## Priority Issues

**[P0] Botão de salvar pode ficar fora da tela no bottom sheet mobile**
- **Por quê importa:** o `DrawerContent` (`packages/ui/src/components/drawer.tsx`) faz scroll do header + formulário + rodapé juntos, como um bloco só (`DrawerFooter` usa `mt-auto`, não `sticky`). O Editar tem 6-7 blocos de campo — num celular médio isso passa dos 85vh do drawer. Quem está na cozinha com o celular precisa rolar até o fim só pra achar "Salvar item".
- **Fix:** `DrawerFooter` fixo fora da área de scroll (`overflow-hidden` no `DrawerContent`, form com `overflow-y-auto flex-1`, `DrawerFooter` como `sticky bottom-0`). Corrige o componente compartilhado — vale pra todo drawer do app, não só estoque.
- **Comando sugerido:** `/impeccable adapt`

**[P0] Editar funde 4 tipos de mudança num "Salvar" só — mais lento pro caso mais comum (corrigir rápido)**
- **Por quê importa:** corrigir um nome errado — o caso mais banal e mais frequente — abre o mesmo formulário que mexe em saldo (com efeito colateral de gerar movimento), ponto de reposição, validade e preço. Toda vez você precisa reconferir mentalmente "não vou mudar nada disso sem querer" antes de apertar Salvar. É o oposto de "mais rápido que papel": no papel, riscar um nome errado não exige passar o olho por preço e validade.
- **Fix:** accordion/seções dentro do drawer — "Cadastro" aberto, "Ajustar quantidade" e "Novo preço" colapsados por padrão — em vez de tudo exposto de uma vez.
- **Comando sugerido:** `/impeccable shape`

**[P1] Nenhuma ação em lote numa lista pensada pra "muita coisa"**
- **Por quê importa:** sem checkbox de seleção na tabela. Desativar 15 itens depois de mudar o cardápio, ou corrigir o ponto de reposição de uma categoria inteira, hoje custa um drawer por item — exatamente o volume que você disse temer.
- **Fix:** seleção múltipla + barra de ação flutuante (desativar em lote, ajustar ponto de reposição em lote).
- **Comando sugerido:** `/impeccable shape`

**[P1] Zero atalho de teclado**
- **Por quê importa:** sem atalho pra abrir "Novo item" (`n`), focar a busca (`/`), e o campo Nome do cadastro nem tem `autoFocus` (o de Perda tem — inconsistência entre os dois formulários da mesma feature). Cadastrar em sequência no teclado custa: mouse → clicar Novo item → clicar no campo → digitar → clicar Cadastrar → repetir.
- **Fix:** `autoFocus` no campo Nome do cadastro; atalho global `n` e `/`.
- **Comando sugerido:** `/impeccable optimize`

**[P2] Sem "salvar e cadastrar outro"**
- **Por quê importa:** ao cadastrar vários itens seguidos, cada um fecha o drawer inteiro — reabrir do zero pra cada item é o próprio "papel" de novo, só que com mais cliques.
- **Fix:** botão secundário "Salvar e cadastrar outro" que reseta o form sem fechar o drawer, com foco de volta no Nome.
- **Comando sugerido:** `/impeccable optimize`

## Persona Red Flags

**Alex (dono cadastrando/corrigindo em sequência)**
- Zero atalho de teclado em toda a feature.
- Campo Nome do cadastro sem `autoFocus` (inconsistente com o form de Perda).
- Drawer fecha por completo após cada item — sem continuar pro próximo.
- Zero seleção em lote — 20 itens custam exatamente 20× o esforço de 1.
- Filtrar/Ordenar são ícone-só — obriga decifrar em vez de ler.

**Casey (cozinha no celular)**
- Risco de "Salvar" ficar fora da viewport no bottom sheet (P0 acima) — não confirmado visualmente nesta rodada, vale testar num aparelho real.
- Campo "Vigente a partir de" aparece de repente ao digitar um preço, empurrando o layout — pode confundir se ela só quis registrar o preço sem pensar em data de vigência.

## Minor Observations

- Painel de filtros fecha a cada navegação (o filtro em si persiste na URL, mas o painel não lembra que estava aberto).
- "e mais N itens" no painel de alertas é só texto, não é clicável — beco sem saída visual.
- Seção de preço no Editar fica sempre visível mesmo quando não há intenção de mexer nisso — só o `FormLabel` avisa que é opcional.
- Alturas de input inconsistentes entre `registrar-perda-form.tsx` (`h-11 sm:h-9` explícito) e o form de criação (ausente em alguns campos).
- Scanner determinístico não encontrou nada de código — os problemas aqui são 100% de fluxo, não de padrão técnico.

## Questions to Consider

- Se o objetivo é "mais rápido que papel", por que o caminho mais rápido do sistema (cadastrar só com o nome) não é o caminho que a UI ensina? Todos os campos têm o mesmo peso visual.
- O que aconteceria se "Editar" voltasse a ser dois botões — mas dessa vez rápidos de verdade: "Corrigir" (nome/unidade/embalagem/reposição) e "Ajustar quantidade" (só o número, com foco automático)? Vale medir se juntar resolveu um problema real de arquitetura ou criou um problema real de velocidade.
- O que trava mais hoje: cadastrar o primeiro item, ou o item número 50 na mesma sessão? A UI inteira parece otimizada pro primeiro caso.
