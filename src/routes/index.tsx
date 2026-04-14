import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/80 via-background to-primary/40 p-8 shadow-sm">
        <div className="absolute -top-24 -right-14 size-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-20 size-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex max-w-3xl flex-col gap-5">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">OnlyDoge</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Debug DogeConnect flows with confidence.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Validate QR payloads, inspect envelope signatures, and test relay behaviors in one place.
            Start with tools for quick checks or use Flight Recorder for full trace-level debugging.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/tools" className={buttonVariants({ className: "gap-1.5" })}>
              Start with Tools
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
            <Link
              to="/flight-recorder"
              className={buttonVariants({ variant: "outline", className: "gap-1.5" })}
            >
              Open Flight Recorder
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
            <a
              href="/api/openapi"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              Open API Docs
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start with Tools</CardTitle>
            <CardDescription>
              Fast checks for QR URIs, envelopes, and relay simulator responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Use this when you need to quickly verify one payload, reproduce an issue, or inspect a
              response contract without building a full trace session.
            </p>
            <Link to="/tools" className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
              Open Tools
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Use Flight Recorder</CardTitle>
            <CardDescription>
              End-to-end traces for investigation and repeatable debugging.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Build a timeline from QR parsing through relay pay/status execution, then export
              sanitized sessions to share clear bug reports.
            </p>
            <Link
              to="/flight-recorder"
              className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
            >
              Open Flight Recorder
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/50 p-6">
        <h2 className="text-lg font-semibold">What You Can Check Here</h2>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">QR URI Validation</p>
            <p className="mt-2">
              Parse `dogecoin:` URIs, enforce dc/h rules, and verify fetched envelope key hash
              alignment.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">Envelope Validation</p>
            <p className="mt-2">
              Decode payload, validate payment schema, and run BIP-340 Schnorr signature
              verification.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">Relay Simulation</p>
            <p className="mt-2">
              Register scenario-driven no-op relay states and test `pay/status` contracts with
              OpenAPI docs.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">Flight Recorder</p>
            <p className="mt-2">
              Build replayable end-to-end traces across QR parse, envelope fetch, relay targeting,
              and pay/status execution.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/50 p-6">
        <h2 className="text-lg font-semibold">Typical Workflow</h2>
        <ol className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <li className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">1. Validate the QR URI</p>
            <p className="mt-2">Confirm `dc` and `h` values and optionally fetch the envelope.</p>
          </li>
          <li className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">2. Verify envelope integrity</p>
            <p className="mt-2">Run schema and signature checks against raw envelope JSON.</p>
          </li>
          <li className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">3. Simulate relay behavior</p>
            <p className="mt-2">
              Register scenario outcomes to test pay/status handling in a safe local flow.
            </p>
          </li>
          <li className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">4. Trace full sessions</p>
            <p className="mt-2">
              Use Flight Recorder when you need detailed protocol timelines and exports.
            </p>
          </li>
        </ol>
      </section>
    </div>
  )
}
