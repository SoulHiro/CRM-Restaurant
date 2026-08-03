# Arquitetura — Nosso Quintal

> Documento de referência técnica. Gerado a partir do levantamento completo de arquitetura feito antes do início do desenvolvimento.

## Stack

| Camada                      | Tecnologia                                |
| --------------------------- | ----------------------------------------- |
| Framework                   | Next.js 16.2.12                           |
| UI Library                  | React 19.2                                |
| Estilização                 | Tailwind CSS                              |
| Componentes                 | shadcn/ui                                 |
| ORM                         | Drizzle ORM                               |
| Banco de Dados              | PostgreSQL (Neon)                         |
| Autenticação                | Better Auth                               |
| Data Fetching / Cache       | TanStack Query                            |
| Validação de Formulários    | Zod                                       |
| Validação de Server Actions | Next Safe Action                          |
| Visualização/Edição de PDF  | React PDF                                 |
| Background Jobs             | pg-boss (sobre o próprio Postgres)        |
| Armazenamento de Arquivos   | Vercel Blob                               |
| Notificações em Tempo Real  | Pusher                                    |
| Impressão Física            | QZ Tray (local, WebSocket local, ESC/POS) |
| Monitoramento de Erro       | Sentry                                    |
| Testes                      | Vitest                                    |
| Deploy                      | Vercel                                    |

## Monorepo — 2 apps reais

```
nosso-quintal/
├── apps/
│   ├── admin/    ← admin.nossoquintal.com.br (staff interno: admin, caixa, cozinha, financeiro)
│   └── web/      ← nossoquintal.com.br (empresas, funcionários das empresas, clientes do salão)
├── packages/
│   ├── db/        ← schema Drizzle + client, compartilhado pelos 2 apps
│   ├── ui/         ← componentes shadcn compartilhados
│   └── auth/       ← config/schema base do Better Auth (instanciada separadamente por app)
├── turbo.json
└── package.json
```

**Ferramenta:** pnpm workspaces + Turborepo.

**Auth:** logins **completamente separados** entre os 2 apps — sem cookie de sessão compartilhado entre domínio/subdomínio. `admin` só permite roles internos; `web` só permite roles externos (empresa, funcionario, cliente).

## Camada de API

- **Server Actions** → tudo que o usuário logado aciona (interno, dentro do próprio app)
- **Route Handlers** → conexões externas que chamam nosso sistema (Consumer via polling, AnotaAí, futuros webhooks)

## Permissões — RBAC (não ABAC)

Via plugin de admin/access control do Better Auth. Um usuário pode ter mais de um role.

Roles: `admin` (acesso total, inclusive impersonation), `caixa`, `financeiro`, `cozinha`, `garcom`, `empresa` (futuro), `funcionario` (futuro), `cliente` (futuro).

## Duas conexões em tempo real distintas (não confundir)

| Conexão                | Entre quem                    | Tecnologia                                       |
| ---------------------- | ----------------------------- | ------------------------------------------------ |
| Notificação de sistema | Servidor (Vercel) ↔ Navegador | Pusher                                           |
| Impressão física       | Navegador ↔ QZ Tray           | WebSocket local (nunca sai do PC do restaurante) |

## Impressão Física — QZ Tray

- Aplicação desktop instalada no PC do restaurante, expõe WebSocket local
- Comunicação via lib `qz-tray` no frontend
- Impressão silenciosa (sem popup) via certificado auto-assinado gratuito, gerado em QZ Tray → Advanced → Site Manager
- Funciona com Elgin e qualquer impressora ESC/POS

## Integrações Externas

### Consumer (fiscal / PDV)

- API de parceiro funciona por **polling** — o Consumer consulta periodicamente nossos endpoints (Route Handlers), não o contrário
- **Um pedido consolidado por empresa/dia** no Consumer, contendo múltiplos itens (um por funcionário), agrupados por prato no payload
- "Imprimir Todos" dispara **simultaneamente**: chamada à API do Consumer (fiscal) + impressão local via QZ Tray (formato próprio)
- Requer assinatura Premium do Consumer

### AnotaAí

- API de integração pública e gratuita (Stoplight)
- Usado para o canal B2C (delivery/salão) — Marmita B2B fica no nosso app próprio
- Integrado com iFood (pedidos do iFood caem dentro do AnotaAí) — atenção: desativar impressão automática do Gestor de Pedidos nativo do iFood para não duplicar impressão

### iFood

- Integrado via AnotaAí (não diretamente)
- Plano Básico (12% comissão) recomendado, já que há entregador próprio

## Decisões descartadas (com racional)

- **RabbitMQ / Redis** → removidos. Volume de um restaurante não justifica; worker contínuo não é viável em serverless (Vercel). Substituído por Vercel Cron (agendamento) + pg-boss (retry/filas leves).
- **Inngest** → descartado em favor de pg-boss (evita mais uma dependência externa).
- **ABAC** → descartado em favor de RBAC simples (poucos papéis, sem necessidade de combinação dinâmica de atributos).
- **Grafana + Loki** → descartado em favor de tabela `audit_log` própria no Postgres + Sentry para erros técnicos.
