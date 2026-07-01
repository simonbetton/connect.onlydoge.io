import type { ReactNode } from "react"
import type { PageJumpNavItem } from "@/components/page-jump-nav"
import { ProtocolSectionNav } from "@/components/protocol/protocol-section-nav"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import { cn } from "@/lib/utils"

type WorkbenchShellProps = {
  header: ReactNode
  children: ReactNode
  className?: string
}

export function WorkbenchShell({ header, children, className }: WorkbenchShellProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full min-w-0 max-w-332 px-4 py-8 sm:px-6 sm:py-10 lg:px-5",
        className
      )}
    >
      <div
        className="mask-[linear-gradient(180deg,black_0%,black_58%,transparent_100%)] pointer-events-none absolute top-0 left-1/2 -z-1 h-120 w-dvw -translate-x-1/2 bg-[radial-gradient(circle_at_18%_0%,oklch(from_var(--primary)_l_c_h/0.24),transparent_34%),radial-gradient(circle_at_82%_8%,oklch(0.9_0.1_92/0.22),transparent_30%),linear-gradient(180deg,oklch(from_var(--color-hero-wash)_l_c_h/0.72),oklch(from_var(--color-hero-wash)_l_c_h/0.34)_42%,transparent_88%)]"
        aria-hidden
      />
      {header}
      <div className="mt-10 flex min-w-0 flex-col gap-12">{children}</div>
    </div>
  )
}

type WorkbenchHeaderProps = {
  title: ReactNode
  description?: ReactNode
  aside?: ReactNode
  actions?: ReactNode
}

export function WorkbenchHeader({ title, description, aside, actions }: WorkbenchHeaderProps) {
  return (
    <header className="micro-reveal relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/74 p-5 shadow-[0_1px_0_oklch(1_0_0/0.62)_inset,0_22px_70px_oklch(0.32_0.03_55/0.08)] backdrop-blur motion-reduce:animate-none sm:p-6 lg:p-7">
      <div
        className="pointer-events-none absolute -top-28 right-12 size-72 rounded-full bg-primary/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent"
        aria-hidden
      />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          {aside ? <div className="mb-4 flex flex-wrap items-center gap-2">{aside}</div> : null}
          <Heading as="h1" size="display" font="display" className="max-w-[18ch]">
            {title}
          </Heading>
          {description ? (
            <Paragraph size="lg" className="mt-3 max-w-[58ch]">
              {description}
            </Paragraph>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Paragraph
              as="span"
              size="xs-medium"
              className="hidden w-full text-right text-muted-foreground lg:block"
            >
              Quick actions
            </Paragraph>
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}

type WorkbenchSectionProps = {
  id: string
  title: string
  description: string
  children: ReactNode
}

export function WorkbenchSection({ id, title, description, children }: WorkbenchSectionProps) {
  return (
    <section
      id={id}
      className="micro-reveal min-w-0 scroll-mt-24 border-border/65 border-b pb-(--space-xl) last:border-b-0 last:pb-0 motion-reduce:animate-none"
    >
      <header className="mb-6">
        <Heading as="h2" size="xl" font="display" className="wrap-anywhere min-w-0 max-w-[30ch]">
          {title}
        </Heading>
        <Paragraph size="sm" className="mt-2 max-w-[56ch]">
          {description}
        </Paragraph>
      </header>
      {children}
    </section>
  )
}

type WorkbenchPageLayoutProps = {
  sectionNavItems: PageJumpNavItem[]
  sectionNavAriaLabel: string
  children: ReactNode
}

export function WorkbenchPageLayout({
  sectionNavItems,
  sectionNavAriaLabel,
  children,
}: WorkbenchPageLayoutProps) {
  return (
    <div className="grid min-w-0 gap-(--space-lg) lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:items-start lg:gap-(--space-2xl)">
      <aside
        className="min-w-0 lg:sticky lg:top-[calc(var(--space-xl)+4rem)] lg:pt-1"
        aria-label={sectionNavAriaLabel}
      >
        <Paragraph
          size="xs-medium"
          className="mb-4 hidden uppercase tracking-(--tracking-label) lg:block"
        >
          Sections
        </Paragraph>
        <ProtocolSectionNav
          items={sectionNavItems}
          ariaLabel={sectionNavAriaLabel}
          orientation="vertical"
          className="hidden lg:flex"
        />
        <ProtocolSectionNav
          items={sectionNavItems}
          ariaLabel={sectionNavAriaLabel}
          orientation="horizontal"
          className="flex lg:hidden"
        />
      </aside>

      <div className="flex min-w-0 flex-col gap-(--space-xl)">{children}</div>
    </div>
  )
}
