import { describe, expect, test } from "vitest"
import {
  cleanToolsSearch,
  defaultToolsSearch,
  resolveToolsSearch,
  validateToolsSearch,
} from "./tools-search"

describe("tools search parsing", () => {
  test("drops undefined values before merging with defaults", () => {
    const search = validateToolsSearch({
      uri: undefined,
      fetchEnvelope: undefined,
      registerScenario: undefined,
    })

    expect(search).toEqual({})
    expect(resolveToolsSearch(search)).toEqual(defaultToolsSearch)
  })

  test("ignores bulky debug values from old query params", () => {
    const search = resolveToolsSearch(
      validateToolsSearch({
        envelope: '{"version":"1.0"}',
        payTx: "deadbeef",
        payRefund: "DRefund",
        payRelayToken: "relay-token",
      })
    )

    expect(search.envelopeJson).toBe("")
    expect(search.relayPayTx).toBe("")
    expect(search.relayPayRefund).toBe("")
    expect(search.relayPayRelayToken).toBe("")
  })

  test("does not serialize bulky debug values", () => {
    const cleaned = cleanToolsSearch({
      ...defaultToolsSearch,
      mockPaymentId: "mock-123",
      qrUri: "dogecoin:abc",
      envelopeJson: '{"version":"1.0"}',
      envelopeExpectedHash: "expected-hash",
      relayPayId: "pay-123",
      relayPayTx: "deadbeef",
      relayPayRefund: "DRefund",
      relayPayRelayToken: "relay-token",
    })

    expect(cleaned).toEqual({
      mock: "mock-123",
      uri: "dogecoin:abc",
      expectedHash: "expected-hash",
      payId: "pay-123",
    })
  })
})
