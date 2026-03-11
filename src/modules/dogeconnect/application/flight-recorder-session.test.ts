import { describe, expect, test } from "vitest"
import type { FlightRecorderSessionV1 } from "./flight-recorder-contracts"
import {
  exportFlightRecorderSession,
  parseImportedFlightRecorderSession,
} from "./flight-recorder-session"

describe("Flight Recorder session helpers", () => {
  test("sanitized export redacts relay_token, tx, and refund fields", () => {
    const session = createSessionFixture()

    const exported = exportFlightRecorderSession(session, "sanitized")

    expect(exported.meta.exportMode).toBe("sanitized")
    expect(exported.artifacts.payDraft?.tx).toBe("[redacted]")
    expect(exported.artifacts.payDraft?.refund).toBe("[redacted]")
    expect(exported.artifacts.payDraft?.relay_token).toBe("[redacted]")
    expect((exported.artifacts.payment.raw as { relay_token?: string } | null)?.relay_token).toBe(
      "[redacted]"
    )
  })

  test("parses an exported session back into the canonical v1 shape", () => {
    const session = createSessionFixture()
    const exported = exportFlightRecorderSession(session, "full")

    const parsed = parseImportedFlightRecorderSession(exported)

    expect(parsed.issues).toHaveLength(0)
    expect(parsed.value?.version).toBe("flight-recorder/v1")
    expect(parsed.value?.trace).toHaveLength(1)
  })
})

const createSessionFixture = (): FlightRecorderSessionV1 => ({
  version: "flight-recorder/v1",
  meta: {
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
    sourceMode: "qr",
    targetMode: "live",
    exportMode: "full",
  },
  source: {
    mode: "qr",
    uri: "dogecoin:DPD7?amount=1&dc=relay.example/dc/1&h=abc",
    paymentId: "pay-1",
    origin: "https://onlydoge.dev",
    imported: false,
  },
  artifacts: {
    qr: {
      rawUri: "dogecoin:DPD7?amount=1&dc=relay.example/dc/1&h=abc",
      effectiveUri: "dogecoin:DPD7?amount=1&dc=relay.example/dc/1&h=abc",
      parsed: {
        address: "DPD7",
        amount: "1",
        connectUrl: "relay.example/dc/1",
        pubKeyHashBase64Url: "abc",
        isConnectUri: true,
      },
    },
    envelope: {
      fetchedFrom: "relay.example/dc/1",
      raw: { version: "1.0", payload: "payload", pubkey: "11", sig: "22" },
      validation: null,
    },
    payment: {
      raw: {
        id: "pay-1",
        relay: "https://relay.example/checkout",
        relay_token: "secret-token",
      },
      relay: "https://relay.example/checkout",
      relayTokenPresent: true,
      timeout: 600,
      issued: "2026-03-13T00:00:00.000Z",
    },
    relay: {
      mode: "live",
      sourceRelayUrl: "https://relay.example/checkout",
      payUrl: "https://relay.example/checkout/pay",
      statusUrl: "https://relay.example/checkout/status",
      liveWriteArmed: true,
      simulatorScenario: null,
    },
    payDraft: {
      id: "pay-1",
      tx: "deadbeef",
      refund: "DRefundAddress",
      relay_token: "secret-token",
    },
  },
  faults: [],
  trace: [
    {
      id: "trace-1",
      kind: "input",
      phase: "qr_parse",
      target: "session",
      startedAt: "2026-03-13T00:00:00.000Z",
      endedAt: "2026-03-13T00:00:00.010Z",
      durationMs: 10,
      verdict: "pass",
      issues: [],
      requestSummary: {
        method: "LOCAL",
        endpoint: "session://qr",
        note: "Parsed QR",
        body: null,
      },
      responseSummary: {
        statusCode: 200,
        note: "Parsed QR",
        body: null,
      },
      artifactsChanged: ["qr.parsed"],
    },
  ],
  summary: {
    verdict: "pass",
    firstFailingStep: "",
    likelyCauses: ["No protocol or relay mismatches were detected in this session."],
  },
})
