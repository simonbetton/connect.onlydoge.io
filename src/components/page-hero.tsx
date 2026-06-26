import type * as React from "react"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  aside?: React.ReactNode
  children?: React.ReactNode
  variant?: "brand" | "warm"
  titleClassName?: string
  className?: string
}

const variantClasses = {
  brand: {
    section:
      "relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-primary/80 via-background to-primary/40 shadow-sm",
    blurA: "absolute -top-24 -right-14 size-56 rounded-full bg-primary/20 blur-3xl",
    blurB: "absolute -bottom-16 -left-20 size-56 rounded-full bg-primary/20 blur-3xl",
  },
  warm: {
    section:
      "relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-amber-100/70 via-background to-orange-100/70 shadow-sm",
    blurA: "absolute -top-16 -right-12 size-40 rounded-full bg-amber-300/25 blur-3xl",
    blurB: "absolute -bottom-20 -left-18 size-44 rounded-full bg-orange-400/20 blur-3xl",
  },
} as const

export function PageHero({
  title,
  description,
  eyebrow,
  aside,
  children,
  variant = "brand",
  titleClassName,
  className,
}: PageHeroProps) {
  const styles = variantClasses[variant]

  return (
    <section className={cn(styles.section, "p-6 sm:p-8", className)}>
      <div className={styles.blurA} aria-hidden />
      <div className={styles.blurB} aria-hidden />
      <div className="relative space-y-4">
        <div
          className={cn("flex flex-wrap items-start gap-4", aside ? "justify-between" : "flex-col")}
        >
          <div className="max-w-3xl space-y-2">
            {eyebrow ? eyebrow : null}
            <h1 className={cn("font-semibold text-2xl tracking-tight sm:text-3xl", titleClassName)}>
              {title}
            </h1>
            {description ? (
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            ) : null}
          </div>
          {aside ? <div className="flex flex-wrap gap-2">{aside}</div> : null}
        </div>
        {children}
      </div>
    </section>
  )
}
