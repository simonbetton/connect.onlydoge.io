import { createTraceEntry } from "../../application/flight-recorder-session"
import type {
  TracedEnvelopeClientPort,
  TracedEnvelopeFetchResult,
} from "../../ports/traced-envelope-client-port"
import { safeFetchJson } from "./public-target-guard"

export class HttpFlightRecorderEnvelopeClient implements TracedEnvelopeClientPort {
  async fetchEnvelope(input: { connectUrl: string }): Promise<TracedEnvelopeFetchResult> {
    const startedAt = new Date().toISOString()
    const started = Date.now()

    try {
      const response = await safeFetchJson({
        url: input.connectUrl,
        method: "GET",
      })

      return {
        envelope: isRecord(response.body) ? response.body : null,
        trace: createTraceEntry({
          kind: "network",
          phase: "envelope_fetch",
          target: "remote",
          startedAt,
          endedAt: new Date().toISOString(),
          durationMs: Date.now() - started,
          verdict: response.statusCode >= 200 && response.statusCode < 300 ? "pass" : "fail",
          requestSummary: {
            method: "GET",
            endpoint: response.url,
            note: "Fetched envelope from the DogeConnect dc target.",
          },
          responseSummary: {
            statusCode: response.statusCode,
            note:
              response.statusCode >= 200 && response.statusCode < 300
                ? "Envelope endpoint returned JSON."
                : "Envelope endpoint returned a non-success status.",
            body: response.body,
          },
          artifactsChanged: ["envelope.raw"],
        }),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch envelope"
      return {
        envelope: null,
        trace: createTraceEntry({
          kind: "network",
          phase: "envelope_fetch",
          target: "remote",
          startedAt,
          endedAt: new Date().toISOString(),
          durationMs: Date.now() - started,
          verdict: "fail",
          issues: [{ field: "dc", message, severity: "error" }],
          requestSummary: {
            method: "GET",
            endpoint: input.connectUrl,
            note: "Attempted to fetch the envelope from the DogeConnect dc target.",
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
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null
