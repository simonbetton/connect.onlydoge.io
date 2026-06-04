import type { ValidationIssue } from "../domain/shared/validation"
import { validationError, validationWarning } from "../domain/shared/validation"
import {
  FLIGHT_RECORDER_EXPORT_MODES,
  FLIGHT_RECORDER_SESSION_VERSION,
  FLIGHT_RECORDER_SIMULATOR_FAULT_PRESETS,
  FLIGHT_RECORDER_TARGET_MODES,
  FLIGHT_TRACE_KINDS,
  FLIGHT_TRACE_PHASES,
  FLIGHT_TRACE_TARGETS,
  FLIGHT_TRACE_VERDICTS,
  type FlightRecorderArtifacts,
  type FlightRecorderExportMode,
  type FlightRecorderFaultPreset,
  type FlightRecorderSessionExport,
  type FlightRecorderSessionSummary,
  type FlightRecorderSessionV1,
  type FlightRecorderSimulatorFaultPreset,
  type FlightTraceEntry,
  type FlightTraceKind,
  type FlightTracePhase,
  type FlightTraceResponseSummary,
  type FlightTraceTarget,
  type FlightTraceVerdict,
} from "./flight-recorder-contracts"

const REDACTED = "[redacted]"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string")

export const createTraceEntry = (input: {
  id?: string
  kind: FlightTraceKind
  phase: FlightTracePhase
  target: FlightTraceTarget
  startedAt?: string
  endedAt?: string
  durationMs?: number
  verdict: FlightTraceVerdict
  issues?: ValidationIssue[]
  requestSummary?: Partial<FlightTraceEntry["requestSummary"]>
  responseSummary?: Partial<FlightTraceResponseSummary>
  artifactsChanged?: string[]
}): FlightTraceEntry => {
  const startedAt = input.startedAt ?? new Date().toISOString()
  const endedAt = input.endedAt ?? startedAt

  return {
    id: input.id ?? createTraceId(input.phase),
    kind: input.kind,
    phase: input.phase,
    target: input.target,
    startedAt,
    endedAt,
    durationMs: input.durationMs ?? 0,
    verdict: input.verdict,
    issues: input.issues ?? [],
    requestSummary: {
      method: input.requestSummary?.method ?? "LOCAL",
      endpoint: input.requestSummary?.endpoint ?? "session://flight-recorder",
      note: input.requestSummary?.note ?? "",
      body: input.requestSummary?.body ?? null,
    },
    responseSummary: {
      statusCode: input.responseSummary?.statusCode ?? null,
      note: input.responseSummary?.note ?? "",
      body: input.responseSummary?.body ?? null,
    },
    artifactsChanged: input.artifactsChanged ?? [],
  }
}

export const createEmptyArtifacts = (): FlightRecorderArtifacts => ({
  qr: {
    rawUri: "",
    effectiveUri: "",
    parsed: null,
  },
  envelope: {
    fetchedFrom: "",
    raw: null,
    validation: null,
  },
  payment: {
    raw: null,
    relay: "",
    relayTokenPresent: false,
    timeout: null,
    issued: "",
  },
  relay: null,
  payDraft: null,
})

export const summarizeFlightRecorderSession = (
  trace: FlightTraceEntry[]
): FlightRecorderSessionSummary => {
  const firstFailing = trace.find((entry) => entry.verdict === "fail")
  const firstWarning = trace.find((entry) => entry.verdict === "warn")

  if (firstFailing) {
    return {
      verdict: "fail",
      firstFailingStep: firstFailing.phase,
      likelyCauses: deriveLikelyCauses(firstFailing),
    }
  }

  if (firstWarning) {
    return {
      verdict: "warn",
      firstFailingStep: firstWarning.phase,
      likelyCauses: deriveLikelyCauses(firstWarning),
    }
  }

  return {
    verdict: "pass",
    firstFailingStep: "",
    likelyCauses: ["No protocol or relay mismatches were detected in this session."],
  }
}

export const exportFlightRecorderSession = (
  session: FlightRecorderSessionV1,
  mode: FlightRecorderExportMode
): FlightRecorderSessionExport => {
  const cloned = cloneJson(session)
  if (mode === "full") {
    cloned.meta.exportMode = "full"
    return cloned
  }

  const sanitized = sanitizeValue(cloned) as FlightRecorderSessionExport
  sanitized.meta.exportMode = "sanitized"
  if (sanitized.artifacts.payDraft) {
    sanitized.artifacts.payDraft.tx = REDACTED
    sanitized.artifacts.payDraft.refund = sanitized.artifacts.payDraft.refund ? REDACTED : ""
    sanitized.artifacts.payDraft.relay_token = sanitized.artifacts.payDraft.relay_token
      ? REDACTED
      : ""
  }
  if (sanitized.artifacts.payment.raw && "relay_token" in sanitized.artifacts.payment.raw) {
    sanitized.artifacts.payment.raw.relay_token = REDACTED
  }
  return sanitized
}

export const parseImportedFlightRecorderSession = (
  value: unknown
): { value: FlightRecorderSessionV1 | null; issues: ValidationIssue[] } => {
  const issues: ValidationIssue[] = []

  if (!isRecord(value)) {
    return {
      value: null,
      issues: [validationError("session", "must be an object")],
    }
  }

  if (value.version !== FLIGHT_RECORDER_SESSION_VERSION) {
    issues.push(validationError("version", "unsupported session version"))
  }

  if (!isRecord(value.meta)) {
    issues.push(validationError("meta", "required"))
  } else {
    if (!FLIGHT_RECORDER_EXPORT_MODES.includes(value.meta.exportMode as FlightRecorderExportMode)) {
      issues.push(validationError("meta.exportMode", "invalid export mode"))
    }
    if (
      !FLIGHT_RECORDER_TARGET_MODES.includes(
        value.meta.targetMode as FlightRecorderSessionV1["meta"]["targetMode"]
      )
    ) {
      issues.push(validationError("meta.targetMode", "invalid target mode"))
    }
  }

  if (!Array.isArray(value.trace)) {
    issues.push(validationError("trace", "must be an array"))
  } else {
    value.trace.forEach((entry, index) => {
      if (!isRecord(entry)) {
        issues.push(validationError(`trace[${index}]`, "must be an object"))
        return
      }
      if (!FLIGHT_TRACE_KINDS.includes(entry.kind as FlightTraceKind)) {
        issues.push(validationError(`trace[${index}].kind`, "invalid trace kind"))
      }
      if (!FLIGHT_TRACE_PHASES.includes(entry.phase as FlightTracePhase)) {
        issues.push(validationError(`trace[${index}].phase`, "invalid trace phase"))
      }
      if (!FLIGHT_TRACE_TARGETS.includes(entry.target as FlightTraceTarget)) {
        issues.push(validationError(`trace[${index}].target`, "invalid trace target"))
      }
      if (!FLIGHT_TRACE_VERDICTS.includes(entry.verdict as FlightTraceVerdict)) {
        issues.push(validationError(`trace[${index}].verdict`, "invalid trace verdict"))
      }
    })
  }

  if (!isStringArray(value.faults)) {
    issues.push(validationError("faults", "must be an array of strings"))
  }

  if (issues.length > 0) {
    return {
      value: null,
      issues,
    }
  }

  const session = cloneJson(value) as unknown as FlightRecorderSessionV1
  session.meta.updatedAt =
    session.meta.updatedAt || session.meta.createdAt || new Date().toISOString()
  return {
    value: session,
    issues: [],
  }
}

export const resolveSimulatorFault = (
  faults: FlightRecorderFaultPreset[]
): FlightRecorderSimulatorFaultPreset | null =>
  faults.find((fault) =>
    FLIGHT_RECORDER_SIMULATOR_FAULT_PRESETS.includes(fault as FlightRecorderSimulatorFaultPreset)
  ) as FlightRecorderSimulatorFaultPreset | null

export const listIncompatibleFaultIssues = (
  targetMode: FlightRecorderSessionV1["meta"]["targetMode"],
  faults: FlightRecorderFaultPreset[]
): ValidationIssue[] => {
  if (targetMode === "simulator") {
    return []
  }

  return faults
    .filter((fault) => FLIGHT_RECORDER_SIMULATOR_FAULT_PRESETS.includes(fault as never))
    .map((fault) =>
      validationWarning("faults", `${fault} is simulator-only and will be ignored for live targets`)
    )
}

export const applyReadSafeFaults = (input: {
  rawUri: string
  expectedHash: string
  envelope: Record<string, unknown> | null
  payment: Record<string, unknown> | null
  faults: FlightRecorderFaultPreset[]
}): {
  rawUri: string
  expectedHash: string
  envelope: Record<string, unknown> | null
  payment: Record<string, unknown> | null
  issues: ValidationIssue[]
} => {
  let rawUri = input.rawUri
  let expectedHash = input.expectedHash
  const envelope = input.envelope ? cloneJson(input.envelope) : null
  const payment = input.payment ? cloneJson(input.payment) : null
  const issues: ValidationIssue[] = []

  const params = readDogeUriParams(rawUri)

  if (input.faults.includes("missing_hash")) {
    params.delete("h")
    rawUri = buildDogeUri(rawUri, params)
    expectedHash = ""
    issues.push(validationWarning("faults", "Preset removed the URI h parameter"))
  } else if (input.faults.includes("wrong_hash")) {
    const nextHash = expectedHash ? `${expectedHash.slice(0, -1)}x` : "wrong-hash-value"
    params.set("h", nextHash)
    rawUri = buildDogeUri(rawUri, params)
    expectedHash = nextHash
    issues.push(validationWarning("faults", "Preset changed the URI h parameter"))
  }

  if (envelope && input.faults.includes("bad_signature") && typeof envelope.sig === "string") {
    envelope.sig = `${envelope.sig.slice(0, -2)}aa`
    issues.push(validationWarning("faults", "Preset tampered with the envelope signature"))
  }

  if (envelope && input.faults.includes("bad_pubkey_hash") && typeof envelope.pubkey === "string") {
    envelope.pubkey = envelope.pubkey.replace(/^../, "ff")
    issues.push(validationWarning("faults", "Preset tampered with the envelope pubkey"))
  }

  if (payment && input.faults.includes("expired_timeout")) {
    payment.issued = "2020-01-01T00:00:00Z"
    payment.timeout = 1
    issues.push(validationWarning("faults", "Preset expired the payment timeout locally"))
  }

  if (payment && input.faults.includes("missing_relay_token")) {
    payment.relay_token = ""
    issues.push(validationWarning("faults", "Preset removed relay_token from the payment artifact"))
  }

  return {
    rawUri,
    expectedHash,
    envelope,
    payment,
    issues,
  }
}

const deriveLikelyCauses = (entry: FlightTraceEntry): string[] => {
  if (entry.issues.length > 0) {
    return entry.issues.map((issue) => `${issue.field}: ${issue.message}`)
  }

  if (entry.responseSummary.note) {
    return [entry.responseSummary.note]
  }

  return [`Failure during ${entry.phase.replaceAll("_", " ")}`]
}

const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry))
  }

  if (!isRecord(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (/(token|authorization|secret|password)$/i.test(key)) {
        return [key, entryValue ? REDACTED : entryValue]
      }

      if (key === "tx" || key === "refund") {
        return [key, entryValue ? REDACTED : entryValue]
      }

      return [key, sanitizeValue(entryValue)]
    })
  )
}

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const createTraceId = (phase: string): string =>
  `${phase}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const readDogeUriParams = (rawUri: string): URLSearchParams => {
  const queryIndex = rawUri.indexOf("?")
  if (queryIndex === -1) {
    return new URLSearchParams()
  }

  return new URLSearchParams(rawUri.slice(queryIndex + 1))
}

const buildDogeUri = (rawUri: string, params: URLSearchParams): string => {
  const queryIndex = rawUri.indexOf("?")
  const base = queryIndex === -1 ? rawUri : rawUri.slice(0, queryIndex)
  const nextQuery = params.toString()
  return nextQuery ? `${base}?${nextQuery}` : base
}
