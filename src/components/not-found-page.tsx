import { Link, useRouterState } from "@tanstack/react-router"
import { PageHero } from "@/components/page-hero"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

const openApiDocsHref = "/api/openapi"

export function NotFoundPage() {
  const unresolvedPath = useRouterState({
    select: (state) =>
      `${state.location.pathname}${state.location.searchStr}${state.location.hash ? `#${state.location.hash}` : ""}`,
  })

  return (
    <section className="mx-auto flex w-full max-w-332 px-4 py-12 sm:px-6 sm:py-16 lg:px-5">
      <PageHero
        title="This route fell out of the trace."
        variant="brand"
        className="w-full shadow-[0_1px_0_oklch(1_0_0/0.55)_inset,0_24px_80px_oklch(0.3_0.03_55/0.12)]"
        titleClassName="max-w-[14ch] text-4xl sm:text-6xl"
      >
        <Badge variant="warning" className="w-fit">
          HTTP 404
        </Badge>
        <p className="max-w-[56ch] text-pretty text-base/7 text-muted-foreground sm:text-lg/8">
          OnlyDoge DogeConnect Debugger could not resolve the requested page. Use one of these
          shortcuts to return to an active debugging workflow.
        </p>
        <div className="max-w-full overflow-x-auto rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset]">
          <p className="font-medium text-muted-foreground text-sm sm:text-xs">Requested path</p>
          <p className="mt-1 font-mono text-foreground text-sm">{unresolvedPath || "/"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/" className={cn(buttonVariants())}>
            Back to Overview
          </Link>
          <Link to="/tools" className={cn(buttonVariants({ variant: "outline" }))}>
            Open Tools
          </Link>
          <a
            href={openApiDocsHref}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Open API Docs
          </a>
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">Need URI checks?</p>
            <p className="mt-1 text-muted-foreground">
              Use the tools page to validate DogeConnect QR URIs and inspect detailed checks.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">Need envelope checks?</p>
            <p className="mt-1 text-muted-foreground">
              Paste raw envelope JSON and run strict payload and signature validation.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="font-medium text-foreground">Testing relay flows?</p>
            <p className="mt-1 text-muted-foreground">
              Register a debug scenario, call `relay/pay`, then inspect status transitions.
            </p>
          </div>
        </div>
      </PageHero>
    </section>
  )
}
