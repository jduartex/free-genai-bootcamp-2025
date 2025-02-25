import { cn } from "@/lib/utils"

/**
 * Renders a placeholder skeleton element.
 *
 * This component displays a div with a pulsing animation, rounded corners, and a light background,
 * making it suitable as a loading state indicator. Additional div attributes and styles are merged
 * with the default settings.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
