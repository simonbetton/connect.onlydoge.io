import type { TracedRelayClientPort } from "../../ports/traced-relay-client-port"
import type {
  ExecuteFlightRecorderStatusInput,
  FlightRecorderSessionV1,
} from "../flight-recorder-contracts"
import { summarizeFlightRecorderSession } from "../flight-recorder-session"

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

    const client = relay.mode === "simulator" ? this.localRelayClient : this.liveRelayClient
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
