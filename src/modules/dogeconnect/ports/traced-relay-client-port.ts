import type {
  FlightRecorderPayDraft,
  FlightRecorderRelayActionResult,
  FlightRecorderRelayTargetArtifact,
  FlightRecorderSessionV1,
} from "../application/flight-recorder-contracts"

export interface TracedRelayStatusInput {
  session: FlightRecorderSessionV1
  relay: FlightRecorderRelayTargetArtifact
}

export interface TracedRelayPayInput {
  session: FlightRecorderSessionV1
  relay: FlightRecorderRelayTargetArtifact
  submission: FlightRecorderPayDraft
}

export interface TracedRelayClientPort {
  getStatus(input: TracedRelayStatusInput): Promise<FlightRecorderRelayActionResult>
  pay(input: TracedRelayPayInput): Promise<FlightRecorderRelayActionResult>
}
