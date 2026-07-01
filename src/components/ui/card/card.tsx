import type * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-lg border border-border bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out)] motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

export { Card }
