import type { FlightRecorderSessionV1 } from "@/modules/dogeconnect/application/flight-recorder-contracts"
import type { FlightRecorderPayDraftFields } from "./flight-recorder-page-utils"
import { defaultFlightRecorderSearch } from "./flight-recorder-search"

export type FlightRecorderUiState = {
  importError: string
  importJson: string
  payDraftFields: FlightRecorderPayDraftFields
  qrImageError: string
  qrImageName: string
  qrImageDecodePending: boolean
  session: FlightRecorderSessionV1 | null
  pageMessage: string
}

export type FlightRecorderUiAction =
  | { type: "set-import-error"; value: string }
  | { type: "set-import-json"; value: string }
  | { type: "set-pay-draft-fields"; value: FlightRecorderPayDraftFields }
  | { type: "set-qr-image-error"; value: string }
  | { type: "set-qr-image-name"; value: string }
  | { type: "set-qr-image-decode-pending"; value: boolean }
  | { type: "set-session"; value: FlightRecorderSessionV1 | null }
  | { type: "set-page-message"; value: string }
  | { type: "reset-after-build"; session: FlightRecorderSessionV1 }

export const createDefaultFlightRecorderPayDraftFields = (): FlightRecorderPayDraftFields => ({
  payDraftTx: defaultFlightRecorderSearch.payDraftTx,
  payDraftRelayToken: defaultFlightRecorderSearch.payDraftRelayToken,
  payDraftRefund: defaultFlightRecorderSearch.payDraftRefund,
})

export const createInitialFlightRecorderUiState = (): FlightRecorderUiState => ({
  importError: "",
  importJson: defaultFlightRecorderSearch.importJson,
  payDraftFields: createDefaultFlightRecorderPayDraftFields(),
  qrImageError: "",
  qrImageName: "",
  qrImageDecodePending: false,
  session: null,
  pageMessage: "",
})

export const flightRecorderUiReducer = (
  state: FlightRecorderUiState,
  action: FlightRecorderUiAction
): FlightRecorderUiState => {
  switch (action.type) {
    case "set-import-error":
      return { ...state, importError: action.value }
    case "set-import-json":
      return { ...state, importJson: action.value }
    case "set-pay-draft-fields":
      return { ...state, payDraftFields: action.value }
    case "set-qr-image-error":
      return { ...state, qrImageError: action.value }
    case "set-qr-image-name":
      return { ...state, qrImageName: action.value }
    case "set-qr-image-decode-pending":
      return { ...state, qrImageDecodePending: action.value }
    case "set-session":
      return { ...state, session: action.value }
    case "set-page-message":
      return { ...state, pageMessage: action.value }
    case "reset-after-build":
      return {
        ...state,
        session: action.session,
        payDraftFields: createDefaultFlightRecorderPayDraftFields(),
        importError: "",
        pageMessage: "Flight Recorder session built successfully.",
      }
    default:
      return state
  }
}
