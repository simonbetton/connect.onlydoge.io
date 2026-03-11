import { type ValidationIssue, validationError } from "../shared/validation"

export const PAYMENT_STATUS_VALUES = ["unpaid", "accepted", "confirmed", "declined"] as const

export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number]

export const ERROR_CODE_VALUES = [
  "not_found",
  "expired",
  "invalid_tx",
  "invalid_outputs",
  "invalid_token",
] as const

export type RelayErrorCode = (typeof ERROR_CODE_VALUES)[number]

export interface ErrorResponse {
  error: RelayErrorCode
  message: string
}

export interface PaymentStatusResponse {
  id: string
  status: PaymentStatus
  reason?: string
  txid?: string
  confirmed_at?: string
  required?: number
  confirmed?: number
  due_sec?: number
}

export const isPaymentStatus = (value: unknown): value is PaymentStatus =>
  typeof value === "string" && PAYMENT_STATUS_VALUES.includes(value as PaymentStatus)

export const validatePaymentStatusResponse = (value: PaymentStatusResponse): ValidationIssue[] => {
  const issues: ValidationIssue[] = []

  if (!value.id) {
    issues.push(validationError("id", "required"))
  }

  if (!isPaymentStatus(value.status)) {
    issues.push(validationError("status", "invalid payment status"))
  }

  if (value.reason && value.status !== "declined") {
    issues.push(validationError("reason", "only allowed when status is declined"))
  }

  if (value.txid && value.status !== "accepted" && value.status !== "confirmed") {
    issues.push(validationError("txid", "only allowed when status is accepted or confirmed"))
  }

  if (value.confirmed_at && value.status !== "confirmed") {
    issues.push(validationError("confirmed_at", "only allowed when status is confirmed"))
  }

  if (
    (value.required !== undefined ||
      value.confirmed !== undefined ||
      value.due_sec !== undefined) &&
    value.status !== "accepted" &&
    value.status !== "confirmed"
  ) {
    issues.push(
      validationError(
        "required/confirmed/due_sec",
        "only allowed when status is accepted or confirmed"
      )
    )
  }

  return issues
}
