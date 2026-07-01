"use client"

import { Paragraph } from "@/components/ui/paragraph"

export function MarketingHeroQrDrop() {
  return (
    <div className="mt-8 grid max-w-xl gap-3 rounded-3xl border border-border/70 bg-card/65 p-3 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset] backdrop-blur sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <div className="relative grid size-18 place-items-center rounded-2xl bg-primary/35">
        <div className="absolute inset-3 rounded-xl border border-foreground/15" />
        <div className="grid size-10 grid-cols-3 gap-1" aria-hidden>
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: decorative fixed QR cells
              key={index}
              className={
                index % 2 === 0
                  ? "rounded-[0.1875rem] bg-foreground"
                  : "rounded-[0.1875rem] bg-foreground/20"
              }
            />
          ))}
        </div>
      </div>
      <div>
        <Paragraph size="sm-medium" color="foreground">
          Paste or drop a DogeConnect QR
        </Paragraph>
        <Paragraph size="xs" className="mt-1">
          The debugger routes URIs to validation, envelopes to inspection, and sessions to Flight
          Recorder.
        </Paragraph>
      </div>
    </div>
  )
}
