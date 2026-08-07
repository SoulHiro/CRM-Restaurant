/**
 * As linhas-cartão do módulo viram grid multi-coluna só a partir de `sm:`;
 * abaixo disso empilham em cartão e o cabeçalho da tabela (que carregava o
 * rótulo da coluna) fica oculto — por isso cada valor ambíguo sozinho
 * precisa de um rótulo próprio, visível só no empilhado mobile.
 */
export function MobileCellLabel({ children }: { children: string }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
      {children}
    </span>
  )
}
