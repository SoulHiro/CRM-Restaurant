/**
 * Linha-cartão vira grid multi-coluna só a partir de `sm:`; abaixo disso
 * empilha e o cabeçalho da tabela — que carregava o rótulo da coluna — fica
 * oculto. Cada valor que ficaria ambíguo sozinho ganha este rótulo, visível
 * apenas no empilhado mobile.
 */
export function MobileCellLabel({ children }: { children: string }) {
  return (
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
      {children}
    </span>
  )
}
