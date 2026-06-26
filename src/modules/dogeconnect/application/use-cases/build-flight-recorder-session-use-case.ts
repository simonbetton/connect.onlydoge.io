import { isRecord } from "../../domain/shared/wire-field-parsing"
import type { ConnectPaymentWire } from "../../domain/value-objects/connect-payment"
import { ConnectPayment } from "../../domain/value-objects/connect-payment"
import { DogeUri, isDogeConnectUri } from "../../domain/value-objects/doge-uri"
import { encodeRelayPubKeyHashBase64Url } from "../../domain/value-objects/relay-pub-key-hash"
import type { TracedEnvelopeClientPort } from "../../ports/traced-envelope-client-port"
import type { TracedRelayClientPort } from "../../ports/traced-relay-client-port"
import type {
  BuildFlightRecorderSessionInput,
  FlightRecorderFaultPreset,
  FlightRecorderSessionV1,
} from "../flight-recorder-contracts"
import { FLIGHT_RECORDER_SESSION_VERSION } from "../flight-recorder-contracts"
import {
  applyReadSafeFaults,
  createEmptyArtifacts,
  createTraceEntry,
  deriveFlightRecorderRelayTarget,
  listIncompatibleFaultIssues,
  summarizeFlightRecorderSession,
} from "../flight-recorder-session"
import type { GenerateMockQrUseCase } from "./generate-mock-qr-use-case"
import type { ValidatePaymentEnvelopeUseCase } from "./validate-payment-envelope-use-case"

interface BuildFlightRecorderSessionDependencies {
  generateMockQrUseCase: GenerateMockQrUseCase
  validatePaymentEnvelopeUseCase: ValidatePaymentEnvelopeUseCase
  envelopeClient: TracedEnvelopeClientPort
  localRelayClient: TracedRelayClientPort
  liveRelayClient: TracedRelayClientPort
}

type SessionArtifacts = ReturnType<typeof createEmptyArtifacts>
type SessionTrace = ReturnType<typeof createTraceEntry>[]

export const createBuildFlightRecorderSessionUseCase = (
  dependencies: BuildFlightRecorderSessionDependencies
) => ({
  execute: (input: BuildFlightRecorderSessionInput) =>
    buildFlightRecorderSession(dependencies, input),
})

export type BuildFlightRecorderSessionUseCase = ReturnType<
  typeof createBuildFlightRecorderSessionUseCase
>

const buildFlightRecorderSession = async (
  dependencies: BuildFlightRecorderSessionDependencies,
  input: BuildFlightRecorderSessionInput
): Promise<FlightRecorderSessionV1> => {
  const now = new Date().toISOString()
  const faults = dedupeFaults(input.faults ?? [])
  const trace: SessionTrace = []
  const artifacts = createEmptyArtifacts()

  const source = resolveSessionSource(dependencies, input)
  artifacts.qr.rawUri = source.uri

  const qrFaults = applyReadSafeFaults({
    rawUri: source.uri,
    expectedHash: "",
    envelope: null,
    payment: null,
    faults,
  })
  artifacts.qr.effectiveUri = qrFaults.rawUri

  const qrPhase = runQrParsePhase(qrFaults.rawUri, qrResultIssues(qrFaults.rawUri))
  artifacts.qr.parsed = qrPhase.parsed
  trace.push(qrPhase.trace)

  const parsedQr = qrPhase.parsedQr
  if (!parsedQr || !isDogeConnectUri(parsedQr)) {
    return createFlightRecorderSession({
      now,
      input,
      faults,
      trace,
      artifacts,
      sourcePaymentId: source.paymentId,
    })
  }

  const envelopePhase = await runEnvelopeFetchPhase(dependencies, input, source, parsedQr)
  trace.push(envelopePhase.trace)

  const rawEnvelope = isRecord(envelopePhase.envelope) ? envelopePhase.envelope : null
  const faultedEnvelope = applyReadSafeFaults({
    rawUri: qrFaults.rawUri,
    expectedHash: parsedQr.pubKeyHash ? encodeRelayPubKeyHashBase64Url(parsedQr.pubKeyHash) : "",
    envelope: rawEnvelope,
    payment: null,
    faults,
  })

  artifacts.envelope.fetchedFrom = parsedQr.connectUrl
  artifacts.envelope.raw = faultedEnvelope.envelope

  const envelopeValidatePhase = runEnvelopeValidatePhase(dependencies, faultedEnvelope)
  artifacts.envelope.validation = envelopeValidatePhase.validation
  trace.push(envelopeValidatePhase.trace)

  const paymentPhase = runPaymentDecodePhase(
    envelopeValidatePhase.validation,
    faultedEnvelope,
    qrFaults.rawUri,
    faults
  )
  artifacts.payment.raw = paymentPhase.paymentRaw
  artifacts.payment.relay = paymentPhase.relay
  artifacts.payment.relayTokenPresent = paymentPhase.relayTokenPresent
  artifacts.payment.timeout = paymentPhase.timeout
  artifacts.payment.issued = paymentPhase.issued
  artifacts.payDraft = paymentPhase.payDraft
  trace.push(paymentPhase.trace)

  const relayPhase = runRelayTargetPhase(input, faults, paymentPhase.paymentParse)
  artifacts.relay = relayPhase.relay
  trace.push(relayPhase.trace)

  const session = createFlightRecorderSession({
    now,
    input,
    faults,
    trace,
    artifacts,
    sourcePaymentId: source.paymentId || paymentPhase.paymentParse.value?.wire.id || "",
  })

  return appendInitialRelayStatus(dependencies, session, input)
}

const resolveSessionSource = (
  dependencies: BuildFlightRecorderSessionDependencies,
  input: BuildFlightRecorderSessionInput
) =>
  input.source.mode === "mock"
    ? dependencies.generateMockQrUseCase.execute({
        paymentId: input.source.paymentId,
        origin: input.origin,
      })
    : {
        uri: input.source.uri,
        paymentId: "",
      }

const qrResultIssues = (rawUri: string) => DogeUri.parse(rawUri)

const runQrParsePhase = (rawUri: string, qrResult: ReturnType<typeof DogeUri.parse>) => {
  const parsedQr = qrResult.value
  const parsed = parsedQr
    ? {
        address: parsedQr.address,
        amount: parsedQr.amount,
        connectUrl: parsedQr.connectUrl,
        pubKeyHashBase64Url: parsedQr.pubKeyHash
          ? encodeRelayPubKeyHashBase64Url(parsedQr.pubKeyHash)
          : "",
        isConnectUri: isDogeConnectUri(parsedQr),
      }
    : null

  const trace = createTraceEntry({
    kind: "input",
    phase: "qr_parse",
    target: "session",
    verdict:
      !parsedQr || qrResult.issues.some((issue) => issue.severity === "error") ? "fail" : "pass",
    issues: qrResult.issues,
    requestSummary: {
      method: "LOCAL",
      endpoint: "session://qr",
      note: "Parsed the source Dogecoin URI into DogeConnect components.",
      body: { uri: rawUri },
    },
    responseSummary: {
      statusCode: 200,
      note: parsedQr ? "URI parsed successfully." : "URI parsing failed.",
      body: parsed,
    },
    artifactsChanged: ["qr.parsed"],
  })

  return { parsedQr, parsed, trace }
}

const runEnvelopeFetchPhase = async (
  dependencies: BuildFlightRecorderSessionDependencies,
  input: BuildFlightRecorderSessionInput,
  source: { uri: string; paymentId: string; envelope?: unknown },
  parsedQr: NonNullable<ReturnType<typeof DogeUri.parse>["value"]>
) => {
  if (input.source.mode === "mock" && "envelope" in source) {
    return {
      envelope: source.envelope,
      trace: createTraceEntry({
        kind: "network",
        phase: "envelope_fetch",
        target: "local",
        verdict: "pass",
        requestSummary: {
          method: "LOCAL",
          endpoint: "session://mock-envelope",
          note: "Loaded the generated mock envelope directly from the fixture generator.",
          body: { paymentId: source.paymentId },
        },
        responseSummary: {
          statusCode: 200,
          note: "Mock envelope loaded from the fixture generator.",
          body: source.envelope,
        },
        artifactsChanged: ["envelope.raw"],
      }),
    }
  }

  const envelopeFetch = await dependencies.envelopeClient.fetchEnvelope({
    connectUrl: parsedQr.connectUrl,
  })

  return {
    envelope: envelopeFetch.envelope,
    trace: envelopeFetch.trace,
  }
}

const runEnvelopeValidatePhase = (
  dependencies: BuildFlightRecorderSessionDependencies,
  faultedEnvelope: ReturnType<typeof applyReadSafeFaults>
) => {
  const validation = dependencies.validatePaymentEnvelopeUseCase.execute({
    envelope: faultedEnvelope.envelope,
    expectedHash: faultedEnvelope.expectedHash || undefined,
  })

  const trace = createTraceEntry({
    kind: "validation",
    phase: "envelope_validate",
    target: "artifact",
    verdict: validation.verdict === "valid" ? "pass" : "fail",
    issues: [...faultedEnvelope.issues, ...validation.errors],
    requestSummary: {
      method: "LOCAL",
      endpoint: "session://envelope-validation",
      note: "Validated the fetched envelope signature and h binding.",
      body: { expectedHash: faultedEnvelope.expectedHash || "" },
    },
    responseSummary: {
      statusCode: 200,
      note:
        validation.verdict === "valid"
          ? "Envelope passed validation."
          : "Envelope failed validation.",
      body: validation,
    },
    artifactsChanged: ["envelope.validation"],
  })

  return { validation, trace }
}

const runPaymentDecodePhase = (
  envelopeValidation: ReturnType<ValidatePaymentEnvelopeUseCase["execute"]>,
  faultedEnvelope: ReturnType<typeof applyReadSafeFaults>,
  rawUri: string,
  faults: FlightRecorderFaultPreset[]
) => {
  const faultedPayment = applyReadSafeFaults({
    rawUri,
    expectedHash: faultedEnvelope.expectedHash,
    envelope: faultedEnvelope.envelope,
    payment: isRecord(envelopeValidation.payment) ? envelopeValidation.payment : null,
    faults,
  })

  const paymentParse = ConnectPayment.parse(faultedPayment.payment)
  const timeoutIssues = buildPaymentTimeoutIssues(paymentParse.value?.wire)
  const paymentFailed =
    paymentParse.issues.some((issue) => issue.severity === "error") || timeoutIssues.length > 0

  return {
    paymentParse,
    paymentRaw: faultedPayment.payment,
    relay: paymentParse.value?.wire.relay ?? "",
    relayTokenPresent: Boolean(paymentParse.value?.wire.relay_token),
    timeout: paymentParse.value?.wire.timeout ?? null,
    issued: paymentParse.value?.wire.issued ?? "",
    payDraft: buildPayDraftArtifact(paymentParse.value),
    trace: createPaymentDecodeTrace(faultedPayment, paymentParse, timeoutIssues, paymentFailed),
  }
}

const buildPayDraftArtifact = (payment: ConnectPayment | null | undefined) =>
  payment
    ? {
        id: payment.wire.id,
        tx: "deadbeef",
        refund: "",
        relay_token: payment.wire.relay_token ?? "",
      }
    : null

const createPaymentDecodeTrace = (
  faultedPayment: ReturnType<typeof applyReadSafeFaults>,
  paymentParse: ReturnType<typeof ConnectPayment.parse>,
  timeoutIssues: ReturnType<typeof buildPaymentTimeoutIssues>,
  paymentFailed: boolean
) =>
  createTraceEntry({
    kind: "validation",
    phase: "payment_decode",
    target: "artifact",
    verdict: paymentFailed ? "fail" : "pass",
    issues: [...faultedPayment.issues, ...paymentParse.issues, ...timeoutIssues],
    requestSummary: {
      method: "LOCAL",
      endpoint: "session://payment-decode",
      note: "Decoded and normalized the envelope payment payload.",
      body: null,
    },
    responseSummary: {
      statusCode: 200,
      note: paymentFailed
        ? "Payment payload failed validation."
        : "Payment payload decoded successfully.",
      body: faultedPayment.payment,
    },
    artifactsChanged: ["payment.raw", "payDraft"],
  })

const runRelayTargetPhase = (
  input: BuildFlightRecorderSessionInput,
  faults: FlightRecorderFaultPreset[],
  paymentParse: ReturnType<typeof ConnectPayment.parse>
) => {
  const incompatibleFaults = listIncompatibleFaultIssues(input.targetMode, faults)
  const relay = deriveFlightRecorderRelayTarget({
    targetMode: input.targetMode,
    sourceRelayUrl: paymentParse.value?.wire.relay,
    faults,
  })

  const trace = createTraceEntry({
    kind: "validation",
    phase: "relay_target",
    target: input.targetMode === "simulator" ? "local" : "remote",
    verdict: paymentParse.value ? (incompatibleFaults.length > 0 ? "warn" : "pass") : "fail",
    issues: incompatibleFaults,
    requestSummary: {
      method: "LOCAL",
      endpoint: "session://relay-target",
      note: "Derived pay and status endpoints from the payment relay field.",
      body: { targetMode: input.targetMode },
    },
    responseSummary: {
      statusCode: 200,
      note: paymentParse.value
        ? "Relay target resolved successfully."
        : "Relay target could not be derived without a valid payment.",
      body: relay,
    },
    artifactsChanged: ["relay"],
  })

  return {
    relay: {
      ...relay,
      liveWriteArmed: false,
    },
    trace,
  }
}

const appendInitialRelayStatus = async (
  dependencies: BuildFlightRecorderSessionDependencies,
  session: FlightRecorderSessionV1,
  input: BuildFlightRecorderSessionInput
): Promise<FlightRecorderSessionV1> => {
  if (
    input.options?.includeInitialStatus === false ||
    !session.artifacts.relay ||
    !session.artifacts.payDraft
  ) {
    return session
  }

  const client =
    session.meta.targetMode === "simulator"
      ? dependencies.localRelayClient
      : dependencies.liveRelayClient
  const statusResult = await client.getStatus({
    session,
    relay: session.artifacts.relay,
  })
  session.trace.push(statusResult.trace)
  session.summary = summarizeFlightRecorderSession(session.trace)
  session.meta.updatedAt = new Date().toISOString()
  return session
}

const createFlightRecorderSession = (input: {
  now: string
  input: BuildFlightRecorderSessionInput
  faults: FlightRecorderFaultPreset[]
  trace: SessionTrace
  artifacts: SessionArtifacts
  sourcePaymentId: string
}): FlightRecorderSessionV1 => ({
  version: FLIGHT_RECORDER_SESSION_VERSION,
  meta: {
    createdAt: input.now,
    updatedAt: input.now,
    sourceMode: input.input.source.mode,
    targetMode: input.input.targetMode,
    exportMode: "sanitized",
  },
  source: {
    mode: input.input.source.mode,
    uri: input.artifacts.qr.rawUri,
    paymentId: input.sourcePaymentId,
    origin: input.input.origin,
    imported: false,
  },
  artifacts: input.artifacts,
  faults: input.faults,
  trace: input.trace,
  summary: summarizeFlightRecorderSession(input.trace),
})

const buildPaymentTimeoutIssues = (payment: ConnectPaymentWire | undefined) => {
  if (!payment?.issued || !payment?.timeout) {
    return []
  }

  const issued = Date.parse(payment.issued)
  if (!Number.isFinite(issued)) {
    return []
  }

  if (issued + payment.timeout * 1000 >= Date.now()) {
    return []
  }

  return [
    {
      field: "timeout",
      message: "Payment timeout has already expired",
      severity: "error" as const,
    },
  ]
}

const dedupeFaults = (faults: FlightRecorderFaultPreset[]): FlightRecorderFaultPreset[] =>
  Array.from(new Set(faults))
