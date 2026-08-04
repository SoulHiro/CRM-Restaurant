# Product

## Register

product

## Users

Equipe interna do restaurante Nosso Quintal: administrador (dono/gestão), operador de caixa, cozinha e financeiro. Usam o app durante o expediente, muitas vezes sob pressão de horário (fechamento de pedidos, hora de imprimir comandas). Cada role vê só as seções relevantes ao seu trabalho (RBAC via Better Auth).

## Product Purpose

Substituir planilhas manuais e Google Forms no fluxo operacional de um restaurante que atende marmitas corporativas (B2B) e canais de salão/delivery (B2C). Cobre cadastro de empresas clientes, captura de pedido semanal dos funcionários dessas empresas, corte diário automático, impressão de comandas/etiquetas, e acompanhamento consolidado por canal (Placar). Sucesso = zero digitação manual redundante e zero pedido perdido/errado na hora da impressão.

## Brand Personality

Profissional, sólido, organizado. É uma ferramenta de operação diária, não uma vitrine — mas precisa transmitir confiança de negócio estabelecido, já que o dono eventualmente mostra a empresa parceiras. Sem enfeite, sem the "gostosura" visual de app consumer; densidade de informação e clareza de estado (o que já foi feito, o que falta) vêm antes de qualquer floreio.

## Anti-references

Nenhuma referência específica a evitar foi levantada; segue o próprio design system já estabelecido (shadcn/ui, estilo "new-york", paleta zinc) em vez de replicar outro produto.

## Design Principles

- Estado sempre visível: quem usa precisa saber em um relance o que está pendente vs. concluído (ex: "Aguardando respostas" vs "Finalizado")
- Densidade com respiro: tabelas e listas compactas, mas nunca amontoadas — cada linha precisa ser escaneável rápido
- Ação primária sempre à mão: criar/cadastrar nunca fica escondido atrás de menus extras
- Sem decoração gratuita: esta é uma ferramenta de trabalho, cada elemento visual precisa justificar sua presença pela função

## Accessibility & Inclusion

Sem requisito formal de WCAG definido ainda. Manter contraste de texto ≥4.5:1 (padrão do skill), foco de teclado visível, e respeitar `prefers-reduced-motion` como piso de qualidade padrão.
