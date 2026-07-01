import type { ReactNode } from "react"
import { ExternalLinkIcon } from "@/components/external-link-icon"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"

export function ProtoCode({
  children,
  highlight = false,
}: {
  children: ReactNode
  highlight?: boolean
}) {
  return (
    <Paragraph
      as="code"
      font="outlier"
      color="foreground"
      className={
        highlight
          ? "inline-block rounded-[calc(var(--radius-card)*0.75)] border border-primary/45 bg-primary/20 px-1.5 py-0.5 align-baseline text-[0.88em] leading-[1.3]"
          : "text-[0.9em]"
      }
    >
      {children}
    </Paragraph>
  )
}

export function ExternalDocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      <Paragraph
        as="span"
        size="sm-medium"
        color="foreground"
        className="wrap-break-word inline-flex items-center gap-1 underline decoration-border underline-offset-[3px] transition-[color,text-decoration-color] duration-200 ease-out hover:decoration-accent-ink"
      >
        {children}
        <ExternalLinkIcon />
      </Paragraph>
    </a>
  )
}

export function SectionHang({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Heading
      as="h2"
      id={id}
      size="display"
      className="wrap-anywhere mt-(--space-3xl) mb-6 min-w-0 scroll-mt-24 pt-(--space-xl) first:mt-(--space-2xl) first:pt-0 sm:scroll-mt-28"
    >
      {children}
    </Heading>
  )
}

export function DefList({
  items,
}: {
  items: readonly { term: string; detail: string; href?: string }[]
}) {
  return (
    <dl className="m-0 flex flex-col gap-0">
      {items.map((item) => (
        <div
          key={item.term}
          className="grid gap-1 border-border border-b py-6 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-6"
        >
          <Paragraph as="dt" size="inherit" color="foreground" className="font-medium">
            {item.term}
          </Paragraph>
          <dd className="m-0">
            {item.href ? (
              <ExternalDocLink href={item.href}>{item.detail}</ExternalDocLink>
            ) : (
              <Paragraph as="span">{item.detail}</Paragraph>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
