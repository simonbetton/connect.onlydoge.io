import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToString } from "react-dom/server"
import { describe, expect, test, vi } from "vitest"
import { FlightRecorderPage } from "./flight-recorder-page"
import { defaultFlightRecorderSearch } from "./flight-recorder-search"

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router")

  return {
    ...actual,
    useNavigate: () => () => Promise.resolve(),
    useSearch: () => defaultFlightRecorderSearch,
  }
})

describe("FlightRecorderPage server render", () => {
  test("renders the core flight recorder sections", () => {
    const html = renderToString(
      <QueryClientProvider client={new QueryClient()}>
        <FlightRecorderPage />
      </QueryClientProvider>
    )

    expect(html).toContain("Session Builder")
    expect(html).toContain("Timeline")
    expect(html).toContain("Inspector")
    expect(html).toContain("Execution Controls")
    expect(html).toContain("Flight Recorder")
  })
})
