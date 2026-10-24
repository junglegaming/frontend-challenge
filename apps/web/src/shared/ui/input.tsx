import * as React from "react"
import { cn } from "@/shared/lib/cn"

/** Single text control: 40 px high, token colors, 3 px focus ring, error state via aria-invalid. */
export const controlClass =
  "h-control w-full min-w-0 rounded-sm border border-input bg-background px-3 text-body text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(controlClass, className)} {...props} />
}

export { Input }
