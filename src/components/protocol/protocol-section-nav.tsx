"use client"

import { useEffect, useRef, useState } from "react"
import type { PageJumpNavItem } from "@/components/page-jump-nav"
import { Paragraph } from "@/components/ui/paragraph"
import { cn } from "@/lib/utils"

export function ProtocolSectionNav({
  items,
  ariaLabel,
  className,
  orientation = "vertical",
}: {
  items: PageJumpNavItem[]
  ariaLabel: string
  className?: string
  orientation?: "horizontal" | "vertical"
}) {
  const isVertical = orientation === "vertical"
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? "")
  const [indicator, setIndicator] = useState({ top: 0, height: 0 })
  const navRef = useRef<HTMLElement>(null)
  const linkRefs = useRef<Map<string, HTMLAnchorElement> | null>(null)
  if (linkRefs.current === null) {
    linkRefs.current = new Map()
  }
  const linksByHref = linkRefs.current

  useEffect(() => {
    const sectionIds = items.flatMap((item) => {
      const id = item.href.replace(/^#/, "")
      return id.length > 0 ? [id] : []
    })
    const elements = sectionIds.flatMap((id) => {
      const element = document.getElementById(id)
      return element !== null ? [element] : []
    })

    if (elements.length === 0) {
      return
    }

    const visibleSections = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleSections.set(entry.target.id, entry.intersectionRatio)
        }

        const ranked = [...visibleSections.entries()]
          .filter(([, ratio]) => ratio > 0)
          .sort((a, b) => b[1] - a[1])

        const nextId = ranked[0]?.[0]
        if (nextId) {
          setActiveHref(`#${nextId}`)
        }
      },
      { rootMargin: "-18% 0px -58% 0px", threshold: [0, 0.15, 0.35, 0.6, 1] }
    )

    for (const element of elements) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    if (!isVertical) {
      return
    }

    const updateIndicator = () => {
      const link = linksByHref.get(activeHref)
      const nav = navRef.current
      if (!link || !nav) {
        return
      }

      setIndicator({
        top: link.offsetTop,
        height: link.offsetHeight,
      })
    }

    updateIndicator()
    window.addEventListener("resize", updateIndicator)
    return () => window.removeEventListener("resize", updateIndicator)
  }, [activeHref, isVertical, linksByHref])

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      className={cn(
        isVertical
          ? "relative flex flex-col gap-1 border-border border-s ps-4"
          : "flex flex-wrap gap-1",
        className
      )}
    >
      {isVertical ? (
        <span
          className="pointer-events-none absolute top-0 -left-px w-0.5 rounded-full bg-primary transition-[transform,height] duration-200 ease-out motion-reduce:transition-none"
          style={{
            transform: `translateY(${indicator.top}px)`,
            height: indicator.height > 0 ? `${indicator.height}px` : undefined,
          }}
          aria-hidden
        />
      ) : null}
      {items.map((item) => {
        const isActive = activeHref === item.href

        return (
          <a
            key={item.href}
            ref={(node) => {
              if (node) {
                linksByHref.set(item.href, node)
              } else {
                linksByHref.delete(item.href)
              }
            }}
            href={item.href}
            aria-current={isActive ? "location" : undefined}
            className={cn(
              "block border border-transparent no-underline transition-[color,background-color,border-color] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 motion-reduce:transition-none",
              isVertical
                ? "px-4 py-1 hover:text-foreground"
                : "inline-flex h-8 items-center whitespace-nowrap rounded-lg bg-paper px-4 hover:border-border hover:bg-muted/35 hover:text-foreground",
              isActive &&
                (isVertical ? "text-foreground" : "border-border bg-muted/35 text-foreground")
            )}
          >
            <Paragraph
              as="span"
              size="sm"
              color={isActive ? "foreground" : undefined}
              className="leading-[1.35]"
            >
              {item.label}
            </Paragraph>
          </a>
        )
      })}
    </nav>
  )
}
