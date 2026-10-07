import { cn } from "@/shared/lib/cn"

/**
 * Shimmer-effect skeleton (required by the challenge for catalog/detail/cart).
 * Preserve layout dimensions by sizing the skeleton exactly like the real content.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-accent/40",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r",
        "before:from-transparent before:via-foreground/10 before:to-transparent",
        "before:animate-shimmer motion-reduce:before:animate-none",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
