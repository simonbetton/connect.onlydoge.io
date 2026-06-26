import type { RelayStateStorePort } from "../../ports/relay-state-store-port"
import type { RelayDebugRecordView } from "../contracts"
import { toRelayDebugRecordView } from "./register-relay-scenario-use-case"

export const createListRelayScenariosUseCase = (store: RelayStateStorePort) => ({
  async execute(): Promise<RelayDebugRecordView[]> {
    const records = await store.list()
    return records.map(toRelayDebugRecordView)
  },
})

export type ListRelayScenariosUseCase = ReturnType<typeof createListRelayScenariosUseCase>
