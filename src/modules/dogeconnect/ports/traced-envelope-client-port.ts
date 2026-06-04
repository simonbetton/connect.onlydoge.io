import type { FlightTraceEntry } from "../application/flight-recorder-contracts"

export interface TracedEnvelopeFetchInput {
  connectUrl: string
}

export interface TracedEnvelopeFetchResult {
  trace: FlightTraceEntry
  envelope: unknown | null
}

export interface TracedEnvelopeClientPort {
  fetchEnvelope(input: TracedEnvelopeFetchInput): Promise<TracedEnvelopeFetchResult>
}
