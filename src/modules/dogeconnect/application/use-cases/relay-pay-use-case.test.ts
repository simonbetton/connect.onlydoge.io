import { describe, expect, test } from "vitest"
import { NobleCryptoAdapter } from "../../adapters/crypto/noble-crypto-adapter"
import { InMemoryRelayStateStore } from "../../adapters/relay/in-memory-relay-state-store"
import type { RelayPaymentRecord } from "../../domain/entities/relay-scenario"
import type {
  ErrorResponse,
  PaymentStatusResponse,
} from "../../domain/value-objects/payment-status"
import { RelayPayUseCase } from "./relay-pay-use-case"

describe("RelayPayUseCase", () => {
  test("rejects invalid submission payloads", async () => {
    const useCase = createUseCase()
    const result = await useCase.execute({ id: "" })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.body.error).toBe("invalid_tx")
    }
  })

  test("returns not found when payment id is not registered", async () => {
    const result = await executePay(createUseCase(), {
      id: "missing-payment",
      tx: "deadbeef",
      refund: "",
      relay_token: "",
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.body.error).toBe("not_found")
    }
  })

  test("rejects mismatched relay tokens", async () => {
    const store = new InMemoryRelayStateStore()
    await store.upsert(createRelayRecord({ relayToken: "expected-token" }))
    const useCase = new RelayPayUseCase(store, new NobleCryptoAdapter())

    const result = await executePay(useCase, { relay_token: "wrong-token" })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.body.error).toBe("invalid_token")
    }
  })

  test.each([
    {
      name: "declined",
      record: { scenario: "declined" as const },
      assert: (body: PaymentStatusResponse) => {
        expect(body.status).toBe("declined")
      },
    },
    {
      name: "confirmed",
      record: { scenario: "confirmed" as const, required: 2 },
      assert: (body: PaymentStatusResponse) => {
        expect(body.status).toBe("confirmed")
        expect(body.confirmed).toBe(2)
      },
    },
    {
      name: "accepted",
      record: { scenario: "accepted" as const, confirmed: 0, required: 1 },
      assert: (body: PaymentStatusResponse) => {
        expect(body.status).toBe("accepted")
        expect(body.txid).toMatch(/^[0-9a-f]+$/)
      },
    },
  ])("simulates $name scenario", async ({ record, assert }) => {
    const result = await executePayForRecord(record)
    expect(result.ok).toBe(true)
    if (result.ok) {
      assert(result.body)
    }
  })

  test("simulates error scenario rejection", async () => {
    const result = await executePayForRecord({ scenario: "error" })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect((result.body as ErrorResponse).error).toBe("invalid_tx")
    }
  })
})

const createUseCase = () =>
  new RelayPayUseCase(new InMemoryRelayStateStore(), new NobleCryptoAdapter())

const executePay = (
  useCase: RelayPayUseCase,
  overrides: Partial<{ id: string; tx: string; refund: string; relay_token: string }> = {}
) =>
  useCase.execute({
    id: "pay-1",
    tx: "deadbeef",
    refund: "",
    relay_token: "",
    ...overrides,
  })

const executePayForRecord = async (recordOverrides: Partial<RelayPaymentRecord> = {}) => {
  const store = new InMemoryRelayStateStore()
  await store.upsert(createRelayRecord(recordOverrides))
  return executePay(new RelayPayUseCase(store, new NobleCryptoAdapter()))
}

const createRelayRecord = (overrides: Partial<RelayPaymentRecord> = {}): RelayPaymentRecord => ({
  id: "pay-1",
  scenario: "accepted",
  status: "unpaid",
  reason: "test",
  relayToken: "",
  required: 1,
  confirmed: 0,
  dueSec: 60,
  txid: "",
  confirmedAt: "",
  updatedAt: "2020-01-01T00:00:00.000Z",
  ...overrides,
})
