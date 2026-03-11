import type { PaymentStatus } from "../value-objects/payment-status"

export const RELAY_SCENARIOS = ["accepted", "confirmed", "declined", "error"] as const

export type RelayScenario = (typeof RELAY_SCENARIOS)[number]

export interface RelayPaymentRecord {
  id: string
  scenario: RelayScenario
  status: PaymentStatus
  reason: string
  txid: string
  relayToken: string
  required: number
  confirmed: number
  dueSec: number
  confirmedAt: string
  updatedAt: string
}
