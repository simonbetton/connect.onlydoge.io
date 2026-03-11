import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-amber-100 via-background to-orange-100 p-8 shadow-sm">
        <div className="absolute -top-24 -right-14 size-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-20 size-56 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative flex max-w-3xl flex-col gap-5">
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            DogeConnect Engineering Toolkit
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Validate protocol payloads, simulate relay responses, and ship safer Dogecoin payment
            flows.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            This workspace is built for DogeConnect development and QA. It combines strict
            cryptographic validation with a no-op relay API so wallets, merchants, and relay teams
            can debug quickly.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/tools" className={buttonVariants({ className: "gap-1.5" })}>
              Open Tools
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
            <CardTitle>Why DogeConnect</CardTitle>
            <CardDescription>
              Protocol-based handoff between wallets, relays, and merchants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              DogeConnect signs payment requests with a relay key, which lets wallets verify
              authenticity before users sign a transaction.
            </p>
            <p>
              It standardizes metadata like totals, line items, and output targets so wallets can
              show transparent checkout details.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Adoption Utility Impact</CardTitle>
            <CardDescription>
              Better checkout trust and interoperability improve spending confidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              As more wallets and merchants adopt the same protocol, payment UX consistency improves
              and integration costs fall.
            </p>
            <p>
              That increases real transaction usage and strengthens Dogecoin as a practical payment
              network.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/50 p-6">
        <h2 className="text-lg font-semibold">What You Can Debug Here</h2>
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
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
        </div>
      </section>
    </div>
  )
}
