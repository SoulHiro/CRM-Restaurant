/** Título + descrição centralizados no header do sidebar inset, no lugar do <h1> solto na página. */
export function CardapioHeaderCenter() {
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="whitespace-nowrap text-sm font-medium text-foreground/80">
        Cardápio
      </span>
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        Arraste os pratos do catálogo pros dias da semana
      </span>
    </div>
  )
}
