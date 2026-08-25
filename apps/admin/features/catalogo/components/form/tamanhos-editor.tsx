import type { TamanhoInput } from '../../lib/types'

function novaChave(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

/**
 * P/M/G e os respectivos pesos são fixos pra todo produto com tamanho —
 * não é configurável por produto, então não existe editor de nome/peso,
 * só o preço de cada um (definido no resumo). M é sempre a base: a ficha
 * técnica cadastrada representa 500g, P e G escalam a partir dela.
 */
const TAMANHOS_PADRAO: readonly Omit<TamanhoInput, 'key'>[] = [
  { nome: 'P', pesoGramas: 350, precoVenda: 0, ehBase: false },
  { nome: 'M', pesoGramas: 500, precoVenda: 0, ehBase: true },
  { nome: 'G', pesoGramas: 750, precoVenda: 0, ehBase: false },
]

export function tamanhosPadrao(): TamanhoInput[] {
  return TAMANHOS_PADRAO.map((t) => ({ ...t, key: novaChave() }))
}

export function ResumoTamanhosPadrao() {
  return (
    <p className="text-xs text-muted-foreground">
      P (350g) · M (500g, base da ficha técnica) · G (750g) — pesos fixos,
      só o preço de cada um é definido no resumo.
    </p>
  )
}
