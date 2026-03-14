import { BuildFlightRecorderSessionUseCase } from "../../application/use-cases/build-flight-recorder-session-use-case"
import { ExecuteFlightRecorderRelayPayUseCase } from "../../application/use-cases/execute-flight-recorder-relay-pay-use-case"
import { ExecuteFlightRecorderRelayStatusUseCase } from "../../application/use-cases/execute-flight-recorder-relay-status-use-case"
import { GenerateMockQrUseCase } from "../../application/use-cases/generate-mock-qr-use-case"
import { GetMockEnvelopeUseCase } from "../../application/use-cases/get-mock-envelope-use-case"
import { ListRelayScenariosUseCase } from "../../application/use-cases/list-relay-scenarios-use-case"
import { RegisterRelayScenarioUseCase } from "../../application/use-cases/register-relay-scenario-use-case"
import { RelayPayUseCase } from "../../application/use-cases/relay-pay-use-case"
import { RelayStatusUseCase } from "../../application/use-cases/relay-status-use-case"
import { ResetRelayStateUseCase } from "../../application/use-cases/reset-relay-state-use-case"
import { ValidateDogeConnectUriUseCase } from "../../application/use-cases/validate-dogeconnect-uri-use-case"
import { ValidatePaymentEnvelopeUseCase } from "../../application/use-cases/validate-payment-envelope-use-case"
import { NobleCryptoAdapter } from "../crypto/noble-crypto-adapter"
import { HttpEnvelopeFetcher } from "../outbound/http-envelope-fetcher"
import { HttpFlightRecorderEnvelopeClient } from "../outbound/http-flight-recorder-envelope-client"
import { HttpFlightRecorderRelayClient } from "../outbound/http-flight-recorder-relay-client"
import { InMemoryRelayStateStore } from "../relay/in-memory-relay-state-store"
import { LocalFlightRecorderRelayClient } from "../relay/local-flight-recorder-relay-client"
import { createDogeConnectApiApp } from "./elysia-app"
import { createDogeConnectMcpServer } from "./mcp-server"

const crypto = new NobleCryptoAdapter()
const envelopeFetcher = new HttpEnvelopeFetcher()
const relayStore = new InMemoryRelayStateStore()

const validatePaymentEnvelopeUseCase = new ValidatePaymentEnvelopeUseCase(crypto)
const validateDogeConnectUriUseCase = new ValidateDogeConnectUriUseCase(
  envelopeFetcher,
  validatePaymentEnvelopeUseCase
)
const generateMockQrUseCase = new GenerateMockQrUseCase(crypto)
const getMockEnvelopeUseCase = new GetMockEnvelopeUseCase(crypto)
const relayPayUseCase = new RelayPayUseCase(relayStore, crypto)
const relayStatusUseCase = new RelayStatusUseCase(relayStore)
const registerRelayScenarioUseCase = new RegisterRelayScenarioUseCase(relayStore)
const listRelayScenariosUseCase = new ListRelayScenariosUseCase(relayStore)
const resetRelayStateUseCase = new ResetRelayStateUseCase(relayStore)
const flightRecorderEnvelopeClient = new HttpFlightRecorderEnvelopeClient()
const flightRecorderLiveRelayClient = new HttpFlightRecorderRelayClient()
const flightRecorderLocalRelayClient = new LocalFlightRecorderRelayClient(
  registerRelayScenarioUseCase,
  relayPayUseCase,
  relayStatusUseCase,
  relayStore
)
const buildFlightRecorderSessionUseCase = new BuildFlightRecorderSessionUseCase(
  generateMockQrUseCase,
  validatePaymentEnvelopeUseCase,
  flightRecorderEnvelopeClient,
  flightRecorderLocalRelayClient,
  flightRecorderLiveRelayClient
)
const executeFlightRecorderRelayPayUseCase = new ExecuteFlightRecorderRelayPayUseCase(
  flightRecorderLocalRelayClient,
  flightRecorderLiveRelayClient
)
const executeFlightRecorderRelayStatusUseCase = new ExecuteFlightRecorderRelayStatusUseCase(
  flightRecorderLocalRelayClient,
  flightRecorderLiveRelayClient
)

export const dogeConnectApiApp = createDogeConnectApiApp({
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
})

export const dogeConnectMcpServer = createDogeConnectMcpServer({
  validateDogeConnectUriUseCase,
  validatePaymentEnvelopeUseCase,
  generateMockQrUseCase,
  registerRelayScenarioUseCase,
  resetRelayStateUseCase,
  buildFlightRecorderSessionUseCase,
  executeFlightRecorderRelayPayUseCase,
  executeFlightRecorderRelayStatusUseCase,
})
