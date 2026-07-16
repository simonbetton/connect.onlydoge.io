import { afterEach, describe, expect, test, vi } from "vitest"
import { HttpEnvelopeFetcher } from "./http-envelope-fetcher"

const originalFetch = globalThis.fetch

describe("http envelope fetcher", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("normalizes scheme-less urls to https and returns the JSON body", async () => {
    const body = { envelope: { payment: "doge" } }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)))
    globalThis.fetch = fetchMock as typeof fetch

    await expect(new HttpEnvelopeFetcher().fetchEnvelope("8.8.8.8/envelope")).resolves.toEqual(body)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.toString()).toBe("https://8.8.8.8/envelope")
    expect(init.method).toBe("GET")
    expect(init.redirect).toBe("manual")
    expect(init.credentials).toBe("omit")
  })

  test("rejects explicit http targets", async () => {
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as typeof fetch

    await expect(
      new HttpEnvelopeFetcher().fetchEnvelope("http://8.8.8.8/envelope")
    ).rejects.toThrow("https")

    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("rejects non-JSON responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("not json"))
    globalThis.fetch = fetchMock as typeof fetch

    await expect(new HttpEnvelopeFetcher().fetchEnvelope("8.8.8.8/envelope")).rejects.toThrow(
      "Response was not valid JSON"
    )
  })

  test("rejects responses over the byte cap", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("{}", {
        headers: {
          "content-length": "262145",
        },
      })
    )
    globalThis.fetch = fetchMock as typeof fetch

    await expect(new HttpEnvelopeFetcher().fetchEnvelope("8.8.8.8/envelope")).rejects.toThrow(
      "Response exceeded"
    )
  })
})
