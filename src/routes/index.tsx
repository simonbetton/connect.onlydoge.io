import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { PageHero } from "@/components/page-hero"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const openApiDocsHref = "/api/openapi"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <PageHero
        eyebrow={
          <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">OnlyDoge</p>
        }
        title="Debug DogeConnect flows with confidence."
        description="Validate QR payloads, inspect envelope signatures, and test relay behaviors in one place. Start with tools for quick checks or use Flight Recorder for full trace-level debugging."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/tools" className={buttonVariants({ className: "gap-1.5" })}>
            Start with Tools
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
          <Link
            to="/flight-recorder"
            className={buttonVariants({
              variant: "outline",
              className: "gap-1.5",
            })}
          >
            Open Flight Recorder
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
          <a
            href={openApiDocsHref}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Open API Docs
          </a>
        </div>
      </PageHero>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start with Tools</CardTitle>
            <CardDescription>
              Fast checks for QR URIs, envelopes, and relay simulator responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground text-sm leading-relaxed">
            <p>
              Use this when you need to quickly verify one payload, reproduce an issue, or inspect a
              response contract without building a full trace session.
            </p>
            <Link
              to="/tools"
              className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
            >
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
          <CardContent className="space-y-3 text-muted-foreground text-sm leading-relaxed">
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
        <h2 className="font-semibold text-lg">What You Can Check Here</h2>
        <div className="mt-4 grid gap-3 text-muted-foreground text-sm md:grid-cols-2 xl:grid-cols-4">
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
        <h2 className="font-semibold text-lg">Typical Workflow</h2>
        <ol className="mt-4 grid gap-3 text-muted-foreground text-sm md:grid-cols-2">
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
