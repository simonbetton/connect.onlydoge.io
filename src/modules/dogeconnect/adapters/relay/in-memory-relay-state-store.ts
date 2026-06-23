import type { RelayPaymentRecord } from "../../domain/entities/relay-scenario"
import type { RelayStateStorePort } from "../../ports/relay-state-store-port"

interface InMemoryRelayStateStoreOptions {
  maxRecords?: number
}

export class InMemoryRelayStateStore implements RelayStateStorePort {
  private readonly records = new Map<string, RelayPaymentRecord>()
  private readonly maxRecords: number

  constructor({ maxRecords = 100 }: InMemoryRelayStateStoreOptions = {}) {
    if (!Number.isInteger(maxRecords) || maxRecords < 1) {
      throw new RangeError("maxRecords must be a positive integer")
    }

    this.maxRecords = maxRecords
  }

  async getById(id: string): Promise<RelayPaymentRecord | null> {
    return this.records.get(id) ?? null
  }

  async list(): Promise<RelayPaymentRecord[]> {
    return Array.from(this.records.values()).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
  }

  async upsert(record: RelayPaymentRecord): Promise<RelayPaymentRecord> {
    this.records.set(record.id, record)
    this.evictOldestRecords()
    return record
  }

  async clear(): Promise<void> {
    this.records.clear()
  }

  private evictOldestRecords(): void {
    if (this.records.size <= this.maxRecords) {
      return
    }

    const recordsByAge = Array.from(this.records.values()).sort((a, b) => {
      const updatedAtComparison = a.updatedAt.localeCompare(b.updatedAt)
      return updatedAtComparison === 0 ? a.id.localeCompare(b.id) : updatedAtComparison
    })

    for (const record of recordsByAge) {
      if (this.records.size <= this.maxRecords) {
        return
      }

      this.records.delete(record.id)
    }
  }
}
