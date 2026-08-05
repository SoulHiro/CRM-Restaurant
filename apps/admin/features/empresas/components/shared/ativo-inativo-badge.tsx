import { Badge } from '@repo/ui/components/badge'

export function AtivoInativoBadge({
  active,
  activeLabel = 'Ativo',
  inactiveLabel = 'Inativo',
}: {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}) {
  return (
    <Badge variant={active ? 'default' : 'secondary'}>
      {active ? activeLabel : inactiveLabel}
    </Badge>
  )
}
