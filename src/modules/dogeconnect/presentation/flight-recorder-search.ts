export type FlightRecorderSearchState = {
  sourceTab: "qr" | "mock" | "import"
  targetMode: "simulator" | "live"
  selectedTraceId: string
  autoPoll: boolean
  pollIntervalSec: number
  builderExpanded: boolean
  timelineExpanded: boolean
  inspectorExpanded: boolean
  controlsExpanded: boolean
}

export type FlightRecorderSearch = Partial<FlightRecorderSearchState>

export const defaultFlightRecorderSearch: FlightRecorderSearchState = {
  sourceTab: "qr",
  targetMode: "simulator",
  selectedTraceId: "",
  autoPoll: false,
  pollIntervalSec: 5,
  builderExpanded: true,
  timelineExpanded: true,
  inspectorExpanded: true,
  controlsExpanded: true,
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

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

export const validateFlightRecorderSearch = (input: unknown): FlightRecorderSearch => {
  const record = isRecord(input) ? input : {}
  const sourceTab = readString(record, "sourceTab")
  const targetMode = readString(record, "targetMode")

  return compactSearch({
    sourceTab:
      sourceTab === "qr" || sourceTab === "mock" || sourceTab === "import" ? sourceTab : undefined,
    targetMode: targetMode === "simulator" || targetMode === "live" ? targetMode : undefined,
    selectedTraceId: readString(record, "trace"),
    autoPoll: readBoolean(record, "autoPoll"),
    pollIntervalSec: readNumber(record, "poll"),
    builderExpanded: readBoolean(record, "builder"),
    timelineExpanded: readBoolean(record, "timeline"),
    inspectorExpanded: readBoolean(record, "inspector"),
    controlsExpanded: readBoolean(record, "controls"),
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
  ...(search.selectedTraceId ? { trace: search.selectedTraceId } : {}),
  ...(search.autoPoll === defaultFlightRecorderSearch.autoPoll
    ? {}
    : { autoPoll: search.autoPoll }),
  ...(search.pollIntervalSec === defaultFlightRecorderSearch.pollIntervalSec
    ? {}
    : { poll: search.pollIntervalSec }),
  ...(search.builderExpanded === defaultFlightRecorderSearch.builderExpanded
    ? {}
    : { builder: search.builderExpanded }),
  ...(search.timelineExpanded === defaultFlightRecorderSearch.timelineExpanded
    ? {}
    : { timeline: search.timelineExpanded }),
  ...(search.inspectorExpanded === defaultFlightRecorderSearch.inspectorExpanded
    ? {}
    : { inspector: search.inspectorExpanded }),
  ...(search.controlsExpanded === defaultFlightRecorderSearch.controlsExpanded
    ? {}
    : { controls: search.controlsExpanded }),
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
