import type { CryptoPort } from "../../ports/crypto-port"
import { createMockDogeConnectFixture } from "./mock-dogeconnect-fixture"

interface GetMockEnvelopeInput {
  paymentId?: string
}

export const createGetMockEnvelopeUseCase = (crypto: CryptoPort) => ({
  execute(input: GetMockEnvelopeInput = {}) {
    return createMockDogeConnectFixture(crypto, input.paymentId).envelope
  },
})

export type GetMockEnvelopeUseCase = ReturnType<typeof createGetMockEnvelopeUseCase>
