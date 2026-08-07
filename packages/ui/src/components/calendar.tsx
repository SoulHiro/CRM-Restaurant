'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DayPicker,
  getDefaultClassNames,
  type ChevronProps,
} from 'react-day-picker'

import { buttonVariants } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'

function CalendarChevron({ className, orientation, ...props }: ChevronProps) {
  if (orientation === 'left') {
    return <ChevronLeft className={cn('size-4', className)} {...props} />
  }
  return <ChevronRight className={cn('size-4', className)} {...props} />
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('flex flex-col gap-4', defaultClassNames.months),
        month: cn('flex flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex items-center justify-between',
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'size-7 cursor-pointer bg-transparent p-0',
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'size-7 cursor-pointer bg-transparent p-0',
          defaultClassNames.button_next
        ),
        month_caption: cn(
          'flex h-7 items-center justify-center',
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          'text-sm font-medium',
          defaultClassNames.caption_label
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'w-8 text-xs font-normal text-muted-foreground',
          defaultClassNames.weekday
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        day: cn(
          'relative h-8 w-8 p-0 text-center text-sm focus-within:relative focus-within:z-20',
          defaultClassNames.day
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 cursor-pointer rounded-md p-0 font-normal aria-selected:opacity-100',
          defaultClassNames.day_button
        ),
        range_start: cn(
          'rounded-l-md bg-accent',
          defaultClassNames.range_start
        ),
        range_middle: cn(
          'rounded-none bg-accent',
          defaultClassNames.range_middle
        ),
        range_end: cn('rounded-r-md bg-accent', defaultClassNames.range_end),
        selected: cn(
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
          defaultClassNames.selected
        ),
        today: cn(
          '[&>button]:border [&>button]:border-primary',
          defaultClassNames.today
        ),
        outside: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.outside
        ),
        disabled: cn(
          'text-muted-foreground opacity-50',
          defaultClassNames.disabled
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: CalendarChevron,
      }}
      {...props}
    />
  )
}

export { Calendar }
