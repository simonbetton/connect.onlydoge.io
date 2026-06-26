import { TanStackDevtools } from "@tanstack/react-devtools"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRootRoute, HeadContent, Link, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { Analytics } from "@vercel/analytics/react"
import * as React from "react"
import { GitHubMarkIcon } from "@/components/github-mark-icon"
import { NotFoundPage } from "@/components/not-found-page"
import { buttonVariants } from "@/components/ui/button-variants"
import appCss from "../styles.css?url"

const repositoryUrl = "https://github.com/simonbetton/onlydoge-dogecoin-connect-unpacker"
const openApiDocsHref = "/api/openapi"

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
        title: "DogeConnect Debugger for Dogecoin | OnlyDoge by EasyDoge",
      },
      {
        name: "description",
        content:
          "Dogecoin DogeConnect Debugger is an open-source developer toolkit for building and testing DogeConnect integrations. Validate DogeConnect QR URIs, verify payment envelopes (including cryptographic checks), and simulate relay pay/status flows with scenario-driven responses.",
      },
      {
        name: "og:image",
        content: "/social.jpg",
      },
      {
        name: "theme-color",
        content: "#FFDF20",
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
            <header className="sticky top-0 z-20 border-border/70 border-b bg-background/95 shadow-xs backdrop-blur">
              <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                <div className="flex items-center justify-between gap-3 py-3">
                  <Link
                    to="/"
                    className="flex min-w-0 items-center gap-2 rounded-xl pr-2 transition hover:opacity-90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <img src="/favicon.svg" alt="OnlyDoge" className="size-9 shrink-0 sm:size-10" />
                    <div className="flex flex-col">
                      <span className="doge-logo truncate font-bold text-foreground text-sm sm:text-base">
                        DogeConnect Debugger
                      </span>
                      <span className="-mt-1 ml-0.5 font-normal text-muted-foreground text-xs">
                        by EasyDoge
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    className="inline-flex rounded-2xl border border-border bg-background/80 px-3 py-1.5 font-medium text-foreground text-sm md:hidden"
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-nav"
                    onClick={() => setIsMenuOpen((open) => !open)}
                  >
                    {isMenuOpen ? "Close" : "Menu"}
                  </button>

                  <div className="hidden items-center gap-4 text-muted-foreground text-sm md:flex">
                    <Link
                      to="/"
                      className="rounded-xl px-2 py-1 transition hover:bg-muted/70 hover:text-foreground"
                      activeProps={{ className: "bg-muted text-foreground" }}
                    >
                      Overview
                    </Link>
                    <Link
                      to="/tools"
                      className="rounded-xl px-2 py-1 transition hover:bg-muted/70 hover:text-foreground"
                      activeProps={{ className: "bg-muted text-foreground" }}
                    >
                      Tools
                    </Link>
                    <Link
                      to="/flight-recorder"
                      className="rounded-xl px-2 py-1 transition hover:bg-muted/70 hover:text-foreground"
                      activeProps={{ className: "bg-muted text-foreground" }}
                    >
                      Flight Recorder
                    </Link>
                    <a
                      href={openApiDocsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-foreground"
                    >
                      API Docs
                    </a>
                    <a
                      href={repositoryUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Open project repository on GitHub"
                      className="inline-flex items-center gap-1.5 transition hover:text-foreground"
                    >
                      <GitHubMarkIcon className="size-4" />
                      <span>GitHub</span>
                    </a>
                    <Link to="/tools" className={buttonVariants({ size: "sm" })}>
                      Get Started
                    </Link>
                  </div>
                </div>

                {isMenuOpen ? (
                  <div id="mobile-nav" className="border-border/70 border-t py-3 md:hidden">
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
                      <Link
                        to="/flight-recorder"
                        className="rounded-xl border border-transparent px-3 py-2 text-muted-foreground transition hover:border-border/60 hover:bg-background/70 hover:text-foreground"
                        activeProps={{
                          className:
                            "rounded-xl border border-border bg-background text-foreground px-3 py-2",
                        }}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Flight Recorder
                      </Link>
                      <a
                        href={openApiDocsHref}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-transparent px-3 py-2 text-muted-foreground transition hover:border-border/60 hover:bg-background/70 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        API Docs
                      </a>
                      <a
                        href={repositoryUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-muted-foreground transition hover:border-border/60 hover:bg-background/70 hover:text-foreground"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <GitHubMarkIcon className="size-4" />
                        <span>GitHub</span>
                      </a>
                    </div>
                  </div>
                ) : null}
              </nav>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-border/70 border-t bg-background/90">
              <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p>Unaffiliated with Dogecoin or any other organization.</p>
                <p className="flex flex-wrap items-center gap-3">
                  <a
                    href="https://connect.dogecoin.org/getting_started/introduction.html"
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-foreground"
                  >
                    Protocol Docs
                  </a>
                  <span>|</span>
                  <a
                    href={openApiDocsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-foreground"
                  >
                    OpenAPI
                  </a>
                  <span>|</span>
                  <a
                    href="https://github.com/simonbetton"
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-foreground"
                  >
                    Maintainer
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </QueryClientProvider>
        {import.meta.env.DEV ? (
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
        ) : null}
        <Scripts />
        <Analytics />
      </body>
    </html>
  )
}
