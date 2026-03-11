import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToString } from "react-dom/server"
import { describe, expect, test, vi } from "vitest"
import { ToolsPage } from "./tools-page"
import { defaultToolsSearch } from "./tools-search"

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router")

  return {
    ...actual,
    useNavigate: () => () => Promise.resolve(),
    useSearch: () => defaultToolsSearch,
  }
})

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
