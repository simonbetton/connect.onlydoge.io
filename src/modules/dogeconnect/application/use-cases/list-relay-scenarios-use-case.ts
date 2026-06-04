import type { RelayStateStorePort } from "../../ports/relay-state-store-port"
import type { RelayDebugRecordView } from "../contracts"
import { toRelayDebugRecordView } from "./register-relay-scenario-use-case"

export class ListRelayScenariosUseCase {
  constructor(private readonly store: RelayStateStorePort) {}

  async execute(): Promise<RelayDebugRecordView[]> {
    const records = await this.store.list()
    return records.map(toRelayDebugRecordView)
  }
}
