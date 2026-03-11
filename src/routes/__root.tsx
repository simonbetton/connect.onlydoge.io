import { TanStackDevtools } from "@tanstack/react-devtools"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRootRoute, HeadContent, Link, Scripts, useRouterState } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { Analytics } from "@vercel/analytics/react"
import * as React from "react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "OnlyDoge DogeConnect Debugger by EasyDoge",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <div className="relative flex min-h-svh flex-col">
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
              <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                <div className="flex items-center justify-between gap-3 py-3">
                  <Link
                    to="/"
                    className="flex min-w-0 items-center gap-2 rounded-xl pr-2 transition hover:opacity-90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <img src="/favicon.svg" alt="OnlyDoge" className="size-9 shrink-0 sm:size-10" />
                    <div className="flex flex-col">
                      <span className="doge-logo truncate text-sm text-primary sm:text-base">
                        OnlyDoge DogeConnect Debugger
                      </span>
                      <span className="text-neutral-500 -mt-1 text-xs ml-0.5 font-normal">
                        by EasyDoge
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    className="inline-flex rounded-2xl border border-border bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground md:hidden"
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-nav"
                    onClick={() => setIsMenuOpen((open) => !open)}
                  >
                    {isMenuOpen ? "Close" : "Menu"}
                  </button>

                  <div className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
                    <Link
                      to="/"
                      className="transition hover:text-foreground"
                      activeProps={{ className: "text-foreground" }}
                    >
                      Overview
                    </Link>
                    <Link
                      to="/tools"
                      className="transition hover:text-foreground"
                      activeProps={{ className: "text-foreground" }}
                    >
                      Tools
                    </Link>
                    <a
                      href="/api/openapi"
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-foreground"
                    >
                      API Docs
                    </a>
                  </div>
                </div>

                {isMenuOpen ? (
                  <div id="mobile-nav" className="border-t border-border/70 py-3 md:hidden">
                    <div className="grid gap-2 text-sm">
                      <Link
                        to="/"
                        className="rounded-xl border border-transparent px-3 py-2 text-muted-foreground transition hover:border-border/60 hover:bg-background/70 hover:text-foreground"
                        activeProps={{
                          className:
                            "rounded-xl border border-border bg-background text-foreground px-3 py-2",
                        }}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Overview
                      </Link>
                      <Link
                        to="/tools"
                        className="rounded-xl border border-transparent px-3 py-2 text-muted-foreground transition hover:border-border/60 hover:bg-background/70 hover:text-foreground"
                        activeProps={{
                          className:
                            "rounded-xl border border-border bg-background text-foreground px-3 py-2",
                        }}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Tools
                      </Link>
                      <a
                        href="/api/openapi"
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-transparent px-3 py-2 text-muted-foreground transition hover:border-border/60 hover:bg-background/70 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        API Docs
                      </a>
                    </div>
                  </div>
                ) : null}
              </nav>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-border/70 bg-background/90">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p>Unaffiliated with Dogecoin or any other organization.</p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://connect.dogecoin.org/getting_started/introduction.html"
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-foreground"
                  >
                    Protocol Docs
                  </a>
                  <a
                    href="/api/openapi"
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-foreground"
                  >
                    OpenAPI
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </QueryClientProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
        <Analytics />
      </body>
    </html>
  )
}

function NotFoundPage() {
  const unresolvedPath = useRouterState({
    select: (state) =>
      `${state.location.pathname}${state.location.searchStr}${state.location.hash ? `#${state.location.hash}` : ""}`,
  })

  return (
    <section className="mx-auto flex w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="relative w-full overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-amber-100/75 via-background to-orange-100/75 p-7 shadow-sm sm:p-10">
        <div className="absolute -top-16 -right-12 size-40 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-18 size-44 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="relative space-y-5">
          <div className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
            HTTP 404
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              This route is missing.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              OnlyDoge DogeConnect Debugger could not resolve the requested page. Use one of the
              shortcuts below to get back to active debugging workflows.
            </p>
          </div>
          <div className="max-w-full overflow-x-auto rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground uppercase">Requested Path</p>
            <p className="mt-1 font-mono text-sm text-foreground">{unresolvedPath || "/"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className={cn(buttonVariants())}>
              Back to Overview
            </Link>
            <Link to="/tools" className={cn(buttonVariants({ variant: "outline" }))}>
              Open Tools
            </Link>
            <a
              href="/api/openapi"
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
