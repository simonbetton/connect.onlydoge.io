import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button-variants"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import { cn } from "@/lib/utils"
import { MarketingHeroQrDrop } from "./marketing-hero-qr-drop"
import { FlightRecorderMock, HeroWorkbenchMock, ToolsWorkbenchMock } from "./workbench-mocks"

const proofStats = [
  { value: "3", label: "surfaces", detail: "Protocol, tools, and traces in one debugger." },
  { value: "0", label: "live writes", detail: "Until an operator explicitly arms a session." },
  {
    value: "1",
    label: "shareable trace",
    detail: "Export sanitized evidence for every bug report.",
  },
] as const

const workflowSteps = [
  {
    title: "Understand the protocol",
    body: "Start with the plain-language model for QR, envelope, and relay responsibilities.",
    to: "/protocol" as const,
  },
  {
    title: "Validate a single artifact",
    body: "Use focused tools when you need fast answers about one URI, envelope, or relay response.",
    to: "/tools" as const,
  },
  {
    title: "Record the whole session",
    body: "Move into Flight Recorder when the failure spans parsing, fetching, relays, and execution.",
    to: "/flight-recorder" as const,
  },
] as const

function SectionTag({ children }: { children: ReactNode }) {
  return (
    <span className="section-tag section-tag-glow inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5">
      <Paragraph as="span" size="xs-medium" color="foreground">
        {children}
      </Paragraph>
    </span>
  )
}

function SplitSection({
  tag,
  title,
  body,
  link,
  linkLabel,
  mock,
  reverse = false,
  className,
}: {
  tag: string
  title: string
  body: string
  link: "/protocol" | "/tools" | "/flight-recorder"
  linkLabel: string
  mock: ReactNode
  reverse?: boolean
  className?: string
}) {
  return (
    <section className={cn("py-(--space-2xl) md:py-(--space-3xl)", className)}>
      <div
        className={cn(
          "mx-auto grid w-full min-w-0 max-w-332 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-16 lg:px-5",
          reverse && "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1"
        )}
      >
        <div className="micro-reveal min-w-0 self-center motion-reduce:animate-none">
          <SectionTag>{tag}</SectionTag>
          <Heading as="h2" size="display" className="mt-5 max-w-lg">
            {title}
          </Heading>
          <Paragraph size="lg" className="mt-4 max-w-md">
            {body}
          </Paragraph>
          <Link
            to={link}
            className="group/link micro-link-nudge micro-press mt-6 inline-flex items-center gap-1 motion-reduce:active:scale-100"
          >
            <Paragraph
              as="span"
              size="sm-medium"
              color="foreground"
              className="wrap-break-word inline-flex items-center gap-1 underline decoration-border underline-offset-[3px] transition-[color,text-decoration-color] duration-200 ease-out hover:decoration-accent-ink"
            >
              {linkLabel}
            </Paragraph>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              className="transition-transform duration-140 ease-out group-hover/link:translate-x-0.5 motion-reduce:group-hover/link:translate-x-0"
            />
          </Link>
        </div>
        <div className="micro-reveal micro-reveal-delay-2 min-w-0 motion-reduce:animate-none">
          <div className="mock-panel-stage motion-reduce:animate-none">{mock}</div>
        </div>
      </div>
    </section>
  )
}

export function MarketingHomePage() {
  return (
    <div className="min-w-0">
      <section className="relative overflow-hidden bg-paper pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-150 bg-[radial-gradient(circle_at_15%_12%,oklch(from_var(--primary)_l_c_h/0.42),transparent_32%),radial-gradient(circle_at_75%_0%,oklch(0.88_0.12_80/0.28),transparent_30%),linear-gradient(180deg,var(--color-hero-wash)_0%,oklch(from_var(--color-hero-wash)_l_c_h/0)_64%)]" />
        <div
          className="mask-[linear-gradient(90deg,transparent,black_24%,black_76%,transparent)] pointer-events-none absolute top-20 left-1/2 h-80 w-6xl -translate-x-1/2 rounded-full border border-primary/18 opacity-70"
          aria-hidden
        />
        <div
          className="home-ring-scan pointer-events-none absolute top-32 left-1/2 size-96 -translate-x-1/2 rounded-full border border-primary/25 motion-reduce:animate-none"
          aria-hidden
        />
        <span
          className="home-float-orb pointer-events-none absolute top-44 right-[18%] size-3 rounded-full bg-status shadow-[0_0_34px_oklch(from_var(--color-status)_l_c_h/0.7)] motion-reduce:animate-none"
          aria-hidden
        />
        <span
          className="home-float-orb home-float-orb-delay pointer-events-none absolute top-92 left-[11%] size-2 rounded-full bg-primary shadow-[0_0_28px_oklch(from_var(--primary)_l_c_h/0.8)] motion-reduce:animate-none"
          aria-hidden
        />
        <div className="relative z-2 mx-auto grid w-full min-w-0 max-w-332 gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-16 lg:px-5">
          <div className="min-w-0 animate-reveal-fade-up motion-reduce:animate-none">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">OnlyDoge by EasyDoge</Badge>
              <Badge variant="success">Local-first debugger</Badge>
            </div>
            <Heading as="h1" size="hero" className="mt-5 max-w-[11ch]">
              Debug payment flows like a control room.
            </Heading>
            <Paragraph size="lg" className="mt-6 max-w-160">
              A premium workbench for DogeConnect builders: understand the spec, validate every
              artifact, simulate relays, and capture trace-level evidence before your wallet or
              checkout reaches production.
            </Paragraph>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/tools" className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}>
                <Paragraph as="span" size="sm-medium" color="inherit">
                  Start with Tools
                </Paragraph>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </Link>
              <Link
                to="/protocol"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                <Paragraph as="span" size="sm-medium" color="inherit">
                  Read the Protocol
                </Paragraph>
              </Link>
            </div>
            <Paragraph as="p" size="xs" className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex size-1.5 animate-status-pulse rounded-full bg-status motion-reduce:animate-none" />
              <span>
                Open source ·{" "}
                <Paragraph as="strong" size="inherit" color="foreground" className="font-medium">
                  OpenAPI
                </Paragraph>{" "}
                included
              </span>
            </Paragraph>
            <MarketingHeroQrDrop />
          </div>
          <HeroWorkbenchMock className="hidden min-w-0 lg:block" />
        </div>
        <div className="relative z-2 mx-auto mt-10 max-w-332 px-4 sm:px-6 lg:hidden lg:px-5">
          <HeroWorkbenchMock />
        </div>
      </section>

      <section className="border-border border-t bg-background py-10 sm:py-12">
        <div className="mx-auto grid max-w-332 gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-5">
          {proofStats.map((stat) => (
            <div
              key={stat.label}
              className="home-stat-card micro-reveal rounded-3xl border border-border/70 bg-card/65 p-5 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset] motion-reduce:animate-none"
            >
              <Paragraph
                size="inherit"
                color="foreground"
                font="display"
                className="text-5xl tabular-nums tracking-tight"
              >
                {stat.value}
              </Paragraph>
              <Paragraph size="sm-medium" color="foreground" className="mt-2">
                {stat.label}
              </Paragraph>
              <Paragraph size="xs" className="mt-1">
                {stat.detail}
              </Paragraph>
            </div>
          ))}
        </div>
      </section>

      <section className="py-(--space-2xl) md:py-(--space-3xl)">
        <div className="mx-auto max-w-332 px-4 sm:px-6 lg:px-5">
          <SectionTag>System map</SectionTag>
          <Heading as="h2" size="display" className="mt-5 max-w-[17ch]">
            One journey, three levels of confidence
          </Heading>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <Link
                key={step.title}
                to={step.to}
                className="group/workflow-step home-workflow-card micro-hover-lift micro-press rounded-3xl border border-border/70 bg-card/70 p-5 no-underline shadow-[0_1px_0_oklch(1_0_0/0.55)_inset] motion-reduce:active:scale-100"
              >
                <span className="workflow-step-badge grid size-9 place-items-center rounded-full bg-primary/55 font-display font-semibold text-foreground text-sm">
                  {index + 1}
                </span>
                <Paragraph
                  size="lg"
                  color="foreground"
                  font="display"
                  className="mt-5 font-semibold"
                >
                  {step.title}
                </Paragraph>
                <Paragraph size="sm" className="mt-2">
                  {step.body}
                </Paragraph>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SplitSection
        className="border-border border-t"
        tag="Protocol clarity"
        title="The spec, reduced to operational decisions"
        body="Before you validate or trace anything, read the payment model in plain language. See where QR parameters, signed envelopes, wallet checks, and relay state transitions meet."
        link="/protocol"
        linkLabel="Read the Protocol"
        mock={<FlightRecorderMock />}
      />

      <SplitSection
        tag="Quick checks"
        title="Tools for one-off validation"
        body="Fast checks for QR URIs, envelopes, and relay simulator responses. Use this when you need to verify one payload or inspect a response contract without building a full trace session."
        link="/tools"
        linkLabel="Open Tools"
        mock={<ToolsWorkbenchMock />}
      />

      <SplitSection
        tag="Full traces"
        title="Flight Recorder for investigation"
        body="End-to-end traces for investigation and repeatable debugging. Build a timeline from QR parsing through relay pay/status execution, then export sanitized sessions."
        link="/flight-recorder"
        linkLabel="Open Flight Recorder"
        mock={<FlightRecorderMock />}
        reverse
      />
    </div>
  )
}
