import type { TracedRelayClientPort } from "../../ports/traced-relay-client-port"
import type {
  ExecuteFlightRecorderStatusInput,
  FlightRecorderSessionV1,
} from "../flight-recorder-contracts"
import { createTraceEntry, summarizeFlightRecorderSession } from "../flight-recorder-session"

export class ExecuteFlightRecorderRelayStatusUseCase {
  constructor(
    private readonly localRelayClient: TracedRelayClientPort,
    private readonly liveRelayClient: TracedRelayClientPort
  ) {}

  async execute(input: ExecuteFlightRecorderStatusInput): Promise<FlightRecorderSessionV1> {
    const relay = input.session.artifacts.relay
    if (!relay) {
      throw new Error("Flight Recorder session does not have a derived relay target")
    }

    const targetMode = input.session.meta.targetMode
    if (relay.mode !== targetMode) {
      return updateSession(
        input.session,
        createTraceEntry({
          kind: "execution",
          phase: "relay_status",
          target: targetMode === "simulator" ? "local" : "remote",
          verdict: "fail",
          issues: [
            {
              field: "artifacts.relay.mode",
              message: "Relay mode must match meta.targetMode before execution.",
              severity: "error",
            },
          ],
          requestSummary: {
            method: "POST",
            endpoint: relay.statusUrl,
            note: "Blocked relay status because the imported session target mode is inconsistent.",
            body: {
              id: input.session.artifacts.payDraft?.id ?? input.session.source.paymentId,
            },
          },
          responseSummary: {
            statusCode: null,
            note: "Relay status was blocked before the request was sent.",
            body: null,
          },
        })
      )
    }

    const client = targetMode === "simulator" ? this.localRelayClient : this.liveRelayClient
    const result = await client.getStatus({
      session: input.session,
      relay,
    })

    return updateSession(input.session, result.trace)
  }
}

const updateSession = (
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
  }

  next.summary = summarizeFlightRecorderSession(next.trace)
  return next
}
