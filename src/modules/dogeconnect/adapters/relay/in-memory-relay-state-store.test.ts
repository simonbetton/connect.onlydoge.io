import { describe, expect, test } from "vitest"
import type { RelayPaymentRecord } from "../../domain/entities/relay-scenario"
import { InMemoryRelayStateStore } from "./in-memory-relay-state-store"

describe("InMemoryRelayStateStore", () => {
  test("upserts and retrieves records by id", async () => {
    const store = new InMemoryRelayStateStore()
    const record = createRecord("payment-1", "2026-06-23T00:00:00.000Z")

    await store.upsert(record)

    expect(await store.getById("payment-1")).toEqual(record)
    expect(await store.getById("missing")).toBeNull()
  })

  test("lists records sorted by updatedAt", async () => {
    const store = new InMemoryRelayStateStore()

    await store.upsert(createRecord("newest", "2026-06-23T00:02:00.000Z"))
    await store.upsert(createRecord("oldest", "2026-06-23T00:00:00.000Z"))
    await store.upsert(createRecord("middle", "2026-06-23T00:01:00.000Z"))

    expect((await store.list()).map((record) => record.id)).toEqual(["oldest", "middle", "newest"])
  })

  test("evicts the oldest records when maxRecords is exceeded", async () => {
    const store = new InMemoryRelayStateStore({ maxRecords: 2 })

    await store.upsert(createRecord("oldest", "2026-06-23T00:00:00.000Z"))
    await store.upsert(createRecord("middle", "2026-06-23T00:01:00.000Z"))
    await store.upsert(createRecord("newest", "2026-06-23T00:02:00.000Z"))

    expect(await store.getById("oldest")).toBeNull()
    expect((await store.list()).map((record) => record.id)).toEqual(["middle", "newest"])
  })

  test("uses id as a deterministic eviction tiebreaker", async () => {
    const store = new InMemoryRelayStateStore({ maxRecords: 2 })
    const updatedAt = "2026-06-23T00:00:00.000Z"

    await store.upsert(createRecord("payment-b", updatedAt))
    await store.upsert(createRecord("payment-a", updatedAt))
    await store.upsert(createRecord("payment-c", updatedAt))

    expect(await store.getById("payment-a")).toBeNull()
    expect((await store.list()).map((record) => record.id)).toEqual(["payment-b", "payment-c"])
  })

  test("updating an existing id does not count as an extra record", async () => {
    const store = new InMemoryRelayStateStore({ maxRecords: 2 })

    await store.upsert(createRecord("payment-a", "2026-06-23T00:00:00.000Z"))
    await store.upsert(createRecord("payment-b", "2026-06-23T00:01:00.000Z"))
    await store.upsert(createRecord("payment-a", "2026-06-23T00:02:00.000Z", { reason: "updated" }))

    const records = await store.list()
    expect(records).toHaveLength(2)
    expect(records.map((record) => record.id)).toEqual(["payment-b", "payment-a"])
    expect(await store.getById("payment-a")).toMatchObject({ reason: "updated" })
  })
})

const createRecord = (
  id: string,
  updatedAt: string,
  overrides: Partial<RelayPaymentRecord> = {}
): RelayPaymentRecord => ({
  id,
  scenario: "accepted",
  status: "unpaid",
  reason: "Simulation in progress",
  txid: "",
  relayToken: "",
  required: 6,
  confirmed: 0,
  dueSec: 600,
  confirmedAt: "",
  updatedAt,
  ...overrides,
})
