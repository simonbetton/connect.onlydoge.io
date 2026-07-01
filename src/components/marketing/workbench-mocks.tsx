import type * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Paragraph } from "@/components/ui/paragraph"
import { cn } from "@/lib/utils"

const steps = [
  { label: "Parse QR", meta: "dc + h aligned", state: "pass" },
  { label: "Verify envelope", meta: "BIP-340 signature", state: "pass" },
  { label: "Relay status", meta: "accepted in 418ms", state: "pending" },
] as const

function MockFrame({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string
  eyebrow: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border/70 bg-card/85 shadow-[0_1px_0_oklch(1_0_0/0.62)_inset,0_24px_80px_oklch(0.3_0.03_55/0.16)] backdrop-blur",
        className
      )}
    >
      <div className="flex items-center justify-between border-border/60 border-b px-4 py-3">
        <div>
          <Paragraph size="xs-medium" className="text-muted-foreground">
            {eyebrow}
          </Paragraph>
          <Paragraph size="sm-medium" color="foreground" font="display">
            {title}
          </Paragraph>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-danger" />
          <span className="size-2 rounded-full bg-warning" />
          <span className="size-2 rounded-full bg-success" />
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export function ToolsWorkbenchMock({ className }: { className?: string }) {
  return (
    <MockFrame title="Payload tools" eyebrow="One-off validation" className={className}>
      <div className="grid gap-3">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
          <Paragraph size="xs-medium" color="foreground">
            dogecoin:DPD7...&dc=/api/mock/envelope&h=72b
          </Paragraph>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-3/4 rounded-full bg-primary" />
          </div>
        </div>
        {steps.map((step, index) => (
          <div
            key={step.label}
            className="mock-step-row rounded-2xl border border-border bg-background p-3"
            data-mock-phase={index}
          >
            <div className="flex items-start gap-3">
              <span className="mock-step-index grid size-7 shrink-0 place-items-center rounded-full border border-border bg-muted text-muted-foreground text-xs">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <Paragraph size="sm-medium" color="foreground">
                  {step.label}
                </Paragraph>
                <Paragraph size="xs">{step.meta}</Paragraph>
              </div>
              <Badge variant={step.state === "pending" ? "warning" : "success"}>{step.state}</Badge>
            </div>
          </div>
        ))}
      </div>
    </MockFrame>
  )
}

export function FlightRecorderMock({ className }: { className?: string }) {
  const events = ["QR parsed", "Envelope verified", "Pay draft ready", "Relay accepted"]

  return (
    <MockFrame title="Flight Recorder" eyebrow="Trace replay" className={className}>
      <div className="grid gap-4">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <Paragraph size="sm-medium" color="foreground">
              Session verdict
            </Paragraph>
            <Badge variant="success">pass</Badge>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["418ms", "4 steps", "0 leaks"].map((value) => (
              <div key={value} className="rounded-xl bg-muted/55 p-2 text-center">
                <Paragraph size="xs-medium" color="foreground" className="tabular-nums">
                  {value}
                </Paragraph>
              </div>
            ))}
          </div>
        </div>
        <div className="mock-sequenced-timeline relative">
          {events.map((event, index) => (
            <div
              key={event}
              className="mock-timeline-event relative grid grid-cols-[0.875rem_minmax(0,1fr)] gap-3 pb-4 last:pb-0"
              data-mock-phase={index}
            >
              {index < events.length - 1 ? (
                <>
                  <span
                    className="absolute top-3 -bottom-3 left-1.5 z-0 w-px rounded-full bg-border/60"
                    aria-hidden
                  />
                  <span
                    className="mock-timeline-segment-fill absolute top-3 -bottom-3 left-1.5 z-0 w-px rounded-full bg-status"
                    aria-hidden
                  />
                </>
              ) : null}
              <span className="mock-timeline-dot relative z-1 mt-1.5 size-3 rounded-full border-2 border-card bg-success" />
              <div className="min-w-0">
                <Paragraph size="sm-medium" color="foreground" className="mock-timeline-label">
                  {event}
                </Paragraph>
                <Paragraph size="xs" className="mock-timeline-meta">
                  Artifact captured and normalized
                </Paragraph>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockFrame>
  )
}

export function HeroWorkbenchMock({ className }: { className?: string }) {
  return (
    <div className={cn("mock-hero-stack relative min-h-112", className)}>
      <ToolsWorkbenchMock className="mock-hero-card-enter mock-panel--tools absolute top-10 right-8 left-0 -rotate-3 [--hero-card-i:0]" />
      <FlightRecorderMock className="mock-hero-card-enter mock-panel--trace absolute top-0 right-0 left-8 rotate-2 [--hero-card-i:1]" />
    </div>
  )
}
