import type { ValidationIssue } from "../domain/shared/validation"
import type { PaymentStatusResponse, RelayErrorCode } from "../domain/value-objects/payment-status"
import type { EnvelopeValidationPayload } from "./contracts"

export const FLIGHT_RECORDER_SESSION_VERSION = "flight-recorder/v1"

export const FLIGHT_RECORDER_SOURCE_MODES = ["qr", "mock"] as const
export type FlightRecorderSourceMode = (typeof FLIGHT_RECORDER_SOURCE_MODES)[number]

export const FLIGHT_RECORDER_TARGET_MODES = ["simulator", "live"] as const
export type FlightRecorderTargetMode = (typeof FLIGHT_RECORDER_TARGET_MODES)[number]

export const FLIGHT_RECORDER_EXPORT_MODES = ["sanitized", "full"] as const
export type FlightRecorderExportMode = (typeof FLIGHT_RECORDER_EXPORT_MODES)[number]

export const FLIGHT_TRACE_KINDS = ["input", "validation", "network", "execution"] as const
export type FlightTraceKind = (typeof FLIGHT_TRACE_KINDS)[number]

export const FLIGHT_TRACE_PHASES = [
  "qr_parse",
  "envelope_fetch",
  "envelope_validate",
  "payment_decode",
  "relay_target",
  "relay_status",
  "relay_pay",
] as const
export type FlightTracePhase = (typeof FLIGHT_TRACE_PHASES)[number]

export const FLIGHT_TRACE_TARGETS = ["session", "artifact", "local", "remote"] as const
export type FlightTraceTarget = (typeof FLIGHT_TRACE_TARGETS)[number]

export const FLIGHT_TRACE_VERDICTS = ["pass", "warn", "fail"] as const
export type FlightTraceVerdict = (typeof FLIGHT_TRACE_VERDICTS)[number]

export const FLIGHT_RECORDER_FAULT_PRESETS = [
  "wrong_hash",
  "missing_hash",
  "bad_signature",
  "bad_pubkey_hash",
  "expired_timeout",
  "missing_relay_token",
  "simulator_confirmed",
  "simulator_declined",
  "simulator_error",
  "simulator_delayed_confirmation",
] as const

export type FlightRecorderFaultPreset = (typeof FLIGHT_RECORDER_FAULT_PRESETS)[number]

export const FLIGHT_RECORDER_SIMULATOR_FAULT_PRESETS = [
  "simulator_confirmed",
  "simulator_declined",
  "simulator_error",
  "simulator_delayed_confirmation",
] as const

export type FlightRecorderSimulatorFaultPreset =
  (typeof FLIGHT_RECORDER_SIMULATOR_FAULT_PRESETS)[number]

export interface FlightRecorderSessionMeta {
  createdAt: string
  updatedAt: string
  sourceMode: FlightRecorderSourceMode
  targetMode: FlightRecorderTargetMode
  exportMode: FlightRecorderExportMode
}

export interface FlightRecorderSessionSource {
  mode: FlightRecorderSourceMode
  uri: string
  paymentId: string
  origin: string
  imported: boolean
}

export interface FlightRecorderParsedQrArtifact {
  address: string
  amount: string
  connectUrl: string
  pubKeyHashBase64Url: string
  isConnectUri: boolean
}

export interface FlightRecorderRelayTargetArtifact {
  mode: FlightRecorderTargetMode
  sourceRelayUrl: string
  payUrl: string
  statusUrl: string
  liveWriteArmed: boolean
  simulatorScenario: FlightRecorderSimulatorFaultPreset | null
}

export interface FlightRecorderPayDraft {
  id: string
  tx: string
  refund: string
  relay_token: string
}

export interface FlightRecorderArtifacts {
  qr: {
    rawUri: string
    effectiveUri: string
    parsed: FlightRecorderParsedQrArtifact | null
  }
  envelope: {
    fetchedFrom: string
    raw: Record<string, unknown> | null
    validation: EnvelopeValidationPayload | null
  }
  payment: {
    raw: Record<string, unknown> | null
    relay: string
    relayTokenPresent: boolean
    timeout: number | null
    issued: string
  }
  relay: FlightRecorderRelayTargetArtifact | null
  payDraft: FlightRecorderPayDraft | null
}

export interface FlightTraceRequestSummary {
  method: string
  endpoint: string
  note: string
  body: unknown
}

export interface FlightTraceResponseSummary {
  statusCode: number | null
  note: string
  body: unknown
}

export interface FlightTraceEntry {
  id: string
  kind: FlightTraceKind
  phase: FlightTracePhase
  target: FlightTraceTarget
  startedAt: string
  endedAt: string
  durationMs: number
  verdict: FlightTraceVerdict
  issues: ValidationIssue[]
  requestSummary: FlightTraceRequestSummary
  responseSummary: FlightTraceResponseSummary
  artifactsChanged: string[]
}

export interface FlightRecorderSessionSummary {
  verdict: FlightTraceVerdict
  firstFailingStep: string
  likelyCauses: string[]
}

export interface FlightRecorderSessionV1 {
  version: typeof FLIGHT_RECORDER_SESSION_VERSION
  meta: FlightRecorderSessionMeta
  source: FlightRecorderSessionSource
  artifacts: FlightRecorderArtifacts
  faults: FlightRecorderFaultPreset[]
  trace: FlightTraceEntry[]
  summary: FlightRecorderSessionSummary
}

export type FlightRecorderSessionExport = FlightRecorderSessionV1

export type BuildFlightRecorderSessionInput =
  | {
      source: {
        mode: "qr"
        uri: string
      }
      targetMode: FlightRecorderTargetMode
      faults?: FlightRecorderFaultPreset[]
      options?: {
        includeInitialStatus?: boolean
      }
      origin: string
    }
  | {
      source: {
        mode: "mock"
        paymentId?: string
      }
      targetMode: FlightRecorderTargetMode
      faults?: FlightRecorderFaultPreset[]
      options?: {
        includeInitialStatus?: boolean
      }
      origin: string
    }

export interface ExecuteFlightRecorderStatusInput {
  session: FlightRecorderSessionV1
}

export interface ExecuteFlightRecorderPayInput {
  session: FlightRecorderSessionV1
  liveWriteArmed: boolean
}

export interface FlightRecorderRelayActionResult {
  trace: FlightTraceEntry
  body: PaymentStatusResponse | { error: RelayErrorCode; message: string } | null
}

export const isFlightRecorderFaultPreset = (value: unknown): value is FlightRecorderFaultPreset =>
  typeof value === "string" &&
  FLIGHT_RECORDER_FAULT_PRESETS.includes(value as FlightRecorderFaultPreset)

export const isFlightRecorderSimulatorFaultPreset = (
  value: unknown
): value is FlightRecorderSimulatorFaultPreset =>
  typeof value === "string" &&
  FLIGHT_RECORDER_SIMULATOR_FAULT_PRESETS.includes(value as FlightRecorderSimulatorFaultPreset)
