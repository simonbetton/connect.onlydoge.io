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

export class LocalFlightRecorderRelayClient implements TracedRelayClientPort {
  constructor(
    private readonly registerRelayScenarioUseCase: RegisterRelayScenarioUseCase,
    private readonly relayPayUseCase: RelayPayUseCase,
    private readonly relayStatusUseCase: RelayStatusUseCase,
    private readonly store: RelayStateStorePort
  ) {}

  async getStatus(input: TracedRelayStatusInput): Promise<FlightRecorderRelayActionResult> {
    const startedAt = new Date().toISOString()
    const started = Date.now()
    const paymentId = input.session.artifacts.payDraft?.id || input.session.source.paymentId

    await this.ensureRegistration(input.session, paymentId)
    await this.maybeConfirmDelayedScenario(input.session, paymentId)

    const result = await this.relayStatusUseCase.execute({ id: paymentId })

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

  async pay(input: TracedRelayPayInput): Promise<FlightRecorderRelayActionResult> {
    const startedAt = new Date().toISOString()
    const started = Date.now()

    await this.ensureRegistration(input.session, input.submission.id)

    const result = await this.relayPayUseCase.execute(input.submission)

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

  private async ensureRegistration(session: TracedRelayStatusInput["session"], paymentId: string) {
    const existing = await this.store.getById(paymentId)
    if (existing) {
      return
    }

    const scenario = session.artifacts.relay?.simulatorScenario
    const result = await this.registerRelayScenarioUseCase.execute({
      id: paymentId,
      scenario:
        scenario === "simulator_confirmed"
          ? "confirmed"
          : scenario === "simulator_declined"
            ? "declined"
            : scenario === "simulator_error"
              ? "error"
              : "accepted",
      relayToken: session.artifacts.payDraft?.relay_token || undefined,
      required: 6,
      dueSec: scenario === "simulator_delayed_confirmation" ? 90 : 600,
      reason:
        scenario === "simulator_declined"
          ? "Declined by Flight Recorder preset"
          : scenario === "simulator_error"
            ? "Rejected by Flight Recorder preset"
            : undefined,
    })

    if (!result.ok) {
      throw new Error(result.errors.map((issue) => issue.message).join("; "))
    }
  }

  private async maybeConfirmDelayedScenario(
    session: TracedRelayStatusInput["session"],
    paymentId: string
  ) {
    if (session.artifacts.relay?.simulatorScenario !== "simulator_delayed_confirmation") {
      return
    }

    const existing = await this.store.getById(paymentId)
    if (!existing || existing.status !== "accepted") {
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
    await this.store.upsert({
      ...existing,
      status: "confirmed",
      confirmed: existing.required,
      dueSec: 0,
      confirmedAt: now,
      updatedAt: now,
    })
  }
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
