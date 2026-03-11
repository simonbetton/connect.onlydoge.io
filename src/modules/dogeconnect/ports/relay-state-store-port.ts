import type { RelayPaymentRecord } from "../domain/entities/relay-scenario"

export interface RelayStateStorePort {
  getById(id: string): Promise<RelayPaymentRecord | null>
  list(): Promise<RelayPaymentRecord[]>
  upsert(record: RelayPaymentRecord): Promise<RelayPaymentRecord>
  clear(): Promise<void>
}
