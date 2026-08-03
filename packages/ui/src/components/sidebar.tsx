"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../lib/utils"

// Context
type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue>({
  open: true,
  setOpen: () => {},
})

export function useSidebar() {
  return React.useContext(SidebarContext)
}

// Provider
export function SidebarProvider({
  children,
  defaultOpen = true,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div
        className={cn("flex min-h-screen", className)}
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-collapsed": "3rem",
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

// Sidebar container
export function Sidebar({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar()

  return (
    <aside
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "group flex h-screen w-[var(--sidebar-width)] flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        !open && "w-[var(--sidebar-width-collapsed)]",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

// Inset (main content area)
export function SidebarInset({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <main className={cn("flex flex-1 flex-col overflow-auto", className)} {...props}>
      {children}
    </main>
  )
}

// Layout sections
export function SidebarHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 p-2", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-1 flex-col gap-2 overflow-auto p-2", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 p-2", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarGroup({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarGroupLabel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-2 py-1 text-xs font-medium text-sidebar-foreground/50 group-data-[state=collapsed]:hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SidebarGroupContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)} {...props}>
      {children}
    </div>
  )
}

// Menu
export function SidebarMenu({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("flex flex-col gap-0.5", className)} {...props}>
      {children}
    </ul>
  )
}

export function SidebarMenuItem({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li className={cn("list-none", className)} {...props}>
      {children}
    </li>
  )
}

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string
}

export function SidebarMenuButton({
  children,
  className,
  asChild = false,
  isActive,
  tooltip,
  ...props
}: SidebarMenuButtonProps) {
  const { open } = useSidebar()
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-active={isActive}
      title={!open ? tooltip : undefined}
      className={cn(
        "flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-2 text-sm font-medium text-sidebar-foreground/80 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

export function SidebarSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn("my-1 border-sidebar-border", className)}
      {...props}
    />
  )
}
