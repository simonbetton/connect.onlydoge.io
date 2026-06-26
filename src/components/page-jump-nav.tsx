import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

export type PageJumpNavItem = {
  href: string
  label: string
}

export function PageJumpNav({
  items,
  ariaLabel,
  className,
}: {
  items: PageJumpNavItem[]
  ariaLabel: string
  className?: string
}) {
  return (
    <nav aria-label={ariaLabel} className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}
