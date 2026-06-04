import type { FlightRecorderRelayActionResult } from "../../application/flight-recorder-contracts"
import { createTraceEntry } from "../../application/flight-recorder-session"
import {
  ERROR_CODE_VALUES,
  type PaymentStatusResponse,
  validatePaymentStatusResponse,
} from "../../domain/value-objects/payment-status"
import type {
  TracedRelayClientPort,
  TracedRelayPayInput,
  TracedRelayStatusInput,
} from "../../ports/traced-relay-client-port"
import { safeFetchJson } from "./public-target-guard"

export class HttpFlightRecorderRelayClient implements TracedRelayClientPort {
  async getStatus(input: TracedRelayStatusInput): Promise<FlightRecorderRelayActionResult> {
    return executeRelayRequest({
      method: "POST",
      endpoint: input.relay.statusUrl,
      requestBody: {
        id: input.session.artifacts.payDraft?.id ?? input.session.source.paymentId,
      },
      phase: "relay_status",
      note: "Read current status from the relay target.",
    })
  }

  async pay(input: TracedRelayPayInput): Promise<FlightRecorderRelayActionResult> {
    return executeRelayRequest({
      method: "POST",
      endpoint: input.relay.payUrl,
      requestBody: input.submission,
      phase: "relay_pay",
      note: "Submitted the current pay draft to the relay target.",
    })
  }
}

const executeRelayRequest = async (input: {
  method: "POST"
  endpoint: string
  requestBody: unknown
  phase: "relay_status" | "relay_pay"
  note: string
}): Promise<FlightRecorderRelayActionResult> => {
  const startedAt = new Date().toISOString()
  const started = Date.now()

  try {
    const response = await safeFetchJson({
      url: input.endpoint,
      method: input.method,
      body: input.requestBody,
    })

    return {
      body: normalizeRelayBody(response.body),
      trace: createTraceEntry({
        kind: "execution",
        phase: input.phase,
        target: "remote",
        startedAt,
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        verdict: response.statusCode >= 200 && response.statusCode < 300 ? "pass" : "fail",
        requestSummary: {
          method: input.method,
          endpoint: response.url,
          note: input.note,
          body: input.requestBody,
        },
        responseSummary: {
          statusCode: response.statusCode,
          note:
            response.statusCode >= 200 && response.statusCode < 300
              ? "Relay returned a successful JSON response."
              : "Relay returned an error response.",
          body: response.body,
        },
        artifactsChanged: [],
      }),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Relay request failed"
    return {
      body: {
        error: "invalid_outputs",
        message,
      },
      trace: createTraceEntry({
        kind: "execution",
        phase: input.phase,
        target: "remote",
        startedAt,
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        verdict: "fail",
        issues: [{ field: "relay", message, severity: "error" }],
        requestSummary: {
          method: input.method,
          endpoint: input.endpoint,
          note: input.note,
          body: input.requestBody,
        },
        responseSummary: {
          statusCode: null,
          note: message,
          body: null,
        },
      }),
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const normalizeRelayBody = (
  value: unknown
):
  | PaymentStatusResponse
  | {
      error: "not_found" | "expired" | "invalid_tx" | "invalid_outputs" | "invalid_token"
      message: string
    }
  | null => {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.error === "string" &&
    typeof value.message === "string" &&
    ERROR_CODE_VALUES.includes(value.error as (typeof ERROR_CODE_VALUES)[number])
  ) {
    return {
      error: value.error as (typeof ERROR_CODE_VALUES)[number],
      message: value.message,
    }
  }

  if (typeof value.id === "string" && typeof value.status === "string") {
    const candidate = value as unknown as PaymentStatusResponse
    if (validatePaymentStatusResponse(candidate).length === 0) {
      return candidate
    }
  }

  return {
    error: "invalid_outputs",
    message: "Relay returned JSON that did not match the expected status/error schema.",
  }
}
