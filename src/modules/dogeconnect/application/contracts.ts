import type { RelayScenario } from "../domain/entities/relay-scenario"
import type { ValidationIssue } from "../domain/shared/validation"
import type { ErrorResponse, PaymentStatusResponse } from "../domain/value-objects/payment-status"

export interface ValidationCheck {
  name: string
  passed: boolean
  details: string
}

export interface EnvelopeValidationPayload {
  verdict: "valid" | "invalid"
  checks: ValidationCheck[]
  errors: ValidationIssue[]
  envelope: {
    version: string
    payload: string
    pubkey: string
    sig: string
  } | null
  payment: Record<string, unknown> | null
}

export interface QrValidationPayload {
  verdict: "valid" | "invalid" | "inconclusive"
  checks: ValidationCheck[]
  errors: ValidationIssue[]
  parsed: {
    address: string
    amount: string
    connectUrl: string
    pubKeyHashBase64Url: string
    isConnectUri: boolean
  } | null
  envelopeValidation?: EnvelopeValidationPayload
}

export interface MockQrFixturePayload {
  uri: string
  paymentId: string
  address: string
  amount: string
  dc: string
  h: string
  envelope: {
    version: "1.0"
    payload: string
    pubkey: string
    sig: string
  }
  payment: Record<string, unknown>
}

export interface RelayDebugRegistrationInput {
  id: string
  scenario: RelayScenario
  reason?: string
  relayToken?: string
  required?: number
  dueSec?: number
}

export interface RelayDebugRecordView {
  id: string
  scenario: RelayScenario
  status: PaymentStatusResponse["status"]
  reason: string
  txid: string
  relayToken: string
  required: number
  confirmed: number
  dueSec: number
  confirmedAt: string
  updatedAt: string
}

export type RelayExecutionResult =
  | {
      ok: true
      statusCode: 200
      body: PaymentStatusResponse
    }
  | {
      ok: false
      statusCode: number
      body: ErrorResponse
    }
