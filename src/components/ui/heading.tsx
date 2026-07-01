import type * as React from "react"
import { cn } from "@/lib/utils"

const sizeClasses = {
  lg: "text-2xl tracking-tight sm:text-3xl",
  xl: "text-3xl tracking-tight sm:text-4xl",
  display: "text-4xl tracking-tight sm:text-5xl",
  hero: "text-5xl tracking-tight sm:text-6xl lg:text-7xl",
} as const

const fontClasses = {
  sans: "",
  display: "font-display",
} as const

type HeadingProps<T extends React.ElementType> = {
  as?: T
  size?: keyof typeof sizeClasses
  font?: keyof typeof fontClasses
  className?: string
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className">

export function Heading<T extends React.ElementType = "h2">({
  as,
  size = "xl",
  font = "display",
  className,
  ...props
}: HeadingProps<T>) {
  const Component = as ?? "h2"

  return (
    <Component
      className={cn(
        "text-balance font-semibold text-foreground",
        sizeClasses[size],
        fontClasses[font],
        className
      )}
      {...props}
    />
  )
}
