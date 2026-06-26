import { Link, useRouterState } from "@tanstack/react-router"
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
      <div className="relative w-full overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-amber-100/75 via-background to-orange-100/75 p-7 shadow-sm sm:p-10">
        <div className="absolute -top-16 -right-12 size-40 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-18 size-44 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 font-medium text-amber-900 text-xs">
            HTTP 404
          </div>
          <div className="space-y-2">
            <h1 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
              This route is missing.
            </h1>
            <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed sm:text-base">
              OnlyDoge DogeConnect Debugger could not resolve the requested page. Use one of the
              shortcuts below to get back to active debugging workflows.
            </p>
          </div>
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
        </div>
      </div>
    </section>
  )
}
