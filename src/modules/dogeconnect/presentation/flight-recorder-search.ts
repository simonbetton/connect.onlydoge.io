import {
  type FlightRecorderFaultPreset,
  isFlightRecorderFaultPreset,
} from "@/modules/dogeconnect/application/flight-recorder-contracts"
import {
  compactPartialSearch,
  isSearchParamRecord,
  readSearchParamBoolean,
  readSearchParamNumber,
  readSearchParamString,
  readSearchParamStringList,
} from "./search-param-parsing"

export type FlightRecorderSearchState = {
  sourceTab: "qr" | "mock" | "import"
  targetMode: "simulator" | "live"
  qrUri: string
  mockPaymentId: string
  includeInitialStatus: boolean
  selectedFaults: FlightRecorderFaultPreset[]
  importJson: string
  selectedTraceId: string
  autoPoll: boolean
  pollIntervalSec: number
  payDraftId: string | null
  payDraftTx: string | null
  payDraftRelayToken: string | null
  payDraftRefund: string | null
  liveWriteArmed: boolean
}

export type FlightRecorderSearch = Partial<FlightRecorderSearchState>

export const defaultFlightRecorderSearch: FlightRecorderSearchState = {
  sourceTab: "qr",
  targetMode: "simulator",
  qrUri: "",
  mockPaymentId: "",
  includeInitialStatus: true,
  selectedFaults: [],
  importJson: "",
  selectedTraceId: "",
  autoPoll: false,
  pollIntervalSec: 5,
  payDraftId: null,
  payDraftTx: null,
  payDraftRelayToken: null,
  payDraftRefund: null,
  liveWriteArmed: false,
}

export const validateFlightRecorderSearch = (input: unknown): FlightRecorderSearch => {
  const record = isSearchParamRecord(input) ? input : {}
  const sourceTab = readSearchParamString(record, "sourceTab")
  const targetMode = readSearchParamString(record, "targetMode")
  const pollIntervalSec = readSearchParamNumber(record, "poll")
  const rawFaults = readSearchParamStringList(record, "faults")
  const selectedFaults = rawFaults?.reduce<FlightRecorderFaultPreset[]>((faults, fault) => {
    if (!isFlightRecorderFaultPreset(fault) || faults.includes(fault)) {
      return faults
    }

    faults.push(fault)
    return faults
  }, [])

  return compactPartialSearch({
    sourceTab:
      sourceTab === "qr" || sourceTab === "mock" || sourceTab === "import" ? sourceTab : undefined,
    targetMode: targetMode === "simulator" || targetMode === "live" ? targetMode : undefined,
    qrUri: readSearchParamString(record, "qr"),
    mockPaymentId: readSearchParamString(record, "mock"),
    includeInitialStatus: readSearchParamBoolean(record, "initial"),
    selectedFaults,
    selectedTraceId: readSearchParamString(record, "trace"),
    autoPoll: readSearchParamBoolean(record, "autoPoll"),
    pollIntervalSec: pollIntervalSec === undefined ? undefined : Math.max(1, pollIntervalSec),
    payDraftId: readSearchParamString(record, "draftId"),
    liveWriteArmed: readSearchParamBoolean(record, "armed"),
  })
}

export const cleanFlightRecorderSearch = (
  search: FlightRecorderSearchState
): Partial<Record<string, string | number | boolean>> => ({
  ...(search.sourceTab === defaultFlightRecorderSearch.sourceTab
    ? {}
    : { sourceTab: search.sourceTab }),
  ...(search.targetMode === defaultFlightRecorderSearch.targetMode
    ? {}
    : { targetMode: search.targetMode }),
  ...(search.qrUri ? { qr: search.qrUri } : {}),
  ...(search.mockPaymentId ? { mock: search.mockPaymentId } : {}),
  ...(search.includeInitialStatus === defaultFlightRecorderSearch.includeInitialStatus
    ? {}
    : { initial: search.includeInitialStatus }),
  ...(search.selectedFaults.length > 0 ? { faults: search.selectedFaults.join(",") } : {}),
  ...(search.selectedTraceId ? { trace: search.selectedTraceId } : {}),
  ...(search.autoPoll === defaultFlightRecorderSearch.autoPoll
    ? {}
    : { autoPoll: search.autoPoll }),
  ...(search.pollIntervalSec === defaultFlightRecorderSearch.pollIntervalSec
    ? {}
    : { poll: search.pollIntervalSec }),
  ...(search.payDraftId === null ? {} : { draftId: search.payDraftId }),
  ...(search.liveWriteArmed === defaultFlightRecorderSearch.liveWriteArmed
    ? {}
    : { armed: search.liveWriteArmed }),
})

export const resolveFlightRecorderSearch = (
  search: FlightRecorderSearch
): FlightRecorderSearchState => ({
  ...defaultFlightRecorderSearch,
  ...compactPartialSearch(search),
})
