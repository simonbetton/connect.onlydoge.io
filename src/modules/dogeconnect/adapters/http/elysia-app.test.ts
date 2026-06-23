import { describe, expect, test } from "vitest"
import type { FlightRecorderSessionV1 } from "../../application/flight-recorder-contracts"
import { createTraceEntry } from "../../application/flight-recorder-session"
import { BuildFlightRecorderSessionUseCase } from "../../application/use-cases/build-flight-recorder-session-use-case"
import { ExecuteFlightRecorderRelayPayUseCase } from "../../application/use-cases/execute-flight-recorder-relay-pay-use-case"
import { ExecuteFlightRecorderRelayStatusUseCase } from "../../application/use-cases/execute-flight-recorder-relay-status-use-case"
import { GenerateMockQrUseCase } from "../../application/use-cases/generate-mock-qr-use-case"
import { GetMockEnvelopeUseCase } from "../../application/use-cases/get-mock-envelope-use-case"
import { ListRelayScenariosUseCase } from "../../application/use-cases/list-relay-scenarios-use-case"
import { createMockDogeConnectFixture } from "../../application/use-cases/mock-dogeconnect-fixture"
import { RegisterRelayScenarioUseCase } from "../../application/use-cases/register-relay-scenario-use-case"
import { RelayPayUseCase } from "../../application/use-cases/relay-pay-use-case"
import { RelayStatusUseCase } from "../../application/use-cases/relay-status-use-case"
import { ResetRelayStateUseCase } from "../../application/use-cases/reset-relay-state-use-case"
import { ValidateDogeConnectUriUseCase } from "../../application/use-cases/validate-dogeconnect-uri-use-case"
import { ValidatePaymentEnvelopeUseCase } from "../../application/use-cases/validate-payment-envelope-use-case"
import type { EnvelopeFetcherPort } from "../../ports/envelope-fetcher-port"
import { NobleCryptoAdapter } from "../crypto/noble-crypto-adapter"
import { InMemoryRelayStateStore } from "../relay/in-memory-relay-state-store"
import { LocalFlightRecorderRelayClient } from "../relay/local-flight-recorder-relay-client"
import { createDogeConnectApiApp } from "./elysia-app"

describe("DogeConnect Elysia API", () => {
  test.each([
    {
      scenario: "accepted",
      paymentId: "pay-accepted",
      expectedPayStatus: 200,
      expectedRelayStatus: "accepted",
    },
    {
      scenario: "confirmed",
      paymentId: "pay-confirmed",
      expectedPayStatus: 200,
      expectedRelayStatus: "confirmed",
    },
    {
      scenario: "declined",
      paymentId: "pay-declined",
      expectedPayStatus: 200,
      expectedRelayStatus: "declined",
    },
    {
      scenario: "error",
      paymentId: "pay-error",
      expectedPayStatus: 400,
      expectedError: "invalid_tx",
    },
  ] as const)("handles $scenario relay scenario on pay/status flow", async ({
    scenario,
    paymentId,
    expectedPayStatus,
    expectedRelayStatus,
    expectedError,
  }) => {
    const app = createTestApp()
    const required = 6

    const registerResponse = await requestJson(app, "/api/relay/debug/payment", {
      id: paymentId,
      scenario,
      required,
      dueSec: 600,
    })
    expect(registerResponse.status).toBe(200)

    const payResponse = await requestJson(app, "/api/relay/pay", {
      id: paymentId,
      tx: "deadbeef",
    })
    expect(payResponse.status).toBe(expectedPayStatus)

    if (expectedError) {
      expect((payResponse.body as { error: string }).error).toBe(expectedError)
      return
    }

    const payBody = payResponse.body as {
      status: string
      required?: number
      confirmed?: number
    }
    expect(payBody.status).toBe(expectedRelayStatus)

    const statusResponse = await requestJson(app, "/api/relay/status", {
      id: paymentId,
    })
    expect(statusResponse.status).toBe(200)

    const statusBody = statusResponse.body as {
      status: string
      required?: number
      confirmed?: number
    }
    expect(statusBody.status).toBe(expectedRelayStatus)

    if (scenario === "confirmed") {
      expect(payBody.required).toBe(required)
      expect(payBody.confirmed).toBe(required)
      expect(statusBody.required).toBe(required)
      expect(statusBody.confirmed).toBe(required)
    }
  })

  test("returns not_found for unknown relay payment id", async () => {
    const app = createTestApp()

    const response = await requestJson(app, "/api/relay/status", {
      id: "missing-id",
    })

    expect(response.status).toBe(404)
    expect((response.body as { error: string }).error).toBe("not_found")
  })

  test("rejects relay pay when relay_token does not match registered relay token", async () => {
    const app = createTestApp()

    const registerResponse = await requestJson(app, "/api/relay/debug/payment", {
      id: "pay-token-mismatch",
      scenario: "accepted",
      relayToken: "expected-token",
      required: 6,
      dueSec: 600,
    })
    expect(registerResponse.status).toBe(200)

    const payResponse = await requestJson(app, "/api/relay/pay", {
      id: "pay-token-mismatch",
      tx: "deadbeef",
      relay_token: "wrong-token",
    })

    expect(payResponse.status).toBe(400)
    expect((payResponse.body as { error: string }).error).toBe("invalid_token")
  })

  test("exposes generated OpenAPI JSON document", async () => {
    const app = createTestApp()
    const response = await app.handle(
      new Request("http://localhost/api/openapi/json", {
        method: "GET",
        headers: { Accept: "application/json" },
      })
    )

    expect(response.status).toBe(200)
    const json = (await response.json()) as { paths?: Record<string, unknown> }
    expect(Object.keys(json.paths ?? {})).toEqual(
      expect.arrayContaining([
        "/api/relay/pay",
        "/api/relay/status",
        "/api/flight-recorder/session",
      ])
    )
  })

  test("generates a mock QR fixture and validates the embedded envelope", async () => {
    const app = createTestApp()

    const mockQrResponse = await requestJson(app, "/api/tools/mock-qr", {})
    expect(mockQrResponse.status).toBe(200)

    const mockQr = mockQrResponse.body as {
      dc: string
      h: string
      paymentId: string
      uri: string
      envelope: unknown
    }
    expect(mockQr.dc).toBe(
      `localhost/api/tools/mock-envelope/${encodeURIComponent(mockQr.paymentId)}`
    )
    expect(mockQr.dc.startsWith("http://")).toBe(false)
    expect(mockQr.dc.startsWith("https://")).toBe(false)

    const [, queryString = ""] = mockQr.uri.split("?")
    const query = new URLSearchParams(queryString)
    expect(query.get("dc")).toBe(mockQr.dc)

    const mockEnvelopeResponse = await app.handle(
      new Request(
        `http://localhost/api/tools/mock-envelope/${encodeURIComponent(mockQr.paymentId)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      )
    )
    expect(mockEnvelopeResponse.status).toBe(200)
    const mockEnvelope = (await mockEnvelopeResponse.json()) as unknown

    const validateResponse = await requestJson(app, "/api/tools/validate-envelope", {
      envelope: mockQr.envelope,
      expectedHash: mockQr.h,
    })

    expect(validateResponse.status).toBe(200)
    expect((validateResponse.body as { verdict: string }).verdict).toBe("valid")

    const validateFetchedEnvelopeResponse = await requestJson(app, "/api/tools/validate-envelope", {
      envelope: mockEnvelope,
      expectedHash: mockQr.h,
    })

    expect(validateFetchedEnvelopeResponse.status).toBe(200)
    expect((validateFetchedEnvelopeResponse.body as { verdict: string }).verdict).toBe("valid")
  })

  test("validates a QR URI by fetching its envelope", async () => {
    const crypto = new NobleCryptoAdapter()
    const fixture = createMockDogeConnectFixture(crypto, "pay-validate-qr")
    const dc = "localhost/api/tools/mock-envelope/pay-validate-qr"
    const query = new URLSearchParams({
      amount: fixture.amount,
      dc,
      h: fixture.h,
    })
    let fetchedUrl = ""
    const app = createTestApp({
      envelopeFetcher: {
        async fetchEnvelope(connectUrl) {
          fetchedUrl = connectUrl
          return fixture.envelope
        },
      },
    })

    const response = await requestJson(app, "/api/tools/validate-qr", {
      uri: `dogecoin:${fixture.address}?${query.toString()}`,
      fetchEnvelope: true,
    })

    expect(response.status).toBe(200)
    expect((response.body as { verdict: string }).verdict).toBe("valid")
    expect(fetchedUrl).toBe(dc)
  })

  test("builds a flight recorder session from a mock source", async () => {
    const app = createTestApp()

    const response = await requestJson(app, "/api/flight-recorder/session", {
      source: {
        mode: "mock",
      },
      targetMode: "simulator",
      options: {
        includeInitialStatus: false,
      },
    })

    expect(response.status).toBe(200)
    const session = response.body as {
      version: string
      trace: Array<{ phase: string }>
      artifacts: { relay?: { mode?: string } }
    }

    expect(session.version).toBe("flight-recorder/v1")
    expect(session.trace.map((entry) => entry.phase)).toEqual(
      expect.arrayContaining(["qr_parse", "envelope_fetch", "relay_target"])
    )
    expect(session.artifacts.relay?.mode).toBe("simulator")
  })

  test("blocks live relay pay when the flight recorder session is disarmed", async () => {
    const app = createTestApp()

    const sessionResponse = await requestJson(app, "/api/flight-recorder/session", {
      source: {
        mode: "mock",
      },
      targetMode: "live",
      options: {
        includeInitialStatus: false,
      },
    })
    expect(sessionResponse.status).toBe(200)

    const payResponse = await requestJson(app, "/api/flight-recorder/relay/pay", {
      session: sessionResponse.body,
      liveWriteArmed: false,
    })

    expect(payResponse.status).toBe(200)
    const session = payResponse.body as { trace: Array<{ phase: string; verdict: string }> }
    const lastTrace = session.trace.at(-1)
    expect(lastTrace?.phase).toBe("relay_pay")
    expect(lastTrace?.verdict).toBe("fail")
  })

  test("rejects imported relay status sessions with mismatched target mode", async () => {
    const app = createTestApp()

    const sessionResponse = await requestJson(app, "/api/flight-recorder/session", {
      source: {
        mode: "mock",
      },
      targetMode: "simulator",
      options: {
        includeInitialStatus: false,
      },
    })
    expect(sessionResponse.status).toBe(200)

    const session = sessionResponse.body as FlightRecorderSessionV1
    if (session.artifacts.relay) {
      session.artifacts.relay.mode = "live"
    }

    const statusResponse = await requestJson(app, "/api/flight-recorder/relay/status", {
      session,
    })

    expect(statusResponse.status).toBe(400)
    const body = statusResponse.body as { errors: Array<{ field: string; message: string }> }
    expect(
      body.errors.some(
        (error) => error.field.includes("relay.mode") || error.message.includes("meta.targetMode")
      )
    ).toBe(true)
  })
})

interface TestAppOptions {
  envelopeFetcher?: EnvelopeFetcherPort
}

const createTestApp = (options: TestAppOptions = {}) => {
  const crypto = new NobleCryptoAdapter()
  const relayStore = new InMemoryRelayStateStore()
  const validatePaymentEnvelopeUseCase = new ValidatePaymentEnvelopeUseCase(crypto)
  const validateDogeConnectUriUseCase = new ValidateDogeConnectUriUseCase(
    options.envelopeFetcher ?? {
      fetchEnvelope: async () => {
        throw new Error("Envelope fetcher should not be called in this test")
      },
    },
    validatePaymentEnvelopeUseCase
  )
  const generateMockQrUseCase = new GenerateMockQrUseCase(crypto)
  const getMockEnvelopeUseCase = new GetMockEnvelopeUseCase(crypto)
  const relayPayUseCase = new RelayPayUseCase(relayStore, crypto)
  const relayStatusUseCase = new RelayStatusUseCase(relayStore)
  const registerRelayScenarioUseCase = new RegisterRelayScenarioUseCase(relayStore)
  const listRelayScenariosUseCase = new ListRelayScenariosUseCase(relayStore)
  const resetRelayStateUseCase = new ResetRelayStateUseCase(relayStore)
  const localFlightRecorderRelayClient = new LocalFlightRecorderRelayClient(
    registerRelayScenarioUseCase,
    relayPayUseCase,
    relayStatusUseCase,
    relayStore
  )
  const liveFlightRecorderRelayClient = {
    async getStatus() {
      return {
        body: {
          error: "not_found" as const,
          message: "Live relay client is stubbed in tests",
        },
        trace: createTraceEntry({
          kind: "execution",
          phase: "relay_status",
          target: "remote",
          verdict: "fail",
          issues: [
            {
              field: "relay",
              message: "Live relay client is stubbed in tests",
              severity: "error",
            },
          ],
        }),
      }
    },
    async pay() {
      return {
        body: {
          error: "not_found" as const,
          message: "Live relay client is stubbed in tests",
        },
        trace: createTraceEntry({
          kind: "execution",
          phase: "relay_pay",
          target: "remote",
          verdict: "fail",
          issues: [
            {
              field: "relay",
              message: "Live relay client is stubbed in tests",
              severity: "error",
            },
          ],
        }),
      }
    },
  }
  const buildFlightRecorderSessionUseCase = new BuildFlightRecorderSessionUseCase(
    generateMockQrUseCase,
    validatePaymentEnvelopeUseCase,
    {
      async fetchEnvelope() {
        return {
          envelope: null,
          trace: createTraceEntry({
            kind: "network",
            phase: "envelope_fetch",
            target: "remote",
            verdict: "fail",
            issues: [
              {
                field: "dc",
                message: "Envelope client is stubbed in tests",
                severity: "error",
              },
            ],
          }),
        }
      },
    },
    localFlightRecorderRelayClient,
    liveFlightRecorderRelayClient
  )
  const executeFlightRecorderRelayPayUseCase = new ExecuteFlightRecorderRelayPayUseCase(
    localFlightRecorderRelayClient,
    liveFlightRecorderRelayClient
  )
  const executeFlightRecorderRelayStatusUseCase = new ExecuteFlightRecorderRelayStatusUseCase(
    localFlightRecorderRelayClient,
    liveFlightRecorderRelayClient
  )

  return createDogeConnectApiApp({
    validateDogeConnectUriUseCase,
    validatePaymentEnvelopeUseCase,
    generateMockQrUseCase,
    getMockEnvelopeUseCase,
    relayPayUseCase,
    relayStatusUseCase,
    registerRelayScenarioUseCase,
    listRelayScenariosUseCase,
    resetRelayStateUseCase,
    buildFlightRecorderSessionUseCase,
    executeFlightRecorderRelayPayUseCase,
    executeFlightRecorderRelayStatusUseCase,
  })
}

const requestJson = async (
  app: ReturnType<typeof createTestApp>,
  path: string,
  payload: unknown
) => {
  const response = await app.handle(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
  )

  return {
    status: response.status,
    body: (await response.json()) as unknown,
  }
}
