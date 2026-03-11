import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToString } from "react-dom/server"
import { describe, expect, test } from "vitest"
import { ToolsPage } from "./tools-page"

describe("ToolsPage server render", () => {
  test("renders core tool sections", () => {
    const html = renderToString(
      <QueryClientProvider client={new QueryClient()}>
        <ToolsPage />
      </QueryClientProvider>
    )

    expect(html).toContain("Mock QR Fixture Generator")
    expect(html).toContain("Validate QR URI")
    expect(html).toContain("Validate Payment Envelope")
    expect(html).toContain("Relay Scenario Registration")
    expect(html).toContain("Relay Pay / Status Tester")
  })
})
