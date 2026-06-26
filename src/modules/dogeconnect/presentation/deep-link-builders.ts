import { cleanFlightRecorderSearch, defaultFlightRecorderSearch } from "./flight-recorder-search"
import { cleanToolsSearch, defaultToolsSearch } from "./tools-search"

export const TOOLS_QR_SECTION = "#qr-validator"
export const TOOLS_ENVELOPE_SECTION = "#envelope-validator"
export const TOOLS_MOCK_SECTION = "#mock-fixture"

export const toolsQrValidatorSearch = (uri: string) =>
  cleanToolsSearch({
    ...defaultToolsSearch,
    qrUri: uri,
  })

export const toolsMockSearch = (paymentId: string) =>
  cleanToolsSearch({
    ...defaultToolsSearch,
    mockPaymentId: paymentId,
  })

export const flightRecorderQrSearch = (uri: string) =>
  cleanFlightRecorderSearch({
    ...defaultFlightRecorderSearch,
    qrUri: uri,
    sourceTab: "qr",
  })

export const flightRecorderMockSearch = (paymentId: string) =>
  cleanFlightRecorderSearch({
    ...defaultFlightRecorderSearch,
    mockPaymentId: paymentId,
    sourceTab: "mock",
  })
