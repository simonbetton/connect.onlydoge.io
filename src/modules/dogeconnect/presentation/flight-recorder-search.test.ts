import { describe, expect, test } from "vitest"
import {
  cleanFlightRecorderSearch,
  defaultFlightRecorderSearch,
  resolveFlightRecorderSearch,
  validateFlightRecorderSearch,
} from "./flight-recorder-search"

describe("flight recorder search state", () => {
  test("parses query-backed inputs and clamps numeric values", () => {
    const search = resolveFlightRecorderSearch(
      validateFlightRecorderSearch({
        sourceTab: "import",
        targetMode: "live",
        qr: "dogecoin:abc",
        mock: "mock-123",
        initial: "false",
        faults: "wrong_hash,simulator_error,wrong_hash,invalid_fault",
        import: '{"version":"flight-recorder/v1"}',
        trace: "trace-1",
        autoPoll: "true",
        poll: "0",
        draftId: "",
        draftTx: "deadbeef",
        draftToken: "",
        draftRefund: "DRefund",
        armed: "true",
      })
    )

    expect(search.sourceTab).toBe("import")
    expect(search.targetMode).toBe("live")
    expect(search.qrUri).toBe("dogecoin:abc")
    expect(search.mockPaymentId).toBe("mock-123")
    expect(search.includeInitialStatus).toBe(false)
    expect(search.selectedFaults).toEqual(["wrong_hash", "simulator_error"])
    expect(search.importJson).toBe('{"version":"flight-recorder/v1"}')
    expect(search.selectedTraceId).toBe("trace-1")
    expect(search.autoPoll).toBe(true)
    expect(search.pollIntervalSec).toBe(1)
    expect(search.payDraftId).toBe("")
    expect(search.payDraftTx).toBe("deadbeef")
    expect(search.payDraftRelayToken).toBe("")
    expect(search.payDraftRefund).toBe("DRefund")
    expect(search.liveWriteArmed).toBe(true)
  })

  test("serializes non-default inputs back to compact query params", () => {
    const cleaned = cleanFlightRecorderSearch({
      ...defaultFlightRecorderSearch,
      sourceTab: "mock",
      targetMode: "live",
      mockPaymentId: "mock-123",
      includeInitialStatus: false,
      selectedFaults: ["wrong_hash", "simulator_error"],
      payDraftId: "",
      payDraftTx: "deadbeef",
      payDraftRelayToken: "",
      payDraftRefund: "DRefund",
      liveWriteArmed: true,
    })

    expect(cleaned).toEqual({
      sourceTab: "mock",
      targetMode: "live",
      mock: "mock-123",
      initial: false,
      faults: "wrong_hash,simulator_error",
      draftId: "",
      draftTx: "deadbeef",
      draftToken: "",
      draftRefund: "DRefund",
      armed: true,
    })
  })
})
