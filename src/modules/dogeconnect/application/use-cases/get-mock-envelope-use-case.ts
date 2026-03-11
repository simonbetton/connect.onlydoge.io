import type { CryptoPort } from "../../ports/crypto-port"
import { createMockDogeConnectFixture } from "./mock-dogeconnect-fixture"

interface GetMockEnvelopeInput {
  paymentId?: string
}

export class GetMockEnvelopeUseCase {
  constructor(private readonly crypto: CryptoPort) {}

  execute(input: GetMockEnvelopeInput) {
    return createMockDogeConnectFixture(this.crypto, input.paymentId).envelope
  }
}
