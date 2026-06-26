import { createTraceEntry } from "../../application/flight-recorder-session"
import type { EnvelopeFetcherPort } from "../../ports/envelope-fetcher-port"
import type { TracedEnvelopeClientPort } from "../../ports/traced-envelope-client-port"
import type { TracedRelayClientPort } from "../../ports/traced-relay-client-port"

export const createStubLiveFlightRecorderRelayClient = (): TracedRelayClientPort => ({
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
})

export const createStubFlightRecorderEnvelopeClient = (): TracedEnvelopeClientPort => ({
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
})

export const createThrowingEnvelopeFetcher = (
  message = "Envelope fetcher should not be called in this test"
): EnvelopeFetcherPort => ({
  fetchEnvelope: async () => {
    throw new Error(message)
  },
})
