import type {
  FlightRecorderSessionExport,
  FlightRecorderSessionV1,
} from "@/modules/dogeconnect/application/flight-recorder-contracts"
import type { FlightRecorderSearchState } from "./flight-recorder-search"

export type FlightRecorderPayDraftFields = Pick<
  FlightRecorderSearchState,
  "payDraftTx" | "payDraftRelayToken" | "payDraftRefund"
>

export const badgeVariantForVerdict = (verdict: "pass" | "warn" | "fail") =>
  verdict === "pass" ? "success" : verdict === "warn" ? "warning" : "danger"

export const formatPhaseLabel = (phase: string): string =>
  phase.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())

export const applySearchStateToSession = (
  session: FlightRecorderSessionV1 | null,
  search: FlightRecorderSearchState,
  payDraftFields: FlightRecorderPayDraftFields
): FlightRecorderSessionV1 | null => {
  if (!session?.artifacts.payDraft) {
    return withLiveWriteState(session, search.liveWriteArmed)
  }

  const nextSession = {
    ...session,
    artifacts: {
      ...session.artifacts,
      payDraft: {
        ...session.artifacts.payDraft,
        id: search.payDraftId ?? session.artifacts.payDraft.id,
        tx: payDraftFields.payDraftTx ?? session.artifacts.payDraft.tx,
        relay_token: payDraftFields.payDraftRelayToken ?? session.artifacts.payDraft.relay_token,
        refund: payDraftFields.payDraftRefund ?? session.artifacts.payDraft.refund,
      },
    },
  }

  return withLiveWriteState(nextSession, search.liveWriteArmed)
}

const withLiveWriteState = (
  session: FlightRecorderSessionV1 | null,
  liveWriteArmed: boolean
): FlightRecorderSessionV1 | null =>
  !session
    ? session
    : {
        ...session,
        artifacts: {
          ...session.artifacts,
          relay: session.artifacts.relay
            ? {
                ...session.artifacts.relay,
                liveWriteArmed: session.artifacts.relay.mode === "live" ? liveWriteArmed : false,
              }
            : null,
        },
      }

export const payDraftSearchPatch = (
  session: FlightRecorderSessionV1
): Pick<FlightRecorderSearchState, "payDraftId"> => ({
  payDraftId: session.artifacts.payDraft?.id ?? "",
})

export const downloadJsonFile = (value: FlightRecorderSessionExport, filename: string) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
