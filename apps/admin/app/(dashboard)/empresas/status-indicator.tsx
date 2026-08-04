import { cn } from "@repo/ui/lib/utils"
import type { EmpresaStatus } from "./mock-empresas"

const STATUS_CONFIG: Record<
  EmpresaStatus,
  { label: string; dot: string; text: string }
> = {
  aguardando: {
    label: "Aguardando respostas",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  finalizado: {
    label: "Finalizado",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
}

export function StatusIndicator({ status }: { status: EmpresaStatus }) {
  const config = STATUS_CONFIG[status]

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span className={cn("size-1.5 shrink-0 rounded-full", config.dot)} />
      <span className={config.text}>{config.label}</span>
    </span>
  )
}
