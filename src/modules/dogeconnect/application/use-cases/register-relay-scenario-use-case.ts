import { RELAY_SCENARIOS, type RelayPaymentRecord } from "../../domain/entities/relay-scenario"
import { type ValidationIssue, validationError } from "../../domain/shared/validation"
import type { RelayStateStorePort } from "../../ports/relay-state-store-port"
import type { RelayDebugRecordView, RelayDebugRegistrationInput } from "../contracts"

type RegisterRelayScenarioResult =
  | {
      ok: true
      errors: []
      record: RelayDebugRecordView
    }
  | {
      ok: false
      errors: ValidationIssue[]
      record: null
    }

export class RegisterRelayScenarioUseCase {
  constructor(private readonly store: RelayStateStorePort) {}

  async execute(input: RelayDebugRegistrationInput): Promise<RegisterRelayScenarioResult> {
    const errors: ValidationIssue[] = []

    const id = input.id.trim()
    if (!id) {
      errors.push(validationError("id", "required"))
    }

    if (!RELAY_SCENARIOS.includes(input.scenario)) {
      errors.push(validationError("scenario", "invalid relay scenario"))
    }

    const required = normalizePositiveInteger(input.required, 6, "required", errors)
    const dueSec = normalizePositiveInteger(input.dueSec, 600, "dueSec", errors)

    if (errors.length > 0) {
      return {
        ok: false,
        errors,
        record: null,
      }
    }

    const now = new Date().toISOString()
    const record: RelayPaymentRecord = {
      id,
      scenario: input.scenario,
      status: "unpaid",
      reason:
        input.reason?.trim() ||
        (input.scenario === "declined"
          ? "Declined by relay debug scenario"
          : "Simulation in progress"),
      txid: "",
      relayToken: input.relayToken?.trim() ?? "",
      required,
      confirmed: 0,
      dueSec,
      confirmedAt: "",
      updatedAt: now,
    }

    const saved = await this.store.upsert(record)
    return {
      ok: true,
      errors: [],
      record: toRelayDebugRecordView(saved),
    }
  }
}

export const toRelayDebugRecordView = (record: RelayPaymentRecord): RelayDebugRecordView => ({
  id: record.id,
  scenario: record.scenario,
  status: record.status,
  reason: record.reason,
  txid: record.txid,
  relayToken: record.relayToken,
  required: record.required,
  confirmed: record.confirmed,
  dueSec: record.dueSec,
  confirmedAt: record.confirmedAt,
  updatedAt: record.updatedAt,
})

const normalizePositiveInteger = (
  value: number | undefined,
  fallback: number,
  field: string,
  errors: ValidationIssue[]
): number => {
  if (value === undefined) {
    return fallback
  }

  if (!Number.isInteger(value) || value < 1) {
    errors.push(validationError(field, "must be a positive integer"))
    return fallback
  }

  return value
}
