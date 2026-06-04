import type { RelayPaymentRecord } from "../../domain/entities/relay-scenario"
import { bytesToHex } from "../../domain/shared/encoding"
import { PaymentSubmission } from "../../domain/value-objects/payment-submission"
import type { CryptoPort } from "../../ports/crypto-port"
import type { RelayStateStorePort } from "../../ports/relay-state-store-port"
import type { RelayExecutionResult } from "../contracts"
import { toPaymentStatusResponse } from "./relay-status-use-case"

export class RelayPayUseCase {
  constructor(
    private readonly store: RelayStateStorePort,
    private readonly crypto: CryptoPort
  ) {}

  async execute(input: unknown): Promise<RelayExecutionResult> {
    const submissionResult = PaymentSubmission.parse(input)
    const submission = submissionResult.value
    if (!submission || submissionResult.issues.length > 0) {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: "invalid_tx",
          message:
            submissionResult.issues.map((issue) => `${issue.field}: ${issue.message}`).join("; ") ||
            "Invalid payment submission payload",
        },
      }
    }

    const existing = await this.store.getById(submission.wire.id)
    if (!existing) {
      return {
        ok: false,
        statusCode: 404,
        body: {
          error: "not_found",
          message: "Payment ID was not registered in relay debug state",
        },
      }
    }

    if (existing.relayToken && existing.relayToken !== submission.wire.relay_token) {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: "invalid_token",
          message: "relay_token does not match the registered payment token",
        },
      }
    }

    if (existing.scenario === "error") {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: "invalid_tx",
          message: "Scenario configured to simulate invalid transaction rejection",
        },
      }
    }

    const txid = submission.txBytes
      ? bytesToHex(this.crypto.sha256(submission.txBytes))
      : existing.txid || "00".repeat(32)

    const now = new Date().toISOString()
    let next: RelayPaymentRecord

    if (existing.scenario === "declined") {
      next = {
        ...existing,
        status: "declined",
        txid: "",
        confirmed: 0,
        confirmedAt: "",
        updatedAt: now,
      }
    } else if (existing.scenario === "confirmed") {
      next = {
        ...existing,
        status: "confirmed",
        txid,
        confirmed: existing.required,
        dueSec: 0,
        confirmedAt: now,
        updatedAt: now,
      }
    } else {
      next = {
        ...existing,
        status: "accepted",
        txid,
        confirmed: Math.min(existing.confirmed, existing.required),
        confirmedAt: "",
        updatedAt: now,
      }
    }

    const saved = await this.store.upsert(next)

    return {
      ok: true,
      statusCode: 200,
      body: toPaymentStatusResponse(saved),
    }
  }
}
