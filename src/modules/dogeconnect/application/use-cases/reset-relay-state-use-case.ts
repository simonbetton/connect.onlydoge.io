import type { RelayStateStorePort } from "../../ports/relay-state-store-port"

export const createResetRelayStateUseCase = (store: RelayStateStorePort) => ({
  async execute(): Promise<void> {
    await store.clear()
  },
})

export type ResetRelayStateUseCase = ReturnType<typeof createResetRelayStateUseCase>
