import {
  type BuildFlightRecorderSessionInput,
  FLIGHT_RECORDER_FAULT_PRESETS,
  FLIGHT_RECORDER_TARGET_MODES,
  type FlightRecorderFaultPreset,
  type FlightRecorderSessionV1,
  type FlightRecorderTargetMode,
} from "../../application/flight-recorder-contracts"
import { parseImportedFlightRecorderSession } from "../../application/flight-recorder-session"
import type { ExecuteFlightRecorderRelayPayUseCase } from "../../application/use-cases/execute-flight-recorder-relay-pay-use-case"
import type { ExecuteFlightRecorderRelayStatusUseCase } from "../../application/use-cases/execute-flight-recorder-relay-status-use-case"
import type { GenerateMockQrUseCase } from "../../application/use-cases/generate-mock-qr-use-case"
import type { RegisterRelayScenarioUseCase } from "../../application/use-cases/register-relay-scenario-use-case"
import type { ResetRelayStateUseCase } from "../../application/use-cases/reset-relay-state-use-case"
import type { ValidateDogeConnectUriUseCase } from "../../application/use-cases/validate-dogeconnect-uri-use-case"
import type { ValidatePaymentEnvelopeUseCase } from "../../application/use-cases/validate-payment-envelope-use-case"
import type { RelayScenario } from "../../domain/entities/relay-scenario"

export const DOGE_CONNECT_MCP_ENDPOINT_PATH = "/mcp"
export const DOGE_CONNECT_MCP_SERVER_NAME = "onlydoge-dogeconnect-debugger"
export const DOGE_CONNECT_MCP_SERVER_VERSION = "1.0.0"
export const DOGE_CONNECT_MCP_PROTOCOL_VERSION = "2024-11-05"

interface DogeConnectMcpDependencies {
  validateDogeConnectUriUseCase: ValidateDogeConnectUriUseCase
  validatePaymentEnvelopeUseCase: ValidatePaymentEnvelopeUseCase
  generateMockQrUseCase: GenerateMockQrUseCase
  registerRelayScenarioUseCase: RegisterRelayScenarioUseCase
  resetRelayStateUseCase: ResetRelayStateUseCase
  buildFlightRecorderSessionUseCase: {
    execute(input: BuildFlightRecorderSessionInput): Promise<FlightRecorderSessionV1>
  }
  executeFlightRecorderRelayPayUseCase: ExecuteFlightRecorderRelayPayUseCase
  executeFlightRecorderRelayStatusUseCase: ExecuteFlightRecorderRelayStatusUseCase
}

export interface DogeConnectMcpServer {
  handleHttp(request: Request): Promise<Response>
}

type JsonRpcId = string | number | null

interface JsonRpcRequest {
  jsonrpc: "2.0"
  id?: JsonRpcId
  method: string
  params?: unknown
}

interface JsonRpcSuccess {
  jsonrpc: "2.0"
  id: JsonRpcId
  result: unknown
}

interface JsonRpcError {
  jsonrpc: "2.0"
  id: JsonRpcId
  error: {
    code: number
    message: string
    data?: unknown
  }
}

interface McpToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

type McpToolsCallResult = {
  content: Array<{
    type: "text"
    text: string
  }>
  structuredContent?: unknown
  isError?: boolean
}

const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "validate_dogeconnect_uri",
    description:
      "Parse and validate a Dogecoin or DogeConnect URI, optionally fetching and verifying the envelope.",
    inputSchema: {
      type: "object",
      properties: {
        uri: {
          type: "string",
          description: "The dogecoin: URI to validate.",
        },
        fetchEnvelope: {
          type: "boolean",
          description: "When true, fetches dc and validates envelope signature/hash.",
          default: true,
        },
      },
      required: ["uri"],
      additionalProperties: false,
    },
  },
  {
    name: "validate_payment_envelope",
    description:
      "Validate envelope structure, payload schema, signature, and optional URI h hash binding.",
    inputSchema: {
      type: "object",
      properties: {
        envelope: {
          type: "object",
          description: "Raw envelope object with version/payload/pubkey/sig fields.",
        },
        expectedHash: {
          type: "string",
          description: "Optional expected h value from the URI.",
        },
      },
      required: ["envelope"],
      additionalProperties: false,
    },
  },
  {
    name: "generate_mock_qr_fixture",
    description:
      "Generate a valid DogeConnect URI fixture and matching signed payment envelope for testing.",
    inputSchema: {
      type: "object",
      properties: {
        paymentId: {
          type: "string",
          description: "Optional deterministic payment ID.",
        },
        origin: {
          type: "string",
          description:
            "Optional origin override used to build dc URL (defaults to this MCP server origin).",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "build_flight_recorder_session",
    description:
      "Build an end-to-end DogeConnect debug session and return trace artifacts for each protocol step.",
    inputSchema: {
      type: "object",
      properties: {
        sourceMode: {
          type: "string",
          enum: ["qr", "mock"],
          default: "mock",
        },
        uri: {
          type: "string",
          description: "Required when sourceMode is qr.",
        },
        paymentId: {
          type: "string",
          description: "Optional when sourceMode is mock.",
        },
        targetMode: {
          type: "string",
          enum: ["simulator", "live"],
          default: "simulator",
        },
        faults: {
          type: "array",
          items: {
            type: "string",
            enum: FLIGHT_RECORDER_FAULT_PRESETS,
          },
          description: "Optional fault presets for deterministic failure injection.",
        },
        includeInitialStatus: {
          type: "boolean",
          default: true,
        },
        origin: {
          type: "string",
          description:
            "Optional origin override used when generating mock source sessions (defaults to this server origin).",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "flight_recorder_step_status",
    description: "Run one relay status step against an existing Flight Recorder session.",
    inputSchema: {
      type: "object",
      properties: {
        session: {
          type: "object",
          description: "A previously returned flight-recorder session object.",
        },
      },
      required: ["session"],
      additionalProperties: false,
    },
  },
  {
    name: "flight_recorder_step_pay",
    description: "Run one relay pay step against an existing Flight Recorder session.",
    inputSchema: {
      type: "object",
      properties: {
        session: {
          type: "object",
          description: "A previously returned flight-recorder session object.",
        },
        liveWriteArmed: {
          type: "boolean",
          description: "Required true before live relay writes are allowed.",
          default: false,
        },
      },
      required: ["session"],
      additionalProperties: false,
    },
  },
  {
    name: "register_relay_scenario",
    description: "Configure a simulator scenario for relay pay/status debugging.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
        },
        scenario: {
          type: "string",
          enum: ["accepted", "confirmed", "declined", "error"],
        },
        reason: {
          type: "string",
        },
        relayToken: {
          type: "string",
        },
        required: {
          type: "integer",
          minimum: 1,
        },
        dueSec: {
          type: "integer",
          minimum: 1,
        },
      },
      required: ["id", "scenario"],
      additionalProperties: false,
    },
  },
  {
    name: "reset_relay_state",
    description: "Clear all registered simulator relay scenarios and statuses.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
]

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Accept",
}

export const createDogeConnectMcpServer = (
  dependencies: DogeConnectMcpDependencies
): DogeConnectMcpServer => {
  const executeRpcRequest = async (
    rpc: JsonRpcRequest,
    request: Request
  ): Promise<JsonRpcSuccess | JsonRpcError> => {
    if (rpc.method === "initialize") {
      return jsonRpcSuccess(rpc.id ?? null, {
        protocolVersion: DOGE_CONNECT_MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: DOGE_CONNECT_MCP_SERVER_NAME,
          version: DOGE_CONNECT_MCP_SERVER_VERSION,
        },
        instructions:
          "Use the DogeConnect tools to validate URIs, inspect envelopes, and run full relay traces step-by-step.",
      })
    }

    if (rpc.method === "notifications/initialized" || rpc.method === "ping") {
      return jsonRpcSuccess(rpc.id ?? null, {})
    }

    if (rpc.method === "tools/list") {
      return jsonRpcSuccess(rpc.id ?? null, { tools: MCP_TOOLS })
    }

    if (rpc.method === "tools/call") {
      if (!isRecord(rpc.params)) {
        return jsonRpcError(rpc.id ?? null, -32602, "tools/call params must be an object.")
      }
      const toolName = asNonEmptyString(rpc.params.name, "name")
      if (!toolName.ok) {
        return jsonRpcError(rpc.id ?? null, -32602, toolName.message)
      }

      const argumentsValue = isRecord(rpc.params.arguments) ? rpc.params.arguments : {}
      const origin = new URL(request.url).origin

      const toolResult = await executeTool({
        toolName: toolName.value,
        argumentsValue,
        origin,
        dependencies,
      })

      return jsonRpcSuccess(rpc.id ?? null, toolResult)
    }

    return jsonRpcError(rpc.id ?? null, -32601, `Method not found: ${rpc.method}`)
  }

  return {
    async handleHttp(request) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS,
        })
      }

      if (request.method === "GET") {
        return jsonResponse({
          name: DOGE_CONNECT_MCP_SERVER_NAME,
          version: DOGE_CONNECT_MCP_SERVER_VERSION,
          protocolVersion: DOGE_CONNECT_MCP_PROTOCOL_VERSION,
          endpoint: DOGE_CONNECT_MCP_ENDPOINT_PATH,
          capabilities: {
            tools: true,
          },
          tools: MCP_TOOLS.map((tool) => ({
            name: tool.name,
            description: tool.description,
          })),
        })
      }

      if (request.method !== "POST") {
        return jsonResponse(
          {
            error: "method_not_allowed",
            message: "Use POST for MCP JSON-RPC calls or GET for endpoint metadata.",
          },
          405
        )
      }

      const payload = await readJson(request)
      if (!payload.ok) {
        return jsonResponse(jsonRpcError(null, -32700, payload.message))
      }

      if (Array.isArray(payload.value)) {
        return jsonResponse(
          jsonRpcError(
            null,
            -32600,
            "Batch JSON-RPC requests are not supported by this MCP endpoint."
          )
        )
      }

      if (!isJsonRpcRequest(payload.value)) {
        return jsonResponse(jsonRpcError(null, -32600, "Invalid JSON-RPC request payload."))
      }

      const rpc = payload.value
      const isNotification = rpc.id === undefined

      const result = await executeRpcRequest(rpc, request)
      if (isNotification) {
        return new Response(null, {
          status: 202,
          headers: CORS_HEADERS,
        })
      }

      return jsonResponse(result)
    },
  }
}

const executeTool = async (input: {
  toolName: string
  argumentsValue: Record<string, unknown>
  origin: string
  dependencies: DogeConnectMcpDependencies
}): Promise<McpToolsCallResult> => {
  try {
    switch (input.toolName) {
      case "validate_dogeconnect_uri": {
        const uri = requiredString(input.argumentsValue, "uri")
        const fetchEnvelope = optionalBoolean(input.argumentsValue, "fetchEnvelope", true)
        const result = await input.dependencies.validateDogeConnectUriUseCase.execute({
          uri,
          fetchEnvelope,
        })
        return toToolResult(`URI validation verdict: ${result.verdict}`, result)
      }
      case "validate_payment_envelope": {
        if (!("envelope" in input.argumentsValue)) {
          throw new Error("envelope is required.")
        }
        const expectedHash = optionalString(input.argumentsValue, "expectedHash")
        const result = input.dependencies.validatePaymentEnvelopeUseCase.execute({
          envelope: input.argumentsValue.envelope,
          expectedHash: expectedHash || undefined,
        })
        return toToolResult(`Envelope validation verdict: ${result.verdict}`, result)
      }
      case "generate_mock_qr_fixture": {
        const paymentId = optionalString(input.argumentsValue, "paymentId")
        const originOverride = optionalString(input.argumentsValue, "origin")
        const result = input.dependencies.generateMockQrUseCase.execute({
          paymentId: paymentId || undefined,
          origin: normalizeOrigin(originOverride, input.origin),
        })
        return toToolResult(`Generated mock fixture for paymentId "${result.paymentId}".`, result)
      }
      case "build_flight_recorder_session": {
        const sourceModeValue = optionalString(input.argumentsValue, "sourceMode", "mock") ?? "mock"
        const sourceMode = parseSourceMode(sourceModeValue)
        const targetModeValue =
          optionalString(input.argumentsValue, "targetMode", "simulator") ?? "simulator"
        const targetMode = parseTargetMode(targetModeValue)
        const faults = parseFaults(input.argumentsValue.faults)
        const includeInitialStatus = optionalBoolean(
          input.argumentsValue,
          "includeInitialStatus",
          true
        )
        const originOverride = optionalString(input.argumentsValue, "origin")

        const session =
          sourceMode === "qr"
            ? await input.dependencies.buildFlightRecorderSessionUseCase.execute({
                source: {
                  mode: "qr",
                  uri: requiredString(input.argumentsValue, "uri"),
                },
                targetMode,
                faults,
                options: {
                  includeInitialStatus,
                },
                origin: normalizeOrigin(originOverride, input.origin),
              })
            : await input.dependencies.buildFlightRecorderSessionUseCase.execute({
                source: {
                  mode: "mock",
                  paymentId: optionalString(input.argumentsValue, "paymentId") || undefined,
                },
                targetMode,
                faults,
                options: {
                  includeInitialStatus,
                },
                origin: normalizeOrigin(originOverride, input.origin),
              })

        return toToolResult(
          `Flight Recorder session built with verdict "${session.summary.verdict}".`,
          session
        )
      }
      case "flight_recorder_step_status": {
        const session = parseSession(input.argumentsValue.session)
        const result = await input.dependencies.executeFlightRecorderRelayStatusUseCase.execute({
          session,
        })
        return toToolResult(
          `Status step complete. Session verdict is "${result.summary.verdict}".`,
          result
        )
      }
      case "flight_recorder_step_pay": {
        const session = parseSession(input.argumentsValue.session)
        const liveWriteArmed = optionalBoolean(input.argumentsValue, "liveWriteArmed", false)
        const result = await input.dependencies.executeFlightRecorderRelayPayUseCase.execute({
          session,
          liveWriteArmed,
        })
        return toToolResult(
          `Pay step complete. Session verdict is "${result.summary.verdict}".`,
          result
        )
      }
      case "register_relay_scenario": {
        const scenario = parseRelayScenario(requiredString(input.argumentsValue, "scenario"))
        const result = await input.dependencies.registerRelayScenarioUseCase.execute({
          id: requiredString(input.argumentsValue, "id"),
          scenario,
          reason: optionalString(input.argumentsValue, "reason") || undefined,
          relayToken: optionalString(input.argumentsValue, "relayToken") || undefined,
          required: optionalPositiveInteger(input.argumentsValue, "required"),
          dueSec: optionalPositiveInteger(input.argumentsValue, "dueSec"),
        })
        if (!result.ok) {
          return toToolResult("Relay scenario registration failed.", result, true)
        }
        return toToolResult(`Registered relay scenario for "${result.record.id}".`, result.record)
      }
      case "reset_relay_state": {
        await input.dependencies.resetRelayStateUseCase.execute()
        return toToolResult("Relay simulator state has been reset.", { ok: true })
      }
      default:
        throw new Error(`Unknown tool name "${input.toolName}".`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown tool execution failure."
    return toToolResult(message, { error: message }, true)
  }
}

const parseSession = (sessionValue: unknown): FlightRecorderSessionV1 => {
  const parsed = parseImportedFlightRecorderSession(sessionValue)
  if (!parsed.value) {
    const reason = parsed.issues.map((issue) => `${issue.field}: ${issue.message}`).join("; ")
    throw new Error(`session is invalid: ${reason || "unknown reason"}`)
  }
  return parsed.value
}

const parseRelayScenario = (value: string): RelayScenario => {
  if (value === "accepted" || value === "confirmed" || value === "declined" || value === "error") {
    return value
  }
  throw new Error('scenario must be one of "accepted", "confirmed", "declined", "error".')
}

const parseTargetMode = (value: string): FlightRecorderTargetMode => {
  if (FLIGHT_RECORDER_TARGET_MODES.includes(value as FlightRecorderTargetMode)) {
    return value as FlightRecorderTargetMode
  }
  throw new Error('targetMode must be one of "simulator" or "live".')
}

const parseSourceMode = (value: string): "qr" | "mock" => {
  if (value === "qr" || value === "mock") {
    return value
  }
  throw new Error('sourceMode must be one of "qr" or "mock".')
}

const parseFaults = (value: unknown): FlightRecorderFaultPreset[] => {
  if (value === undefined) {
    return []
  }
  if (!Array.isArray(value)) {
    throw new Error("faults must be an array of fault preset strings.")
  }
  const invalid = value.filter(
    (entry) => typeof entry !== "string" || !FLIGHT_RECORDER_FAULT_PRESETS.includes(entry as never)
  )
  if (invalid.length > 0) {
    throw new Error(
      `faults contains unsupported values: ${invalid
        .map((entry) => JSON.stringify(entry))
        .join(", ")}.`
    )
  }
  return value as FlightRecorderFaultPreset[]
}

const toToolResult = (
  summary: string,
  structuredContent: unknown,
  isError = false
): McpToolsCallResult => ({
  content: [
    {
      type: "text",
      text: summary,
    },
  ],
  structuredContent,
  ...(isError ? { isError: true } : {}),
})

const normalizeOrigin = (candidate: string | null, fallback: string) => {
  const value = candidate || fallback
  try {
    const parsed = new URL(value)
    return parsed.origin
  } catch {
    throw new Error(`origin must be a valid absolute URL. Received: ${value}`)
  }
}

const requiredString = (record: Record<string, unknown>, field: string): string => {
  const parsed = asNonEmptyString(record[field], field)
  if (!parsed.ok) {
    throw new Error(parsed.message)
  }
  return parsed.value
}

const optionalString = (
  record: Record<string, unknown>,
  field: string,
  fallback: string | null = null
): string | null => {
  const value = record[field]
  if (value === undefined || value === null || value === "") {
    return fallback
  }
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string.`)
  }
  return value
}

const optionalBoolean = (
  record: Record<string, unknown>,
  field: string,
  fallback: boolean
): boolean => {
  const value = record[field]
  if (value === undefined) {
    return fallback
  }
  if (typeof value !== "boolean") {
    throw new Error(`${field} must be a boolean.`)
  }
  return value
}

const optionalPositiveInteger = (
  record: Record<string, unknown>,
  field: string
): number | undefined => {
  const value = record[field]
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer.`)
  }
  return value
}

const asNonEmptyString = (
  value: unknown,
  field: string
): { ok: true; value: string } | { ok: false; message: string } => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {
      ok: false,
      message: `${field} must be a non-empty string.`,
    }
  }
  return {
    ok: true,
    value: value.trim(),
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const isJsonRpcRequest = (value: unknown): value is JsonRpcRequest => {
  if (!isRecord(value)) {
    return false
  }
  return value.jsonrpc === "2.0" && typeof value.method === "string"
}

const readJson = async (
  request: Request
): Promise<{ ok: true; value: unknown } | { ok: false; message: string }> => {
  try {
    const body = await request.json()
    return { ok: true, value: body }
  } catch {
    return { ok: false, message: "Request body must be valid JSON." }
  }
}

const jsonRpcSuccess = (id: JsonRpcId, result: unknown): JsonRpcSuccess => ({
  jsonrpc: "2.0",
  id,
  result,
})

const jsonRpcError = (
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown
): JsonRpcError => ({
  jsonrpc: "2.0",
  id,
  error: data === undefined ? { code, message } : { code, message, data },
})

const jsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
