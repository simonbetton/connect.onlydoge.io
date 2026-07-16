import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type * as React from "react"
import { renderToString } from "react-dom/server"
import { describe, expect, test, vi } from "vitest"
import { ToolsPage } from "./tools-page"
import { defaultToolsSearch } from "./tools-search"

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => () => Promise.resolve(),
  useSearch: () => defaultToolsSearch,
  Link: ({
    to,
    hash,
    children,
    className,
  }: {
    to: string
    hash?: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={hash ? `${to}#${hash}` : to} className={className}>
      {children}
    </a>
  ),
}))

describe("ToolsPage server render", () => {
  test("renders core tool sections", () => {
    const html = renderToString(
      <QueryClientProvider client={new QueryClient()}>
        <ToolsPage />
      </QueryClientProvider>
    )

    expect(html).toContain("Generate the fixture")
    expect(html).toContain("Mock QR fixture")
    expect(html).toContain("QR URI validator")
    expect(html).toContain("Payment envelope validator")
    expect(html).toContain("Relay scenario registration")
    expect(html).toContain("Relay pay and status tester")
    expect(html).toContain("Tools Console")
    expect(html).toContain("Prove the payload")
    expect(html).toContain('id="mock-fixture"')
    expect(html).toContain('id="validators"')
    expect(html).toContain('id="relay-tools"')
  })
})
