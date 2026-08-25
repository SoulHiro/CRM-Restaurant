'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'

/**
 * Direção 'bottom' é sempre o bottom sheet mobile (ver `useDrawerDirection`)
 * — arrastar pra fechar sem querer enquanto rola um formulário longo é o bug
 * relatado, então esse caso só fecha por gesto/clique fora se o consumidor
 * pedir explicitamente. Outras direções (o painel flutuante do desktop)
 * continuam dismissible por padrão.
 */
const Drawer = ({
  shouldScaleBackground = true,
  dismissible,
  direction = 'bottom',
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    direction={direction}
    dismissible={dismissible ?? direction !== 'bottom'}
    {...props}
  />
)
Drawer.displayName = 'Drawer'

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/80', className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const drawerVariants = cva('fixed z-50 flex flex-col bg-background', {
  variants: {
    direction: {
      top: 'inset-x-0 top-0 mb-24 h-auto',
      bottom: 'inset-x-0 bottom-0 mt-24 h-auto',
      left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm',
      right: 'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm',
    },
    variant: {
      default: 'border',
      float: 'm-4 rounded-[10px] border shadow-2xl',
      fullscreen: '',
    },
  },
  compoundVariants: [
    { direction: 'bottom', variant: 'default', class: 'rounded-t-[10px]' },
    { direction: 'top', variant: 'default', class: 'rounded-b-[10px]' },
    { direction: 'left', variant: 'default', class: 'border-r' },
    { direction: 'right', variant: 'default', class: 'border-l' },
    {
      direction: ['left', 'right'],
      variant: 'float',
      class: 'h-[calc(100%-2rem)]',
    },
    {
      direction: ['top', 'bottom'],
      variant: 'float',
      class: 'w-[calc(100%-2rem)]',
    },
    {
      // Bottom sheet ganha a tela inteira no mobile — sem a margem
      // reservada do padrão (`mt-24`) e sem cantos arredondados. `h-dvh`,
      // não `h-full`/100vh: a barra de endereço do navegador mobile muda de
      // altura e cortava o conteúdo com viewport unit fixa.
      direction: 'bottom',
      variant: 'fullscreen',
      class: 'mt-0 h-dvh rounded-none border-0',
    },
  ],
  defaultVariants: {
    direction: 'bottom',
    variant: 'default',
  },
})

interface DrawerContentProps
  extends
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>,
    VariantProps<typeof drawerVariants> {}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(
  (
    {
      className,
      direction = 'bottom',
      variant = 'default',
      children,
      ...props
    },
    ref
  ) => (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(drawerVariants({ direction, variant }), className)}
        {...props}
      >
        {direction === 'bottom' && variant !== 'fullscreen' && (
          <div className="mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full bg-muted" />
        )}
        {variant === 'fullscreen' && (
          <DrawerPrimitive.Close
            className="absolute right-4 top-4 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </DrawerPrimitive.Close>
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
)
DrawerContent.displayName = 'DrawerContent'

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid gap-1.5 p-4 text-center sm:text-left', className)}
    {...props}
  />
)
DrawerHeader.displayName = 'DrawerHeader'

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'sticky bottom-0 mt-auto flex flex-col gap-2 border-t bg-background p-4',
      className
    )}
    {...props}
  />
)
DrawerFooter.displayName = 'DrawerFooter'

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
