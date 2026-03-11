import type { RelayStateStorePort } from "../../ports/relay-state-store-port"

export class ResetRelayStateUseCase {
  constructor(private readonly store: RelayStateStorePort) {}

  async execute(): Promise<void> {
    await this.store.clear()
  }
}
