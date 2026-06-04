import type { RelayPaymentRecord } from "../../domain/entities/relay-scenario"
import type { PaymentStatusResponse } from "../../domain/value-objects/payment-status"
import { StatusQuery } from "../../domain/value-objects/payment-submission"
import type { RelayStateStorePort } from "../../ports/relay-state-store-port"
import type { RelayExecutionResult } from "../contracts"

export class RelayStatusUseCase {
  constructor(private readonly store: RelayStateStorePort) {}

  async execute(input: unknown): Promise<RelayExecutionResult> {
    const queryResult = StatusQuery.parse(input)
    if (!queryResult.value || queryResult.issues.length > 0) {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: "invalid_outputs",
          message:
            queryResult.issues.map((issue) => `${issue.field}: ${issue.message}`).join("; ") ||
            "Invalid status query payload",
        },
      }
    }

    const record = await this.store.getById(queryResult.value.id)
    if (!record) {
      return {
        ok: false,
        statusCode: 404,
        body: {
          error: "not_found",
          message: "Payment ID was not registered in relay debug state",
        },
      }
    }

    return {
      ok: true,
      statusCode: 200,
      body: toPaymentStatusResponse(record),
    }
  }
}

export const toPaymentStatusResponse = (record: RelayPaymentRecord): PaymentStatusResponse => {
  if (record.status === "accepted") {
    return {
      id: record.id,
      status: "accepted",
      txid: record.txid,
      required: record.required,
      confirmed: record.confirmed,
      due_sec: record.dueSec,
    }
  }

  if (record.status === "confirmed") {
    return {
      id: record.id,
      status: "confirmed",
      txid: record.txid,
      confirmed_at: record.confirmedAt,
      required: record.required,
      confirmed: record.confirmed,
      due_sec: record.dueSec,
    }
  }

  if (record.status === "declined") {
    return {
      id: record.id,
      status: "declined",
      reason: record.reason,
    }
  }

  return {
    id: record.id,
    status: "unpaid",
  }
}
