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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const compactSearch = (search: ToolsSearch): ToolsSearch =>
  Object.fromEntries(
    Object.entries(search).filter(([, value]) => value !== undefined)
  ) as ToolsSearch

const readString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key]

  if (typeof value === "string") {
    return value || undefined
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0] || undefined
  }

  return undefined
}

const readBoolean = (record: Record<string, unknown>, key: string): boolean | undefined => {
  const value = record[key]

  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    if (value === "true" || value === "1") {
      return true
    }

    if (value === "false" || value === "0") {
      return false
    }
  }

  return undefined
}

const readNumber = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = record[key]

  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

const readScenario = (
  record: Record<string, unknown>,
  key: string
): RelayScenarioOption | undefined => {
  const value = readString(record, key)

  if (value === "accepted" || value === "confirmed" || value === "declined" || value === "error") {
    return value
  }

  return undefined
}

export const validateToolsSearch = (input: unknown): ToolsSearch => {
  const record = isRecord(input) ? input : {}

  return compactSearch({
    mockPaymentId: readString(record, "mock"),
    qrUri: readString(record, "uri"),
    qrFetchEnvelope: readBoolean(record, "fetchEnvelope"),
    envelopeJson: readString(record, "envelope"),
    envelopeExpectedHash: readString(record, "expectedHash"),
    relayRegisterId: readString(record, "registerId"),
    relayRegisterScenario: readScenario(record, "registerScenario"),
    relayRegisterReason: readString(record, "registerReason"),
    relayRegisterToken: readString(record, "registerToken"),
    relayRegisterRequired: readNumber(record, "registerRequired"),
    relayRegisterDueSec: readNumber(record, "registerDueSec"),
    relayPayId: readString(record, "payId"),
    relayPayTx: readString(record, "payTx"),
    relayPayRefund: readString(record, "payRefund"),
    relayPayRelayToken: readString(record, "payRelayToken"),
    relayStatusId: readString(record, "statusId"),
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
  ...(search.envelopeJson ? { envelope: search.envelopeJson } : {}),
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
  ...(search.relayPayTx ? { payTx: search.relayPayTx } : {}),
  ...(search.relayPayRefund ? { payRefund: search.relayPayRefund } : {}),
  ...(search.relayPayRelayToken ? { payRelayToken: search.relayPayRelayToken } : {}),
  ...(search.relayStatusId ? { statusId: search.relayStatusId } : {}),
})

export const resolveToolsSearch = (search: ToolsSearch): ToolsSearchState => ({
  ...defaultToolsSearch,
  ...compactSearch(search),
})
