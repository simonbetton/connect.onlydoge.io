import type { FlightRecorderRelayActionResult } from "../../application/flight-recorder-contracts"
import { createTraceEntry } from "../../application/flight-recorder-session"
import type { RegisterRelayScenarioUseCase } from "../../application/use-cases/register-relay-scenario-use-case"
import type { RelayPayUseCase } from "../../application/use-cases/relay-pay-use-case"
import type { RelayStatusUseCase } from "../../application/use-cases/relay-status-use-case"
import type { RelayStateStorePort } from "../../ports/relay-state-store-port"
import type {
  TracedRelayClientPort,
  TracedRelayPayInput,
  TracedRelayStatusInput,
} from "../../ports/traced-relay-client-port"

export const createLocalFlightRecorderRelayClient = (
  registerRelayScenarioUseCase: RegisterRelayScenarioUseCase,
  relayPayUseCase: RelayPayUseCase,
  relayStatusUseCase: RelayStatusUseCase,
  store: RelayStateStorePort
): TracedRelayClientPort => ({
  getStatus: (input) =>
    localRelayGetStatus(input, registerRelayScenarioUseCase, relayStatusUseCase, store),
  pay: (input) => localRelayPay(input, registerRelayScenarioUseCase, relayPayUseCase, store),
})

const localRelayGetStatus = async (
  input: TracedRelayStatusInput,
  registerRelayScenarioUseCase: RegisterRelayScenarioUseCase,
  relayStatusUseCase: RelayStatusUseCase,
  store: RelayStateStorePort
): Promise<FlightRecorderRelayActionResult> => {
  const startedAt = new Date().toISOString()
  const started = Date.now()
  const paymentId = input.session.artifacts.payDraft?.id || input.session.source.paymentId

  await ensureRegistration(input.session, paymentId, registerRelayScenarioUseCase, store)
  await maybeConfirmDelayedScenario(input.session, paymentId, store)

  const result = await relayStatusUseCase.execute({ id: paymentId })

  return {
    body: result.body,
    trace: createTraceEntry({
      kind: "execution",
      phase: "relay_status",
      target: "local",
      startedAt,
      endedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      verdict: result.ok ? "pass" : "fail",
      issues: result.ok
        ? []
        : [{ field: "relay", message: result.body.message, severity: "error" }],
      requestSummary: {
        method: "POST",
        endpoint: "/api/relay/status",
        note: "Read current status from the local simulator.",
        body: { id: paymentId },
      },
      responseSummary: {
        statusCode: result.statusCode,
        note: result.ok ? "Simulator status fetched successfully." : result.body.message,
        body: result.body,
      },
    }),
  }
}

const localRelayPay = async (
  input: TracedRelayPayInput,
  registerRelayScenarioUseCase: RegisterRelayScenarioUseCase,
  relayPayUseCase: RelayPayUseCase,
  store: RelayStateStorePort
): Promise<FlightRecorderRelayActionResult> => {
  const startedAt = new Date().toISOString()
  const started = Date.now()

  await ensureRegistration(input.session, input.submission.id, registerRelayScenarioUseCase, store)

  const result = await relayPayUseCase.execute(input.submission)

  return {
    body: result.body,
    trace: createTraceEntry({
      kind: "execution",
      phase: "relay_pay",
      target: "local",
      startedAt,
      endedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      verdict: result.ok ? "pass" : "fail",
      issues: result.ok
        ? []
        : [{ field: "relay", message: result.body.message, severity: "error" }],
      requestSummary: {
        method: "POST",
        endpoint: "/api/relay/pay",
        note: "Submitted the current pay draft to the local simulator.",
        body: input.submission,
      },
      responseSummary: {
        statusCode: result.statusCode,
        note: result.ok ? "Simulator pay flow executed successfully." : result.body.message,
        body: result.body,
      },
    }),
  }
}

const ensureRegistration = async (
  session: TracedRelayStatusInput["session"],
  paymentId: string,
  registerRelayScenarioUseCase: RegisterRelayScenarioUseCase,
  store: RelayStateStorePort
) => {
  const existing = await store.getById(paymentId)
  if (existing) {
    return
  }

  const scenario = session.artifacts.relay?.simulatorScenario
  const result = await registerRelayScenarioUseCase.execute({
    id: paymentId,
    scenario: resolveSimulatorScenario(scenario ?? undefined),
    relayToken: session.artifacts.payDraft?.relay_token || undefined,
    required: 6,
    dueSec: scenario === "simulator_delayed_confirmation" ? 90 : 600,
    reason: resolveSimulatorReason(scenario ?? undefined),
  })

  if (!result.ok) {
    throw new Error(result.errors.map((issue) => issue.message).join("; "))
  }
}

const resolveSimulatorScenario = (
  scenario: string | undefined
): "accepted" | "confirmed" | "declined" | "error" => {
  if (scenario === "simulator_confirmed") {
    return "confirmed"
  }
  if (scenario === "simulator_declined") {
    return "declined"
  }
  if (scenario === "simulator_error") {
    return "error"
  }
  return "accepted"
}

const resolveSimulatorReason = (scenario: string | undefined) => {
  if (scenario === "simulator_declined") {
    return "Declined by Flight Recorder preset"
  }
  if (scenario === "simulator_error") {
    return "Rejected by Flight Recorder preset"
  }
  return undefined
}

const maybeConfirmDelayedScenario = async (
  session: TracedRelayStatusInput["session"],
  paymentId: string,
  store: RelayStateStorePort
) => {
  if (session.artifacts.relay?.simulatorScenario !== "simulator_delayed_confirmation") {
    return
  }

  const existing = await store.getById(paymentId)
  if (existing?.status !== "accepted") {
    return
  }

  const lastPayIndex = findLastTraceIndex(session, "relay_pay")
  if (lastPayIndex === -1) {
    return
  }

  const priorStatusChecks = session.trace
    .slice(lastPayIndex + 1)
    .filter((entry) => entry.phase === "relay_status").length

  if (priorStatusChecks < 1) {
    return
  }

  const now = new Date().toISOString()
  await store.upsert({
    ...existing,
    status: "confirmed",
    confirmed: existing.required,
    dueSec: 0,
    confirmedAt: now,
    updatedAt: now,
  })
}

const findLastTraceIndex = (
  session: TracedRelayStatusInput["session"],
  phase: "relay_pay" | "relay_status"
): number => {
  for (let index = session.trace.length - 1; index >= 0; index -= 1) {
    if (session.trace[index]?.phase === phase) {
      return index
    }
  }

  return -1
}
