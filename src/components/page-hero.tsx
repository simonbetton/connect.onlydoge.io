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
      "relative overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-br from-primary/65 via-background to-primary/25 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset]",
    blurA: "absolute -top-24 -right-14 size-64 rounded-full bg-primary/28 blur-3xl",
    blurB: "absolute -bottom-16 -left-20 size-64 rounded-full bg-primary/18 blur-3xl",
  },
  warm: {
    section:
      "relative overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-br from-amber-100/70 via-background to-orange-100/70 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset]",
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
    <section
      className={cn(
        styles.section,
        "micro-reveal p-6 motion-reduce:animate-none sm:p-8",
        className
      )}
    >
      <div className={styles.blurA} aria-hidden />
      <div className={styles.blurB} aria-hidden />
      <div className="relative space-y-4">
        <div
          className={cn("flex flex-wrap items-start gap-4", aside ? "justify-between" : "flex-col")}
        >
          <div className="max-w-3xl space-y-3">
            {eyebrow ? eyebrow : null}
            <h1
              className={cn(
                "text-balance font-display font-semibold text-3xl tracking-tight sm:text-5xl",
                titleClassName
              )}
            >
              {title}
            </h1>
            {description ? (
              <p className="max-w-[56ch] text-pretty text-base/7 text-muted-foreground sm:text-lg/8">
                {description}
              </p>
            ) : null}
          </div>
          {aside ? <div className="flex flex-wrap gap-2">{aside}</div> : null}
        </div>
        {children}
      </div>
    </section>
  )
}
