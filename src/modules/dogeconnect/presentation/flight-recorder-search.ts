import {
  type FlightRecorderFaultPreset,
  isFlightRecorderFaultPreset,
} from "@/modules/dogeconnect/application/flight-recorder-contracts"

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const readString = (record: Record<string, unknown>, key: string): string | undefined => {
  if (!(key in record)) {
    return undefined
  }

  const value = record[key]
  if (typeof value === "string") {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0]
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

const readStringList = (record: Record<string, unknown>, key: string): string[] | undefined => {
  const value = record[key]
  const entries =
    typeof value === "string"
      ? value.split(",")
      : Array.isArray(value)
        ? value.flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
        : []
  const normalized = entries.flatMap((entry) => {
    const trimmed = entry.trim()
    return trimmed ? [trimmed] : []
  })

  return normalized.length > 0 ? normalized : undefined
}

export const validateFlightRecorderSearch = (input: unknown): FlightRecorderSearch => {
  const record = isRecord(input) ? input : {}
  const sourceTab = readString(record, "sourceTab")
  const targetMode = readString(record, "targetMode")
  const pollIntervalSec = readNumber(record, "poll")
  const rawFaults = readStringList(record, "faults")
  const selectedFaults = rawFaults?.reduce<FlightRecorderFaultPreset[]>((faults, fault) => {
    if (!isFlightRecorderFaultPreset(fault) || faults.includes(fault)) {
      return faults
    }

    faults.push(fault)
    return faults
  }, [])

  return compactSearch({
    sourceTab:
      sourceTab === "qr" || sourceTab === "mock" || sourceTab === "import" ? sourceTab : undefined,
    targetMode: targetMode === "simulator" || targetMode === "live" ? targetMode : undefined,
    qrUri: readString(record, "qr"),
    mockPaymentId: readString(record, "mock"),
    includeInitialStatus: readBoolean(record, "initial"),
    selectedFaults,
    selectedTraceId: readString(record, "trace"),
    autoPoll: readBoolean(record, "autoPoll"),
    pollIntervalSec: pollIntervalSec === undefined ? undefined : Math.max(1, pollIntervalSec),
    payDraftId: readString(record, "draftId"),
    liveWriteArmed: readBoolean(record, "armed"),
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
  ...compactSearch(search),
})

const compactSearch = (search: FlightRecorderSearch): FlightRecorderSearch =>
  Object.fromEntries(
    Object.entries(search).filter(([, value]) => value !== undefined)
  ) as FlightRecorderSearch
