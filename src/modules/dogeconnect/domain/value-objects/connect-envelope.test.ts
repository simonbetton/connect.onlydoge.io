import { describe, expect, test } from "vitest"
import { ConnectEnvelope } from "./connect-envelope"

describe("ConnectEnvelope", () => {
  test("rejects non-object envelopes", () => {
    const result = ConnectEnvelope.parse("not-an-object")
    expect(result.value).toBeNull()
    expect(result.issues[0]?.message).toBe("must be an object")
  })

  test("rejects invalid version", () => {
    const result = ConnectEnvelope.parse({
      version: "2.0",
      payload: "",
      pubkey: "",
      sig: "",
    })
    expect(result.issues.some((issue) => issue.field === "version")).toBe(true)
  })

  test("rejects invalid base64 payload", () => {
    const result = ConnectEnvelope.parse({
      version: "1.0",
      payload: "!!!",
      pubkey: "00",
      sig: "00",
    })
    expect(result.issues.some((issue) => issue.field === "payload")).toBe(true)
  })

  test("rejects pubkey with wrong byte length", () => {
    const result = ConnectEnvelope.parse({
      version: "1.0",
      payload: "dGVzdA==",
      pubkey: "00",
      sig: "00",
    })
    expect(result.issues.some((issue) => issue.field === "pubkey")).toBe(true)
  })

  test("rejects signature with wrong byte length", () => {
    const pubkey = "11".repeat(32)
    const result = ConnectEnvelope.parse({
      version: "1.0",
      payload: "dGVzdA==",
      pubkey,
      sig: "00",
    })
    expect(result.issues.some((issue) => issue.field === "sig")).toBe(true)
  })
})
