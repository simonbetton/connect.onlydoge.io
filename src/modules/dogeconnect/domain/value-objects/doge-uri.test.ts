import { describe, expect, test } from "vitest"
import { DogeUri } from "./doge-uri"

describe("DogeUri", () => {
  test("parses a valid DogeConnect URI", () => {
    const uri =
      "dogecoin:DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY?amount=12.25&dc=example.com%2Fdc%2Fid&h=72b-LVh5K_mm7zyN9PXO"
    const result = DogeUri.parse(uri)

    expect(result.value?.isConnectUri).toBe(true)
    expect(result.value?.address).toBe("DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY")
    expect(result.issues.filter((issue) => issue.severity === "error")).toHaveLength(0)
  })

  test("keeps plain dogecoin URI as non-connect informational case", () => {
    const uri = "dogecoin:DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY?amount=8.25"
    const result = DogeUri.parse(uri)
    expect(result.value?.isConnectUri).toBe(false)
    expect(result.issues.filter((issue) => issue.severity === "error")).toHaveLength(0)
  })

  test("fails when dc exists without h", () => {
    const uri = "dogecoin:DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY?amount=1&dc=example.com/dc/1234"
    const result = DogeUri.parse(uri)
    expect(result.issues.some((issue) => issue.message.includes("must both be present"))).toBe(true)
  })
})
