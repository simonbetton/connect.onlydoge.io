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

  return (
    <html lang="en" className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <GlobalPasteDiagnose />
          <div className="relative isolate flex min-h-svh flex-col">
            <AppNav />
            <main className="flex-1">{children}</main>
            <AppFooter />
          </div>
        </QueryClientProvider>
        <Scripts />
        <Analytics />
      </body>
    </html>
  )
}
