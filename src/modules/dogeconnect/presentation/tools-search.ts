import {
  compactPartialSearch,
  isSearchParamRecord,
  readSearchParamBoolean,
  readSearchParamNumber,
  readSearchParamString,
} from "./search-param-parsing"

export type RelayScenarioOption = "accepted" | "confirmed" | "declined" | "error"

export type ToolsSearchState = {
  mockPaymentId: string
  qrUri: string
  qrFetchEnvelope: boolean
  envelopeJson: string
  envelopeExpectedHash: string
  relayRegisterId: string
  relayRegisterScenario: RelayScenarioOption
  relayRegisterReason: string
  relayRegisterToken: string
  relayRegisterRequired: number
  relayRegisterDueSec: number
  relayPayId: string
  relayPayTx: string
  relayPayRefund: string
  relayPayRelayToken: string
  relayStatusId: string
}

export type ToolsSearch = Partial<ToolsSearchState>

export const defaultToolsSearch: ToolsSearchState = {
  mockPaymentId: "",
  qrUri: "",
  qrFetchEnvelope: true,
  envelopeJson: "",
  envelopeExpectedHash: "",
  relayRegisterId: "",
  relayRegisterScenario: "accepted",
  relayRegisterReason: "",
  relayRegisterToken: "",
  relayRegisterRequired: 6,
  relayRegisterDueSec: 600,
  relayPayId: "",
  relayPayTx: "",
  relayPayRefund: "",
  relayPayRelayToken: "",
  relayStatusId: "",
}

const readScenario = (
  record: Record<string, unknown>,
  key: string
): RelayScenarioOption | undefined => {
  const value = readSearchParamString(record, key, { emptyAsUndefined: true })

  if (value === "accepted" || value === "confirmed" || value === "declined" || value === "error") {
    return value
  }

  return undefined
}

export const validateToolsSearch = (input: unknown): ToolsSearch => {
  const record = isSearchParamRecord(input) ? input : {}

  return compactPartialSearch({
    mockPaymentId: readSearchParamString(record, "mock", { emptyAsUndefined: true }),
    qrUri: readSearchParamString(record, "uri", { emptyAsUndefined: true }),
    qrFetchEnvelope: readSearchParamBoolean(record, "fetchEnvelope"),
    envelopeExpectedHash: readSearchParamString(record, "expectedHash", { emptyAsUndefined: true }),
    relayRegisterId: readSearchParamString(record, "registerId", { emptyAsUndefined: true }),
    relayRegisterScenario: readScenario(record, "registerScenario"),
    relayRegisterReason: readSearchParamString(record, "registerReason", {
      emptyAsUndefined: true,
    }),
    relayRegisterToken: readSearchParamString(record, "registerToken", { emptyAsUndefined: true }),
    relayRegisterRequired: readSearchParamNumber(record, "registerRequired"),
    relayRegisterDueSec: readSearchParamNumber(record, "registerDueSec"),
    relayPayId: readSearchParamString(record, "payId", { emptyAsUndefined: true }),
    relayStatusId: readSearchParamString(record, "statusId", { emptyAsUndefined: true }),
  })
}

export const cleanToolsSearch = (
  search: ToolsSearchState
): Partial<Record<string, string | number | boolean>> => ({
  ...(search.mockPaymentId ? { mock: search.mockPaymentId } : {}),
  ...(search.qrUri ? { uri: search.qrUri } : {}),
  ...(search.qrFetchEnvelope === defaultToolsSearch.qrFetchEnvelope
    ? {}
    : { fetchEnvelope: search.qrFetchEnvelope }),
  ...(search.envelopeExpectedHash ? { expectedHash: search.envelopeExpectedHash } : {}),
  ...(search.relayRegisterId ? { registerId: search.relayRegisterId } : {}),
  ...(search.relayRegisterScenario === defaultToolsSearch.relayRegisterScenario
    ? {}
    : { registerScenario: search.relayRegisterScenario }),
  ...(search.relayRegisterReason ? { registerReason: search.relayRegisterReason } : {}),
  ...(search.relayRegisterToken ? { registerToken: search.relayRegisterToken } : {}),
  ...(search.relayRegisterRequired === defaultToolsSearch.relayRegisterRequired
    ? {}
    : { registerRequired: search.relayRegisterRequired }),
  ...(search.relayRegisterDueSec === defaultToolsSearch.relayRegisterDueSec
    ? {}
    : { registerDueSec: search.relayRegisterDueSec }),
  ...(search.relayPayId ? { payId: search.relayPayId } : {}),
  ...(search.relayStatusId ? { statusId: search.relayStatusId } : {}),
})

export const resolveToolsSearch = (search: ToolsSearch): ToolsSearchState => ({
  ...defaultToolsSearch,
  ...compactPartialSearch(search),
})
