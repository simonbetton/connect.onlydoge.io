import type * as React from "react"
import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: primitive; callers pass htmlFor via Field
    <label
      className={cn("font-medium text-muted-foreground text-xs uppercase tracking-wide", className)}
      {...props}
    />
  )
}

export { Label }
