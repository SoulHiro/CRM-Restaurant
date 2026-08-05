# Estilo de código

## Hooks: import direto, sem prefixo `React.`

Sempre `import { useState, useEffect } from "react"` e chame direto —
nunca `React.useState`, `React.useEffect`.

```tsx
// ruim
const [open, setOpen] = React.useState(false)

// bom
import { useState } from 'react'
const [open, setOpen] = useState(false)
```

## Sem memoização manual — o React Compiler faz isso

O React Compiler está habilitado (`reactCompiler: true` em
`apps/admin/next.config.js` e `apps/web/next.config.js`). Não escreva
`useMemo`/`useCallback` para otimizar custo de render — o compiler já faz
essa memoização automaticamente em tempo de build.

A única exceção legítima é quando você precisa de estabilidade referencial
para algo que o compiler não cobre — por exemplo, um valor usado como
dependência de uma API externa não-React, ou algo que atravessa um
boundary de Suspense/Activity onde a garantia do compiler não se aplica.
Se isso acontecer, deixe um comentário explicando o motivo — não é o caso
padrão.

## Sem comentários desnecessários

Código deve se explicar pelos nomes. Só comente o que não é óbvio a partir
do código: uma regra de negócio específica, uma limitação de uma API
externa, um motivo para uma escolha que pareceria estranha sem contexto.

```ts
// ruim — só descreve o que o código já diz
// busca a empresa pelo id
const empresa = await getEmpresaById(id)

// bom — explica um porquê que não é óbvio
// funcionariosRespondidos/Total ainda não existem no schema do banco —
// hoje vêm hardcoded no mock, ver docs/rules/architecture.md
```

Não escreva comentários referenciando a tarefa atual ("adicionado para o
refactor X", "fix do bug #123") — isso pertence à mensagem de commit/PR, não
ao código, e fica desatualizado com o tempo.

## Tamanho de arquivo

Ver [[architecture]] — alvo de ~300-400 linhas por arquivo. Passou disso,
extraia.

## Nomenclatura

- Arquivos: `kebab-case.tsx` / `kebab-case.ts`.
- Um export principal por arquivo (o nome do arquivo espelha o nome do
  componente/função exportado: `person-avatar.tsx` exporta `PersonAvatar`).
- Nada de helpers locais genéricos redefinidos por arquivo (ex: um `FieldCell`
  ou `StatCard` diferente em cada tab) — ver [[duplication-reusability]].
