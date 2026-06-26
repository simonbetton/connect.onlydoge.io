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
      return invalidSubmissionResult(submissionResult.issues)
    }

    const existing = await this.store.getById(submission.wire.id)
    if (!existing) {
      return notFoundResult()
    }

    const tokenError = validateRelayToken(existing, submission.wire.relay_token)
    if (tokenError) {
      return tokenError
    }

    if (existing.scenario === "error") {
      return scenarioErrorResult()
    }

    const txid = resolvePayTxid(submission, existing, this.crypto)
    const next = buildPaymentAfterPay(existing, txid, existing.scenario)
    const saved = await this.store.upsert(next)

    return {
      ok: true,
      statusCode: 200,
      body: toPaymentStatusResponse(saved),
    }
  }
}

const invalidSubmissionResult = (
  issues: Array<{ field: string; message: string }>
): RelayExecutionResult => ({
  ok: false,
  statusCode: 400,
  body: {
    error: "invalid_tx",
    message:
      issues.map((issue) => `${issue.field}: ${issue.message}`).join("; ") ||
      "Invalid payment submission payload",
  },
})

const notFoundResult = (): RelayExecutionResult => ({
  ok: false,
  statusCode: 404,
  body: {
    error: "not_found",
    message: "Payment ID was not registered in relay debug state",
  },
})

const validateRelayToken = (
  existing: RelayPaymentRecord,
  relayToken: string
): RelayExecutionResult | null => {
  if (existing.relayToken && existing.relayToken !== relayToken) {
    return {
      ok: false,
      statusCode: 400,
      body: {
        error: "invalid_token",
        message: "relay_token does not match the registered payment token",
      },
    }
  }

  return null
}

const scenarioErrorResult = (): RelayExecutionResult => ({
  ok: false,
  statusCode: 400,
  body: {
    error: "invalid_tx",
    message: "Scenario configured to simulate invalid transaction rejection",
  },
})

const resolvePayTxid = (
  submission: PaymentSubmission,
  existing: RelayPaymentRecord,
  crypto: CryptoPort
): string =>
  submission.txBytes
    ? bytesToHex(crypto.sha256(submission.txBytes))
    : existing.txid || "00".repeat(32)

const buildPaymentAfterPay = (
  existing: RelayPaymentRecord,
  txid: string,
  scenario: RelayPaymentRecord["scenario"]
): RelayPaymentRecord => {
  const now = new Date().toISOString()

  if (scenario === "declined") {
    return {
      ...existing,
      status: "declined",
      txid: "",
      confirmed: 0,
      confirmedAt: "",
      updatedAt: now,
    }
  }

  if (scenario === "confirmed") {
    return {
      ...existing,
      status: "confirmed",
      txid,
      confirmed: existing.required,
      dueSec: 0,
      confirmedAt: now,
      updatedAt: now,
    }
  }

  return {
    ...existing,
    status: "accepted",
    txid,
    confirmed: Math.min(existing.confirmed, existing.required),
    confirmedAt: "",
    updatedAt: now,
  }
}
