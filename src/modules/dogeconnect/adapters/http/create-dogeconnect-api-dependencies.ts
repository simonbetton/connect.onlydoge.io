import { createBuildFlightRecorderSessionUseCase } from "../../application/use-cases/build-flight-recorder-session-use-case"
import { createExecuteFlightRecorderRelayPayUseCase } from "../../application/use-cases/execute-flight-recorder-relay-pay-use-case"
import { createExecuteFlightRecorderRelayStatusUseCase } from "../../application/use-cases/execute-flight-recorder-relay-status-use-case"
import { createGenerateMockQrUseCase } from "../../application/use-cases/generate-mock-qr-use-case"
import { createGetMockEnvelopeUseCase } from "../../application/use-cases/get-mock-envelope-use-case"
import { createListRelayScenariosUseCase } from "../../application/use-cases/list-relay-scenarios-use-case"
import { RegisterRelayScenarioUseCase } from "../../application/use-cases/register-relay-scenario-use-case"
import { RelayPayUseCase } from "../../application/use-cases/relay-pay-use-case"
import { RelayStatusUseCase } from "../../application/use-cases/relay-status-use-case"
import { createResetRelayStateUseCase } from "../../application/use-cases/reset-relay-state-use-case"
import { createValidateDogeConnectUriUseCase } from "../../application/use-cases/validate-dogeconnect-uri-use-case"
import { ValidatePaymentEnvelopeUseCase } from "../../application/use-cases/validate-payment-envelope-use-case"
import type { CryptoPort } from "../../ports/crypto-port"
import type { EnvelopeFetcherPort } from "../../ports/envelope-fetcher-port"
import type { RelayStateStorePort } from "../../ports/relay-state-store-port"
import type { TracedEnvelopeClientPort } from "../../ports/traced-envelope-client-port"
import type { TracedRelayClientPort } from "../../ports/traced-relay-client-port"
import { NobleCryptoAdapter } from "../crypto/noble-crypto-adapter"
import { HttpEnvelopeFetcher } from "../outbound/http-envelope-fetcher"
import { createHttpFlightRecorderEnvelopeClient } from "../outbound/http-flight-recorder-envelope-client"
import { createHttpFlightRecorderRelayClient } from "../outbound/http-flight-recorder-relay-client"
import { InMemoryRelayStateStore } from "../relay/in-memory-relay-state-store"
import { createLocalFlightRecorderRelayClient } from "../relay/local-flight-recorder-relay-client"
import type { DogeConnectApiDependencies } from "./elysia-app"

export interface CreateDogeConnectApiDependenciesOptions {
  crypto?: CryptoPort
  envelopeFetcher?: EnvelopeFetcherPort
  relayStore?: RelayStateStorePort
  envelopeClient?: TracedEnvelopeClientPort
  localFlightRecorderRelayClient?: TracedRelayClientPort
  liveFlightRecorderRelayClient?: TracedRelayClientPort
}

export const createDogeConnectApiDependencies = (
  options: CreateDogeConnectApiDependenciesOptions = {}
): DogeConnectApiDependencies => {
  const crypto = options.crypto ?? new NobleCryptoAdapter()
  const envelopeFetcher = options.envelopeFetcher ?? new HttpEnvelopeFetcher()
  const relayStore = options.relayStore ?? new InMemoryRelayStateStore()

  const validatePaymentEnvelopeUseCase = new ValidatePaymentEnvelopeUseCase(crypto)
  const validateDogeConnectUriUseCase = createValidateDogeConnectUriUseCase(
    envelopeFetcher,
    validatePaymentEnvelopeUseCase
  )
  const generateMockQrUseCase = createGenerateMockQrUseCase(crypto)
  const getMockEnvelopeUseCase = createGetMockEnvelopeUseCase(crypto)
  const relayPayUseCase = new RelayPayUseCase(relayStore, crypto)
  const relayStatusUseCase = new RelayStatusUseCase(relayStore)
  const registerRelayScenarioUseCase = new RegisterRelayScenarioUseCase(relayStore)
  const listRelayScenariosUseCase = createListRelayScenariosUseCase(relayStore)
  const resetRelayStateUseCase = createResetRelayStateUseCase(relayStore)
  const localFlightRecorderRelayClient =
    options.localFlightRecorderRelayClient ??
    createLocalFlightRecorderRelayClient(
      registerRelayScenarioUseCase,
      relayPayUseCase,
      relayStatusUseCase,
      relayStore
    )
  const liveFlightRecorderRelayClient =
    options.liveFlightRecorderRelayClient ?? createHttpFlightRecorderRelayClient()
  const buildFlightRecorderSessionUseCase = createBuildFlightRecorderSessionUseCase({
    generateMockQrUseCase,
    validatePaymentEnvelopeUseCase,
    envelopeClient: options.envelopeClient ?? createHttpFlightRecorderEnvelopeClient(),
    localRelayClient: localFlightRecorderRelayClient,
    liveRelayClient: liveFlightRecorderRelayClient,
  })
  const executeFlightRecorderRelayPayUseCase = createExecuteFlightRecorderRelayPayUseCase(
    localFlightRecorderRelayClient,
    liveFlightRecorderRelayClient
  )
  const executeFlightRecorderRelayStatusUseCase = createExecuteFlightRecorderRelayStatusUseCase(
    localFlightRecorderRelayClient,
    liveFlightRecorderRelayClient
  )

  return {
    validateDogeConnectUriUseCase,
    validatePaymentEnvelopeUseCase,
    generateMockQrUseCase,
    getMockEnvelopeUseCase,
    relayPayUseCase,
    relayStatusUseCase,
    registerRelayScenarioUseCase,
    listRelayScenariosUseCase,
    resetRelayStateUseCase,
    buildFlightRecorderSessionUseCase,
    executeFlightRecorderRelayPayUseCase,
    executeFlightRecorderRelayStatusUseCase,
  }
}
