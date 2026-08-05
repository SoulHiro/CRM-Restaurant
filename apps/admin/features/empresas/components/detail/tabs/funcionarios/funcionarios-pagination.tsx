'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@repo/ui/components/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@repo/ui/lib/utils'

import { useQueryParams } from '@/hooks/use-query-params'
import { FUNCIONARIOS_PAGE_SIZES } from '../../../../lib/funcionarios-helpers'

function getPageNumbers(
  current: number,
  total: number
): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const result: (number | 'ellipsis')[] = []
  let previous = 0
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push('ellipsis')
    result.push(page)
    previous = page
  }
  return result
}

export function FuncionariosPagination({
  page,
  pageSize,
  total,
  totalPages,
}: {
  page: number
  pageSize: number
  total: number
  totalPages: number
}) {
  const { setParams } = useQueryParams()

  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Mostrando {start}–{end} de {total}
        </span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) =>
            setParams({ funcPageSize: value, funcPage: null })
          }
        >
          <SelectTrigger className="h-8 w-[4.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FUNCIONARIOS_PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>por página</span>
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              className={cn(page === 1 && 'pointer-events-none opacity-50')}
              onClick={(e) => {
                e.preventDefault()
                if (page > 1) setParams({ funcPage: String(page - 1) })
              }}
            />
          </PaginationItem>

          {pageNumbers.map((item, index) =>
            item === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(e) => {
                    e.preventDefault()
                    setParams({ funcPage: String(item) })
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              className={cn(
                page === totalPages && 'pointer-events-none opacity-50'
              )}
              onClick={(e) => {
                e.preventDefault()
                if (page < totalPages) setParams({ funcPage: String(page + 1) })
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
