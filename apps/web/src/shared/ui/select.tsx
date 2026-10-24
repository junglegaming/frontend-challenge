import * as React from "react"
import { ChevronDownIcon } from "@/shared/icons"
import { cn } from "@/shared/lib/cn"
import { controlClass } from "./input"

/**
 * Compact native select (e.g. the ".eth" suffix next to a text field). Native on purpose:
 * full keyboard and screen-reader support with no extra dependency. Needs an accessible name (aria-label or Label).
 */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative inline-flex", className)}>
      <select
        data-slot="select"
        className={cn(controlClass, "appearance-none pr-8")}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        strokeWidth={1.5}
        size={16}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-primary"
      />
    </div>
  )
}

export { Select }
