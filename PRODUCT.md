# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Equipe interna do restaurante Nosso Quintal: administrador (dono/gestão), operador de caixa, cozinha e financeiro. Usam o app durante o expediente, muitas vezes sob pressão de horário (fechamento de pedidos, hora de imprimir comandas). Cada role vê só as seções relevantes ao seu trabalho (RBAC via Better Auth).

## Product Purpose

Substituir planilhas manuais e Google Forms no fluxo operacional de um restaurante que atende marmitas corporativas (B2B) e canais de salão/delivery (B2C). Cobre cadastro de empresas clientes, captura de pedido semanal dos funcionários dessas empresas, corte diário automático, impressão de comandas/etiquetas, e acompanhamento consolidado por canal (Placar). Sucesso = zero digitação manual redundante e zero pedido perdido/errado na hora da impressão.

## Positioning

O diferencial não é uma feature isolada — é a ausência de redigitação em toda a cadeia. O funcionário responde no link único do próprio turno (`/pedido/{turno_id}`) e o sistema já sabe empresa, turno e dia, sem ninguém digitar isso de novo; o corte diário agrupa esses pedidos automaticamente; "Imprimir Tudo" já sai formatado pra cozinha sem ninguém copiar de uma planilha pra outra. Uma combinação de planilha + Google Forms captura a mesma informação, mas exige alguém religando manualmente cada etapa (quem respondeu → o que virou pedido → o que foi impresso) — é exatamente esse religamento manual que o produto elimina.

## Operating Context

Uso diário, durante o expediente do restaurante, sob pressão de horário: fechamento do pedido do dia e hora de imprimir comandas antes do preparo. Papéis fixos via RBAC: admin/gestão cadastra empresas e acompanha tudo; caixa opera o corte diário e a impressão; cozinha só vê o necessário pra produção; financeiro acompanha faturamento e contratos. Fluxo semanal fixo: cada funcionário de empresa cliente responde o pedido pra semana inteira via link público sem login, com edição travada para dias já passados. Impressão física acontece no PC do restaurante via QZ Tray (WebSocket local, nunca sai da rede do restaurante); envio fiscal consolidado acontece via polling do parceiro Consumer. Hoje 100% mock — ainda não plugado no Postgres real nem nas integrações externas.

## Brand Personality

Profissional, sólido, organizado. É uma ferramenta de operação diária, não uma vitrine — mas precisa transmitir confiança de negócio estabelecido, já que o dono eventualmente mostra a empresas parceiras. Sem enfeite, sem a "gostosura" visual de app consumer; densidade de informação e clareza de estado (o que já foi feito, o que falta) vêm antes de qualquer floreio.

## Anti-references

Nenhuma referência específica a evitar foi levantada; segue o próprio design system já estabelecido (shadcn/ui, estilo "new-york", paleta zinc) em vez de replicar outro produto.

## Evidence on Hand

Nenhum dado real de produção ainda. O banco não está plugado — `packages/db` existe, mas as queries/actions de `apps/admin/features/empresas` são 100% mock, com `TODO(db)` marcado nos próprios arquivos indicando a troca futura pro Drizzle real. Sem clientes reais, sem depoimentos, sem métricas de uso. As empresas/funcionários/pedidos vistos no admin hoje são dados fictícios pra desenvolvimento — não usar como prova social ou exemplo real em nenhuma superfície voltada a cliente.

## Design Principles

- Estado sempre visível: quem usa precisa saber em um relance o que está pendente vs. concluído (ex: "Aguardando respostas" vs "Finalizado")
- Densidade com respiro: tabelas e listas compactas, mas nunca amontoadas — cada linha precisa ser escaneável rápido
- Ação primária sempre à mão: criar/cadastrar nunca fica escondido atrás de menus extras
- Sem decoração gratuita: esta é uma ferramenta de trabalho, cada elemento visual precisa justificar sua presença pela função

## Accessibility & Inclusion

Sem requisito formal de WCAG definido ainda. Manter contraste de texto ≥4.5:1 (padrão do skill), foco de teclado visível, e respeitar `prefers-reduced-motion` como piso de qualidade padrão.
