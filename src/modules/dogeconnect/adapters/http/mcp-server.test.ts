import { describe, expect, test } from "vitest"
import type { FlightRecorderSessionV1 } from "../../application/flight-recorder-contracts"
import { createTraceEntry } from "../../application/flight-recorder-session"
import { BuildFlightRecorderSessionUseCase } from "../../application/use-cases/build-flight-recorder-session-use-case"
import { ExecuteFlightRecorderRelayPayUseCase } from "../../application/use-cases/execute-flight-recorder-relay-pay-use-case"
import { ExecuteFlightRecorderRelayStatusUseCase } from "../../application/use-cases/execute-flight-recorder-relay-status-use-case"
import { GenerateMockQrUseCase } from "../../application/use-cases/generate-mock-qr-use-case"
import { RegisterRelayScenarioUseCase } from "../../application/use-cases/register-relay-scenario-use-case"
import { RelayPayUseCase } from "../../application/use-cases/relay-pay-use-case"
import { RelayStatusUseCase } from "../../application/use-cases/relay-status-use-case"
import { ResetRelayStateUseCase } from "../../application/use-cases/reset-relay-state-use-case"
import { ValidateDogeConnectUriUseCase } from "../../application/use-cases/validate-dogeconnect-uri-use-case"
import { ValidatePaymentEnvelopeUseCase } from "../../application/use-cases/validate-payment-envelope-use-case"
import { NobleCryptoAdapter } from "../crypto/noble-crypto-adapter"
import { InMemoryRelayStateStore } from "../relay/in-memory-relay-state-store"
import { LocalFlightRecorderRelayClient } from "../relay/local-flight-recorder-relay-client"
import { createDogeConnectMcpServer } from "./mcp-server"

describe("DogeConnect MCP server", () => {
  test("initializes and lists available tools", async () => {
    const server = createTestServer()

    const initialize = await requestRpc(server, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {},
    })
    expect(initialize.status).toBe(200)
    const initializeResult = unwrapResult<{
      protocolVersion: string
      capabilities: { tools: { listChanged: boolean } }
      serverInfo: { name: string; version: string }
    }>(initialize.body)
    expect(initializeResult.protocolVersion).toBe("2024-11-05")
    expect(initializeResult.capabilities.tools.listChanged).toBe(false)

    const listTools = await requestRpc(server, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    })
    const toolsResult = unwrapResult<{ tools: Array<{ name: string }> }>(listTools.body)
    expect(toolsResult.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        "validate_dogeconnect_uri",
        "validate_payment_envelope",
        "build_flight_recorder_session",
      ])
    )
  })

  test("generates a fixture and validates its envelope through MCP tools", async () => {
    const server = createTestServer()

    const generateFixture = await requestRpc(server, {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "generate_mock_qr_fixture",
        arguments: {
          paymentId: "mcp-demo-001",
        },
      },
    })

    const fixtureCall = unwrapResult<{
      structuredContent: {
        uri: string
        h: string
        envelope: unknown
      }
      isError?: boolean
    }>(generateFixture.body)
    expect(fixtureCall.isError).toBeUndefined()
    expect(fixtureCall.structuredContent.uri.startsWith("dogecoin:")).toBe(true)

    const validateEnvelope = await requestRpc(server, {
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "validate_payment_envelope",
        arguments: {
          envelope: fixtureCall.structuredContent.envelope,
          expectedHash: fixtureCall.structuredContent.h,
        },
      },
    })

    const envelopeCall = unwrapResult<{
      structuredContent: { verdict: string }
      isError?: boolean
    }>(validateEnvelope.body)
    expect(envelopeCall.isError).toBeUndefined()
    expect(envelopeCall.structuredContent.verdict).toBe("valid")
  })

  test("builds a session and executes status/pay steps over MCP", async () => {
    const server = createTestServer()

    const buildSession = await requestRpc(server, {
      jsonrpc: "2.0",
      id: 20,
      method: "tools/call",
      params: {
        name: "build_flight_recorder_session",
        arguments: {
          sourceMode: "mock",
          targetMode: "simulator",
          includeInitialStatus: false,
        },
      },
    })

    const builtSession = unwrapResult<{
      structuredContent: FlightRecorderSessionV1
      isError?: boolean
    }>(buildSession.body)
    expect(builtSession.isError).toBeUndefined()

    const payDraftId = builtSession.structuredContent.artifacts.payDraft?.id
    expect(payDraftId).toBeTruthy()

    await requestRpc(server, {
      jsonrpc: "2.0",
      id: 21,
      method: "tools/call",
      params: {
        name: "register_relay_scenario",
        arguments: {
          id: payDraftId,
          scenario: "accepted",
        },
      },
    })

    const statusStep = await requestRpc(server, {
      jsonrpc: "2.0",
      id: 22,
      method: "tools/call",
      params: {
        name: "flight_recorder_step_status",
        arguments: {
          session: builtSession.structuredContent,
        },
      },
    })

    const statusSession = unwrapResult<{
      structuredContent: FlightRecorderSessionV1
      isError?: boolean
    }>(statusStep.body)
    expect(statusSession.isError).toBeUndefined()
    expect(statusSession.structuredContent.trace.length).toBeGreaterThan(
      builtSession.structuredContent.trace.length
    )

    const payStep = await requestRpc(server, {
      jsonrpc: "2.0",
      id: 23,
      method: "tools/call",
      params: {
        name: "flight_recorder_step_pay",
        arguments: {
          session: statusSession.structuredContent,
          liveWriteArmed: true,
        },
      },
    })

    const paySession = unwrapResult<{
      structuredContent: FlightRecorderSessionV1
      isError?: boolean
    }>(payStep.body)
    expect(paySession.isError).toBeUndefined()
    expect(paySession.structuredContent.trace.length).toBeGreaterThan(
      statusSession.structuredContent.trace.length
    )
  })
})

const createTestServer = () => {
  const crypto = new NobleCryptoAdapter()
  const relayStore = new InMemoryRelayStateStore()
  const validatePaymentEnvelopeUseCase = new ValidatePaymentEnvelopeUseCase(crypto)
  const validateDogeConnectUriUseCase = new ValidateDogeConnectUriUseCase(
    {
      fetchEnvelope: async () => {
        throw new Error("Envelope fetcher should not be called in this test")
      },
    },
    validatePaymentEnvelopeUseCase
  )
  const generateMockQrUseCase = new GenerateMockQrUseCase(crypto)
  const relayPayUseCase = new RelayPayUseCase(relayStore, crypto)
  const relayStatusUseCase = new RelayStatusUseCase(relayStore)
  const registerRelayScenarioUseCase = new RegisterRelayScenarioUseCase(relayStore)
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

  return createDogeConnectMcpServer({
    validateDogeConnectUriUseCase,
    validatePaymentEnvelopeUseCase,
    generateMockQrUseCase,
    registerRelayScenarioUseCase,
    resetRelayStateUseCase,
    buildFlightRecorderSessionUseCase,
    executeFlightRecorderRelayPayUseCase,
    executeFlightRecorderRelayStatusUseCase,
  })
}

const requestRpc = async (
  server: ReturnType<typeof createTestServer>,
  payload: Record<string, unknown>
) => {
  const response = await server.handleHttp(
    new Request("http://localhost/mcp", {
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

const unwrapResult = <T>(payload: unknown): T => {
  const record = payload as { result?: unknown; error?: unknown }
  if ("error" in record && record.error) {
    throw new Error(`Unexpected JSON-RPC error: ${JSON.stringify(record.error)}`)
  }
  return record.result as T
}
