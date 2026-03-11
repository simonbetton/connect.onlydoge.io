import {
  bytesToBase64Url,
  bytesToHex,
  hexToBytesStrict,
  utf8ToBytes,
} from "../../domain/shared/encoding"
import type { ConnectPaymentWire } from "../../domain/value-objects/connect-payment"
import type { CryptoPort } from "../../ports/crypto-port"

const MOCK_PRIVATE_KEY_HEX = "11".repeat(32)
const MOCK_OUTPUT_ADDRESS = "DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY"
const MOCK_TOTAL_AMOUNT = "12.25"
const MOCK_TIMEOUT_SECONDS = 600
const MOCK_MAX_SIZE_BYTES = 100_000

const readMockPrivateKey = (): Uint8Array => {
  const bytes = hexToBytesStrict(MOCK_PRIVATE_KEY_HEX)
  if (!bytes || bytes.length !== 32) {
    throw new Error("Mock private key is invalid")
  }
  return bytes
}

const MOCK_PRIVATE_KEY_BYTES = readMockPrivateKey()

export interface MockEnvelope {
  version: "1.0"
  payload: string
  pubkey: string
  sig: string
}

export interface MockDogeConnectFixture {
  paymentId: string
  address: string
  amount: string
  h: string
  envelope: MockEnvelope
  payment: ConnectPaymentWire
}

export const createMockDogeConnectFixture = (
  crypto: CryptoPort,
  requestedPaymentId?: string
): MockDogeConnectFixture => {
  const paymentId = normalizePaymentId(requestedPaymentId)
  const payment = createMockPayment(paymentId)
  const payloadBytes = utf8ToBytes(JSON.stringify(payment))
  const payload = Buffer.from(payloadBytes).toString("base64")

  const publicKey = crypto.deriveSchnorrPublicKey(MOCK_PRIVATE_KEY_BYTES)
  const pubkey = bytesToHex(publicKey)
  const firstHash = crypto.sha256(payloadBytes)
  const secondHash = crypto.sha256(firstHash)
  const signature = crypto.signSchnorr(secondHash, MOCK_PRIVATE_KEY_BYTES)
  const sig = bytesToHex(signature)
  const h = bytesToBase64Url(crypto.sha256(publicKey).slice(0, 15))

  return {
    paymentId,
    address: MOCK_OUTPUT_ADDRESS,
    amount: MOCK_TOTAL_AMOUNT,
    h,
    envelope: {
      version: "1.0",
      payload,
      pubkey,
      sig,
    },
    payment,
  }
}

const createMockPayment = (paymentId: string): ConnectPaymentWire => ({
  type: "payment",
  id: paymentId,
  issued: new Date().toISOString(),
  timeout: MOCK_TIMEOUT_SECONDS,
  relay: "https://connect.onlydoge.io/api/relay/mock",
  relay_token: `mock-token-${paymentId}`,
  fee_per_kb: "1",
  max_size: MOCK_MAX_SIZE_BYTES,
  vendor_icon: "",
  vendor_name: "OnlyDoge Mock Merchant",
  vendor_address: "",
  vendor_url: "https://www.onlydoge.io",
  vendor_order_url: `https://www.onlydoge.io/order/${paymentId}`,
  vendor_order_id: paymentId,
  order_reference: paymentId,
  note: "Mock DogeConnect fixture generated for development debugging.",
  total: MOCK_TOTAL_AMOUNT,
  fees: "0",
  taxes: "0",
  fiat_total: "",
  fiat_tax: "",
  fiat_currency: "",
  items: [
    {
      type: "item",
      id: "debug-item-1",
      icon: "",
      name: "OnlyDoge Mock Item",
      desc: "Synthetic fixture payload for DogeConnect integration tests.",
      count: 1,
      unit: MOCK_TOTAL_AMOUNT,
      total: MOCK_TOTAL_AMOUNT,
      tax: "0",
    },
  ],
  outputs: [
    {
      address: MOCK_OUTPUT_ADDRESS,
      amount: MOCK_TOTAL_AMOUNT,
    },
  ],
})

const normalizePaymentId = (value?: string): string => {
  const source = typeof value === "string" ? value.trim() : ""
  const normalized = source
    .replaceAll(/[^A-Za-z0-9_-]/g, "-")
    .replaceAll(/-{2,}/g, "-")
    .replaceAll(/^-|-$/g, "")
    .slice(0, 64)

  if (normalized.length > 0) {
    return normalized
  }

  const suffix = Math.random().toString(36).slice(2, 10)
  return `mock-${Date.now().toString(36)}-${suffix}`
}
