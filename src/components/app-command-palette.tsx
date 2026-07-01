"use client"

import * as React from "react"
import { Paragraph } from "@/components/ui/paragraph"
import { cn } from "@/lib/utils"

export type AppCommandItem = {
  id: string
  label: string
  hint: string
  action: () => void | Promise<void>
}

export function useCommandPaletteToggle(setOpen: React.Dispatch<React.SetStateAction<boolean>>) {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((open) => !open)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [setOpen])
}

export function AppCommandPalette({
  open,
  onOpenChange,
  items,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: AppCommandItem[]
}) {
  if (!open) {
    return null
  }

  return <AppCommandPalettePanel items={items} onOpenChange={onOpenChange} />
}

function AppCommandPalettePanel({
  onOpenChange,
  items,
}: {
  onOpenChange: (open: boolean) => void
  items: AppCommandItem[]
}) {
  const [query, setQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onOpenChange])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredItems = normalizedQuery
    ? items.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(normalizedQuery))
    : items

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/25 p-4 pt-[10vh] backdrop-blur-md sm:pt-[14vh]"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close command palette"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="modal-enter relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-card shadow-[0_1px_0_oklch(1_0_0/0.72)_inset,0_40px_120px_oklch(0.16_0.02_52/0.28)] ring-1 ring-foreground/10 motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-label="Search pages and actions"
      >
        <div
          className="pointer-events-none absolute -top-24 right-8 size-56 rounded-full bg-primary/25 blur-3xl"
          aria-hidden
        />
        <div className="relative border-border/70 border-b p-4">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-3 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset]">
            <Paragraph as="span" size="sm-medium" color="foreground" aria-hidden>
              /
            </Paragraph>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages, tools, or actions"
              aria-label="Search pages and actions"
              className="h-12 min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
            />
            <Paragraph
              as="kbd"
              size="micro"
              font="mono"
              className="rounded-md border border-border/70 bg-muted/60 px-1.5 py-0.5"
            >
              esc
            </Paragraph>
          </div>
        </div>
        <div className="relative max-h-[calc(100dvh-12rem)] overflow-y-auto p-2 sm:max-h-112">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left",
                  "hover:border-border/70 hover:bg-background/80 focus-visible:outline-2 focus-visible:outline-focus active:scale-[0.995]"
                )}
                onClick={() => {
                  onOpenChange(false)
                  void item.action()
                }}
              >
                <span className="min-w-0 flex-1">
                  <Paragraph size="sm-medium" color="foreground">
                    {item.label}
                  </Paragraph>
                  <Paragraph size="sm" className="mt-0.5">
                    {item.hint}
                  </Paragraph>
                </span>
              </button>
            ))
          ) : (
            <Paragraph size="sm" className="p-3">
              No commands found.
            </Paragraph>
          )}
        </div>
      </div>
    </div>
  )
}
