import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium text-xs",
  {
    variants: {
      variant: {
        neutral: "border-border bg-muted text-foreground",
        success: "border-success-border bg-success-muted text-success-foreground",
        danger: "border-danger-border bg-danger-muted text-danger-foreground",
        warning: "border-warning-border bg-warning-muted text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge }
