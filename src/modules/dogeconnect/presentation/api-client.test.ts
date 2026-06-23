import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import { getJson, postJson, postJsonWithMeta } from "./api-client"

const originalFetch = globalThis.fetch
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>()
  globalThis.fetch = fetchMock
})

afterAll(() => {
  globalThis.fetch = originalFetch
})

describe("presentation api client", () => {
  it("gets JSON responses", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, records: [] }))

    await expect(getJson<{ ok: boolean; records: unknown[] }>("/api/records")).resolves.toEqual({
      ok: true,
      records: [],
    })
    expect(fetchMock).toHaveBeenCalledWith("/api/records", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
  })

  it("posts JSON payloads", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ verdict: "valid" }))

    await expect(
      postJson<{ verdict: string }>("/api/validate", { uri: "dogecoin:abc" })
    ).resolves.toEqual({
      verdict: "valid",
    })
    expect(fetchMock).toHaveBeenCalledWith("/api/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ uri: "dogecoin:abc" }),
    })
  })

  it("throws joined field errors for non-OK POST responses", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          errors: [
            { field: "uri", message: "URI is required" },
            { field: "h", message: "Hash does not match" },
          ],
        },
        { status: 400 }
      )
    )

    await expect(postJson("/api/validate", {})).rejects.toThrow(
      "uri: URI is required; h: Hash does not match"
    )
  })

  it("throws response messages for non-OK POST responses", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Relay rejected payment" }, { status: 502 })
    )

    await expect(postJson("/api/relay/pay", {})).rejects.toThrow("Relay rejected payment")
  })

  it("returns POST metadata without throwing", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ code: "declined", reason: "insufficient confirmations" }, { status: 409 })
    )

    await expect(postJsonWithMeta("/api/relay/pay", { id: "pay-1" })).resolves.toEqual({
      ok: false,
      status: 409,
      body: {
        code: "declined",
        reason: "insufficient confirmations",
      },
    })
  })
})

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  })
