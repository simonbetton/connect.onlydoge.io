import type * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-3xl border border-border/70 bg-card/75 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset,0_18px_60px_oklch(0.32_0.03_55/0.08)] backdrop-blur transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-2 p-5 sm:p-6", className)}
      {...props}
    />
  )
}

function CardTitle({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-balance font-display font-semibold text-xl tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-pretty text-base/7 text-muted-foreground sm:text-sm/6", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />
  )
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle }
