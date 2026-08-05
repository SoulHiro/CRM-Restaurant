import { Avatar, AvatarFallback } from '@repo/ui/components/avatar'
import { getInitials } from '@repo/ui/lib/utils'

export function PersonAvatar({
  name,
  className,
  fallbackClassName,
}: {
  name: string
  className?: string
  fallbackClassName?: string
}) {
  return (
    <Avatar className={className}>
      <AvatarFallback className={fallbackClassName}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
