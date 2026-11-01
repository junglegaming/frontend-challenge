import * as React from 'react'

import { Tabs as TabsPrimitive } from 'radix-ui'

import { cn } from '@/shared/lib/cn'

/** Abas (Radix): navegação por setas e semântica `tablist`/`tab`/`tabpanel`. */
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col', className)} {...props} />
  )
}

/** Lista de abas no padrão Kurio: linha âmbar sob a aba ativa. */
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('flex items-center gap-8 border-b border-primary/30', className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        '-mb-px cursor-pointer border-b-[3px] border-transparent pb-3 font-mono text-[17px] leading-4 font-normal text-foreground transition-colors hover:text-highlight',
        'data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:text-highlight',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('pt-6 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
