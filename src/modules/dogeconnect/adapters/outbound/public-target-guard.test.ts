import { describe, expect, test } from "vitest"
import {
  assertPublicTargetUrl,
  isUnsafeIpAddress,
  normalizeExternalUrl,
  resolveRedirectTarget,
} from "./public-target-guard"

describe("public target guard", () => {
  test("normalizes scheme-less urls to https", () => {
    expect(normalizeExternalUrl("relay.onlydoge.dev/pay").toString()).toBe(
      "https://relay.onlydoge.dev/pay"
    )
  })

  test("rejects localhost and private or metadata addresses", async () => {
    await expect(assertPublicTargetUrl("https://localhost/test")).rejects.toThrow("public hostname")
    await expect(assertPublicTargetUrl("https://192.168.1.10/test")).rejects.toThrow(
      "private or reserved IP"
    )
    await expect(assertPublicTargetUrl("https://169.254.169.254/test")).rejects.toThrow(
      "private or reserved IP"
    )
  })

  test("rejects downgraded redirects", async () => {
    await expect(
      resolveRedirectTarget(new URL("https://relay.onlydoge.dev/pay"), "http://relay.onlydoge.dev")
    ).rejects.toThrow("https")
  })

  test("flags unsafe ip ranges", () => {
    expect(isUnsafeIpAddress("10.0.0.1")).toBe(true)
    expect(isUnsafeIpAddress("172.20.0.10")).toBe(true)
    expect(isUnsafeIpAddress("192.168.1.1")).toBe(true)
    expect(isUnsafeIpAddress("169.254.169.254")).toBe(true)
  })
})
