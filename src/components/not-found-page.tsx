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
    <section className="mx-auto flex w-full max-w-6xl px-4 py-10 sm:px-6">
      <PageHero title="This route is missing." variant="brand" className="w-full">
        <Badge variant="warning" className="w-fit">
          HTTP 404
        </Badge>
        <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed sm:text-base">
          OnlyDoge DogeConnect Debugger could not resolve the requested page. Use one of the
          shortcuts below to get back to active debugging workflows.
        </p>
        <div className="max-w-full overflow-x-auto rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
          <p className="font-medium text-muted-foreground text-xs uppercase">Requested Path</p>
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
