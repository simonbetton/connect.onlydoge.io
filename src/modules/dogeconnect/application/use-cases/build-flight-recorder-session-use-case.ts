import type { ConnectPaymentWire } from "../../domain/value-objects/connect-payment"
import { ConnectPayment } from "../../domain/value-objects/connect-payment"
import { DogeUri } from "../../domain/value-objects/doge-uri"
import type { TracedEnvelopeClientPort } from "../../ports/traced-envelope-client-port"
import type { TracedRelayClientPort } from "../../ports/traced-relay-client-port"
import type {
  BuildFlightRecorderSessionInput,
  FlightRecorderFaultPreset,
  FlightRecorderSessionV1,
  FlightRecorderTargetMode,
} from "../flight-recorder-contracts"
import { FLIGHT_RECORDER_SESSION_VERSION } from "../flight-recorder-contracts"
import {
  applyReadSafeFaults,
  createEmptyArtifacts,
  createTraceEntry,
  listIncompatibleFaultIssues,
  resolveSimulatorFault,
  summarizeFlightRecorderSession,
} from "../flight-recorder-session"
import type { GenerateMockQrUseCase } from "./generate-mock-qr-use-case"
import type { ValidatePaymentEnvelopeUseCase } from "./validate-payment-envelope-use-case"

export class BuildFlightRecorderSessionUseCase {
  constructor(
    private readonly generateMockQrUseCase: GenerateMockQrUseCase,
    private readonly validatePaymentEnvelopeUseCase: ValidatePaymentEnvelopeUseCase,
    private readonly envelopeClient: TracedEnvelopeClientPort,
    private readonly localRelayClient: TracedRelayClientPort,
    private readonly liveRelayClient: TracedRelayClientPort
  ) {}

  async execute(input: BuildFlightRecorderSessionInput): Promise<FlightRecorderSessionV1> {
    const now = new Date().toISOString()
    const faults = dedupeFaults(input.faults ?? [])
    const trace = []
    const artifacts = createEmptyArtifacts()

    const source =
      input.source.mode === "mock"
        ? this.generateMockQrUseCase.execute({
            paymentId: input.source.paymentId,
            origin: input.origin,
          })
        : {
            uri: input.source.uri,
            paymentId: "",
          }

    artifacts.qr.rawUri = source.uri

    const qrFaults = applyReadSafeFaults({
      rawUri: source.uri,
      expectedHash: "",
      envelope: null,
      payment: null,
      faults,
    })
    artifacts.qr.effectiveUri = qrFaults.rawUri

    const qrResult = DogeUri.parse(qrFaults.rawUri)
    const parsedQr = qrResult.value
    artifacts.qr.parsed = parsedQr
      ? {
          address: parsedQr.address,
          amount: parsedQr.amount,
          connectUrl: parsedQr.connectUrl,
          pubKeyHashBase64Url: parsedQr.pubKeyHash?.toBase64Url() ?? "",
          isConnectUri: parsedQr.isConnectUri,
        }
      : null

    trace.push(
      createTraceEntry({
        kind: "input",
        phase: "qr_parse",
        target: "session",
        verdict:
          !parsedQr || qrResult.issues.some((issue) => issue.severity === "error")
            ? "fail"
            : "pass",
        issues: qrResult.issues,
        requestSummary: {
          method: "LOCAL",
          endpoint: "session://qr",
          note: "Parsed the source Dogecoin URI into DogeConnect components.",
          body: { uri: qrFaults.rawUri },
        },
        responseSummary: {
          statusCode: 200,
          note: parsedQr ? "URI parsed successfully." : "URI parsing failed.",
          body: artifacts.qr.parsed,
        },
        artifactsChanged: ["qr.parsed"],
      })
    )

    if (!parsedQr || !parsedQr.isConnectUri) {
      const session = this.createSession({
        now,
        input,
        faults,
        trace,
        artifacts,
        sourcePaymentId: source.paymentId,
      })
      return session
    }

    const envelopeFetch =
      input.source.mode === "mock" && "envelope" in source
        ? {
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
                body: {
                  paymentId: source.paymentId,
                },
              },
              responseSummary: {
                statusCode: 200,
                note: "Mock envelope loaded from the fixture generator.",
                body: source.envelope,
              },
              artifactsChanged: ["envelope.raw"],
            }),
          }
        : await this.envelopeClient.fetchEnvelope({
            connectUrl: parsedQr.connectUrl,
          })
    trace.push(envelopeFetch.trace)

    const rawEnvelope = isRecord(envelopeFetch.envelope) ? envelopeFetch.envelope : null
    const faultedEnvelope = applyReadSafeFaults({
      rawUri: qrFaults.rawUri,
      expectedHash: parsedQr.pubKeyHash?.toBase64Url() ?? "",
      envelope: rawEnvelope,
      payment: null,
      faults,
    })

    artifacts.envelope.fetchedFrom = parsedQr.connectUrl
    artifacts.envelope.raw = faultedEnvelope.envelope

    const envelopeValidation = this.validatePaymentEnvelopeUseCase.execute({
      envelope: faultedEnvelope.envelope,
      expectedHash: faultedEnvelope.expectedHash || undefined,
    })
    artifacts.envelope.validation = envelopeValidation
    trace.push(
      createTraceEntry({
        kind: "validation",
        phase: "envelope_validate",
        target: "artifact",
        verdict: envelopeValidation.verdict === "valid" ? "pass" : "fail",
        issues: [...faultedEnvelope.issues, ...envelopeValidation.errors],
        requestSummary: {
          method: "LOCAL",
          endpoint: "session://envelope-validation",
          note: "Validated the fetched envelope signature and h binding.",
          body: {
            expectedHash: faultedEnvelope.expectedHash || "",
          },
        },
        responseSummary: {
          statusCode: 200,
          note:
            envelopeValidation.verdict === "valid"
              ? "Envelope passed validation."
              : "Envelope failed validation.",
          body: envelopeValidation,
        },
        artifactsChanged: ["envelope.validation"],
      })
    )

    const paymentRaw = isRecord(envelopeValidation.payment) ? envelopeValidation.payment : null
    const faultedPayment = applyReadSafeFaults({
      rawUri: qrFaults.rawUri,
      expectedHash: faultedEnvelope.expectedHash,
      envelope: faultedEnvelope.envelope,
      payment: paymentRaw,
      faults,
    })

    const paymentParse = ConnectPayment.parse(faultedPayment.payment)
    const timeoutIssues = buildPaymentTimeoutIssues(paymentParse.value?.wire)
    artifacts.payment.raw = faultedPayment.payment
    artifacts.payment.relay = paymentParse.value?.wire.relay ?? ""
    artifacts.payment.relayTokenPresent = Boolean(paymentParse.value?.wire.relay_token)
    artifacts.payment.timeout = paymentParse.value?.wire.timeout ?? null
    artifacts.payment.issued = paymentParse.value?.wire.issued ?? ""
    artifacts.payDraft = paymentParse.value
      ? {
          id: paymentParse.value.wire.id,
          tx: "deadbeef",
          refund: "",
          relay_token: paymentParse.value.wire.relay_token ?? "",
        }
      : null

    trace.push(
      createTraceEntry({
        kind: "validation",
        phase: "payment_decode",
        target: "artifact",
        verdict:
          paymentParse.issues.some((issue) => issue.severity === "error") ||
          timeoutIssues.length > 0
            ? "fail"
            : "pass",
        issues: [...faultedPayment.issues, ...paymentParse.issues, ...timeoutIssues],
        requestSummary: {
          method: "LOCAL",
          endpoint: "session://payment-decode",
          note: "Decoded and normalized the envelope payment payload.",
          body: null,
        },
        responseSummary: {
          statusCode: 200,
          note:
            paymentParse.value && timeoutIssues.length === 0
              ? "Payment payload decoded successfully."
              : "Payment payload failed validation.",
          body: faultedPayment.payment,
        },
        artifactsChanged: ["payment.raw", "payDraft"],
      })
    )

    const incompatibleFaults = listIncompatibleFaultIssues(input.targetMode, faults)
    const relay = buildRelayArtifact(input.targetMode, paymentParse.value?.wire, faults)
    artifacts.relay = {
      ...relay,
      liveWriteArmed: false,
    }

    trace.push(
      createTraceEntry({
        kind: "validation",
        phase: "relay_target",
        target: input.targetMode === "simulator" ? "local" : "remote",
        verdict: paymentParse.value ? (incompatibleFaults.length > 0 ? "warn" : "pass") : "fail",
        issues: incompatibleFaults,
        requestSummary: {
          method: "LOCAL",
          endpoint: "session://relay-target",
          note: "Derived pay and status endpoints from the payment relay field.",
          body: {
            targetMode: input.targetMode,
          },
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
    )

    const session = this.createSession({
      now,
      input,
      faults,
      trace,
      artifacts,
      sourcePaymentId: source.paymentId || paymentParse.value?.wire.id || "",
    })

    if (
      input.options?.includeInitialStatus !== false &&
      session.artifacts.relay &&
      session.artifacts.payDraft
    ) {
      const client =
        session.artifacts.relay.mode === "simulator" ? this.localRelayClient : this.liveRelayClient
      const statusResult = await client.getStatus({
        session,
        relay: session.artifacts.relay,
      })
      session.trace.push(statusResult.trace)
      session.summary = summarizeFlightRecorderSession(session.trace)
      session.meta.updatedAt = new Date().toISOString()
    }

    return session
  }

  private createSession(input: {
    now: string
    input: BuildFlightRecorderSessionInput
    faults: FlightRecorderFaultPreset[]
    trace: ReturnType<typeof createTraceEntry>[]
    artifacts: ReturnType<typeof createEmptyArtifacts>
    sourcePaymentId: string
  }): FlightRecorderSessionV1 {
    return {
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
    }
  }
}

const buildRelayArtifact = (
  targetMode: FlightRecorderTargetMode,
  payment: ConnectPaymentWire | undefined,
  faults: FlightRecorderFaultPreset[]
) => {
  const sourceRelayUrl = payment?.relay ?? ""
  const simulatorScenario = resolveSimulatorFault(faults)

  if (targetMode === "simulator") {
    return {
      mode: "simulator" as const,
      sourceRelayUrl,
      payUrl: "/api/relay/pay",
      statusUrl: "/api/relay/status",
      simulatorScenario,
    }
  }

  const payUrl = sourceRelayUrl.endsWith("/pay")
    ? sourceRelayUrl
    : sourceRelayUrl.endsWith("/status")
      ? `${sourceRelayUrl.slice(0, -"/status".length)}/pay`
      : `${sourceRelayUrl.replace(/\/$/, "")}/pay`

  const statusUrl = sourceRelayUrl.endsWith("/status")
    ? sourceRelayUrl
    : sourceRelayUrl.endsWith("/pay")
      ? `${sourceRelayUrl.slice(0, -"/pay".length)}/status`
      : `${sourceRelayUrl.replace(/\/$/, "")}/status`

  return {
    mode: "live" as const,
    sourceRelayUrl,
    payUrl,
    statusUrl,
    simulatorScenario,
  }
}

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null
