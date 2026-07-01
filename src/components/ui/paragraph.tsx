import type * as React from "react"
import { cn } from "@/lib/utils"

const sizeClasses = {
  inherit: "",
  micro: "text-[0.6875rem]/4",
  xs: "text-sm/6 sm:text-xs/5",
  "xs-medium": "font-medium text-sm/6 sm:text-xs/5",
  sm: "text-base/7 sm:text-sm/6",
  "sm-medium": "font-medium text-base/7 sm:text-sm/6",
  "sm-relaxed": "text-base/7 sm:text-sm/6",
  base: "text-base/7",
  lg: "text-lg/8 sm:text-base/7",
  xl: "text-xl/8 sm:text-lg/8",
} as const

const colorClasses = {
  default: "text-muted-foreground",
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  danger: "text-danger-foreground",
  success: "text-success-foreground",
  warning: "text-warning-foreground",
  inherit: "text-inherit",
} as const

const fontClasses = {
  sans: "",
  display: "font-display",
  mono: "font-mono",
  outlier: "font-mono",
} as const

type ParagraphProps<T extends React.ElementType> = {
  as?: T
  size?: keyof typeof sizeClasses
  color?: keyof typeof colorClasses
  font?: keyof typeof fontClasses
  className?: string
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "color">

export function Paragraph<T extends React.ElementType = "p">({
  as,
  size = "base",
  color = "default",
  font = "sans",
  className,
  ...props
}: ParagraphProps<T>) {
  const Component = as ?? "p"

  return (
    <Component
      className={cn(
        sizeClasses[size],
        colorClasses[color],
        fontClasses[font],
        "text-pretty",
        className
      )}
      {...props}
    />
  )
}
