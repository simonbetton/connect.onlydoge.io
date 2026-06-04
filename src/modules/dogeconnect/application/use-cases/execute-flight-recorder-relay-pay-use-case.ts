import type { TracedRelayClientPort } from "../../ports/traced-relay-client-port"
import type {
  ExecuteFlightRecorderPayInput,
  FlightRecorderSessionV1,
} from "../flight-recorder-contracts"
import { createTraceEntry, summarizeFlightRecorderSession } from "../flight-recorder-session"

export class ExecuteFlightRecorderRelayPayUseCase {
  constructor(
    private readonly localRelayClient: TracedRelayClientPort,
    private readonly liveRelayClient: TracedRelayClientPort
  ) {}

  async execute(input: ExecuteFlightRecorderPayInput): Promise<FlightRecorderSessionV1> {
    const relay = input.session.artifacts.relay
    const payDraft = input.session.artifacts.payDraft

    if (!relay || !payDraft) {
      throw new Error("Flight Recorder session is missing relay or pay draft artifacts")
    }

    if (relay.mode === "live" && !input.liveWriteArmed) {
      return appendTrace(
        input.session,
        createTraceEntry({
          kind: "execution",
          phase: "relay_pay",
          target: "remote",
          verdict: "fail",
          issues: [
            {
              field: "relay",
              message: "Live relay pay is disarmed. Arm writes explicitly before submitting.",
              severity: "error",
            },
          ],
          requestSummary: {
            method: "POST",
            endpoint: relay.payUrl,
            note: "Blocked live relay pay because the session is not armed for writes.",
            body: payDraft,
          },
          responseSummary: {
            statusCode: null,
            note: "Live relay pay was blocked before the request was sent.",
            body: null,
          },
        })
      )
    }

    const client = relay.mode === "simulator" ? this.localRelayClient : this.liveRelayClient
    const result = await client.pay({
      session: input.session,
      relay,
      submission: payDraft,
    })

    return appendTrace(input.session, result.trace)
  }
}

const appendTrace = (
  session: FlightRecorderSessionV1,
  trace: FlightRecorderSessionV1["trace"][number]
): FlightRecorderSessionV1 => {
  const next: FlightRecorderSessionV1 = {
    ...session,
    meta: {
      ...session.meta,
      updatedAt: new Date().toISOString(),
    },
    trace: [...session.trace, trace],
    artifacts: {
      ...session.artifacts,
      relay: session.artifacts.relay
        ? {
            ...session.artifacts.relay,
          }
        : null,
    },
  }

  next.summary = summarizeFlightRecorderSession(next.trace)
  return next
}
