import type { RelayPaymentRecord } from "../../domain/entities/relay-scenario"
import type { RelayStateStorePort } from "../../ports/relay-state-store-port"

export class InMemoryRelayStateStore implements RelayStateStorePort {
  private readonly records = new Map<string, RelayPaymentRecord>()

  async getById(id: string): Promise<RelayPaymentRecord | null> {
    return this.records.get(id) ?? null
  }

  async list(): Promise<RelayPaymentRecord[]> {
    return Array.from(this.records.values()).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
  }

  async upsert(record: RelayPaymentRecord): Promise<RelayPaymentRecord> {
    this.records.set(record.id, record)
    return record
  }

  async clear(): Promise<void> {
    this.records.clear()
  }
}
