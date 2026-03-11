import { describe, expect, test } from "vitest"
import { NobleCryptoAdapter } from "../../adapters/crypto/noble-crypto-adapter"
import type { FlightRecorderSessionV1 } from "../flight-recorder-contracts"
import { createTraceEntry } from "../flight-recorder-session"
import { BuildFlightRecorderSessionUseCase } from "./build-flight-recorder-session-use-case"
import { ExecuteFlightRecorderRelayPayUseCase } from "./execute-flight-recorder-relay-pay-use-case"
import { GenerateMockQrUseCase } from "./generate-mock-qr-use-case"
import { ValidatePaymentEnvelopeUseCase } from "./validate-payment-envelope-use-case"

describe("BuildFlightRecorderSessionUseCase", () => {
  test("builds a mock simulator session with the expected trace phases", async () => {
    const useCase = createBuildUseCase()

    const session = await useCase.execute({
      source: {
        mode: "mock",
      },
      targetMode: "simulator",
      options: {
        includeInitialStatus: false,
      },
      faults: ["simulator_confirmed"],
      origin: "https://onlydoge.dev",
    })

    expect(session.version).toBe("flight-recorder/v1")
    expect(session.trace.map((entry) => entry.phase)).toEqual([
      "qr_parse",
      "envelope_fetch",
      "envelope_validate",
      "payment_decode",
      "relay_target",
    ])
    expect(session.artifacts.relay?.mode).toBe("simulator")
    expect(session.artifacts.payDraft?.id).toBeTruthy()
  })

  test("stops after qr parsing for a plain dogecoin uri without DogeConnect params", async () => {
    const useCase = createBuildUseCase()

    const session = await useCase.execute({
      source: {
        mode: "qr",
        uri: "dogecoin:DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY?amount=2",
      },
      targetMode: "live",
      options: {
        includeInitialStatus: false,
      },
      origin: "https://onlydoge.dev",
    })

    expect(session.trace).toHaveLength(1)
    expect(session.artifacts.relay).toBeNull()
  })
})

describe("ExecuteFlightRecorderRelayPayUseCase", () => {
  test("refuses live pay execution while disarmed", async () => {
    const useCase = new ExecuteFlightRecorderRelayPayUseCase(
      createRelayClientStub(),
      createRelayClientStub()
    )

    const session = createLiveSessionFixture()
    const result = await useCase.execute({
      session,
      liveWriteArmed: false,
    })

    expect(result.trace.at(-1)?.phase).toBe("relay_pay")
    expect(result.trace.at(-1)?.verdict).toBe("fail")
    expect(result.trace.at(-1)?.responseSummary.note).toContain("blocked")
  })
})

const createBuildUseCase = () => {
  const crypto = new NobleCryptoAdapter()
  return new BuildFlightRecorderSessionUseCase(
    new GenerateMockQrUseCase(crypto),
    new ValidatePaymentEnvelopeUseCase(crypto),
    {
      async fetchEnvelope() {
        return {
          envelope: null,
          trace: createTraceEntry({
            kind: "network",
            phase: "envelope_fetch",
            target: "remote",
            verdict: "fail",
          }),
        }
      },
    },
    createRelayClientStub(),
    createRelayClientStub()
  )
}

const createRelayClientStub = () => ({
  async getStatus() {
    return {
      body: {
        id: "pay-1",
        status: "accepted" as const,
      },
      trace: createTraceEntry({
        kind: "execution",
        phase: "relay_status",
        target: "local",
        verdict: "pass",
      }),
    }
  },
  async pay() {
    return {
      body: {
        id: "pay-1",
        status: "accepted" as const,
      },
      trace: createTraceEntry({
        kind: "execution",
        phase: "relay_pay",
        target: "local",
        verdict: "pass",
      }),
    }
  },
})

const createLiveSessionFixture = (): FlightRecorderSessionV1 => ({
  version: "flight-recorder/v1",
  meta: {
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
    sourceMode: "mock",
    targetMode: "live",
    exportMode: "sanitized",
  },
  source: {
    mode: "mock",
    uri: "dogecoin:DPD7?amount=1&dc=onlydoge.dev/api/tools/mock-envelope/pay-1&h=abc",
    paymentId: "pay-1",
    origin: "https://onlydoge.dev",
    imported: false,
  },
  artifacts: {
    qr: {
      rawUri: "",
      effectiveUri: "",
      parsed: null,
    },
    envelope: {
      fetchedFrom: "",
      raw: null,
      validation: null,
    },
    payment: {
      raw: null,
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
      liveWriteArmed: false,
      simulatorScenario: null,
    },
    payDraft: {
      id: "pay-1",
      tx: "deadbeef",
      refund: "",
      relay_token: "token",
    },
  },
  faults: [],
  trace: [],
  summary: {
    verdict: "pass",
    firstFailingStep: "",
    likelyCauses: [],
  },
})
