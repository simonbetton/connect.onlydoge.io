import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router"
import { Analytics } from "@vercel/analytics/react"
import * as React from "react"
import { AppFooter } from "@/components/app-footer"
import { AppNav } from "@/components/app-nav"
import { GlobalPasteDiagnose } from "@/components/global-paste-diagnose"
import { NotFoundPage } from "@/components/not-found-page"
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
        title: "DogeConnect Debugger for Dogecoin | OnlyDoge by EasyDoge",
      },
      {
        name: "description",
        content:
          "Dogecoin DogeConnect Debugger is an open-source developer toolkit for building and testing DogeConnect integrations. Validate DogeConnect QR URIs, verify payment envelopes (including cryptographic checks), and simulate relay pay/status flows with scenario-driven responses.",
      },
      {
        property: "og:title",
        content: "DogeConnect Debugger for Dogecoin | OnlyDoge by EasyDoge",
      },
      {
        property: "og:description",
        content:
          "Open-source developer toolkit for building and testing DogeConnect integrations: validate QR URIs, verify payment envelopes, and simulate relay flows.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:image",
        content: "/social.jpg",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:image",
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
        href: "/favicon.ico",
        sizes: "32x32",
      },
      {
        rel: "apple-touch-icon",
        href: "/logo192.png",
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

  return (
    <html lang="en" className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <GlobalPasteDiagnose />
          <div className="relative isolate flex min-h-svh flex-col">
            <a
              href="#main-content"
              className="sr-only z-50 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Skip to content
            </a>
            <AppNav />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <AppFooter />
          </div>
        </QueryClientProvider>
        <Scripts />
        <Analytics />
      </body>
    </html>
  )
}
