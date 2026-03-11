import type { ConnectPaymentWire } from "../../domain/value-objects/connect-payment"
import type { CryptoPort } from "../../ports/crypto-port"
import { createMockDogeConnectFixture } from "./mock-dogeconnect-fixture"

interface GenerateMockQrInput {
  origin: string
  paymentId?: string
}

export interface GenerateMockQrPayload {
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
  payment: ConnectPaymentWire
}

export class GenerateMockQrUseCase {
  constructor(private readonly crypto: CryptoPort) {}

  execute(input: GenerateMockQrInput): GenerateMockQrPayload {
    const fixture = createMockDogeConnectFixture(this.crypto, input.paymentId)
    const dc = buildDcUrl(input.origin, fixture.paymentId)
    const query = new URLSearchParams({
      amount: fixture.amount,
      dc,
      h: fixture.h,
    })

    return {
      uri: `dogecoin:${fixture.address}?${query.toString()}`,
      paymentId: fixture.paymentId,
      address: fixture.address,
      amount: fixture.amount,
      dc,
      h: fixture.h,
      envelope: fixture.envelope,
      payment: fixture.payment,
    }
  }
}

const buildDcUrl = (origin: string, paymentId: string): string => {
  const trimmedOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin
  return `${trimmedOrigin}/api/tools/mock-envelope/${encodeURIComponent(paymentId)}`
}
