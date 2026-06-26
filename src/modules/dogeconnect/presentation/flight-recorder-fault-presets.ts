import type { FlightRecorderFaultPreset } from "@/modules/dogeconnect/application/flight-recorder-contracts"

export const READ_SAFE_FAULTS: Array<{
  value: FlightRecorderFaultPreset
  label: string
  hint: string
}> = [
  {
    value: "wrong_hash",
    label: "Wrong h",
    hint: "Mutate the URI hash to simulate a QR/envelope mismatch.",
  },
  {
    value: "missing_hash",
    label: "Missing h",
    hint: "Remove the URI hash to test incomplete DogeConnect URIs.",
  },
  {
    value: "bad_signature",
    label: "Bad signature",
    hint: "Tamper with the fetched envelope signature locally.",
  },
  {
    value: "bad_pubkey_hash",
    label: "Bad pubkey",
    hint: "Mutate the envelope pubkey to simulate auth drift.",
  },
  {
    value: "expired_timeout",
    label: "Expired timeout",
    hint: "Force the decoded payment to appear expired.",
  },
  {
    value: "missing_relay_token",
    label: "Missing relay token",
    hint: "Strip relay_token from the decoded payment and pay draft.",
  },
]

export const SIMULATOR_FAULTS: Array<{
  value: FlightRecorderFaultPreset
  label: string
  hint: string
}> = [
  {
    value: "simulator_confirmed",
    label: "Immediate confirm",
    hint: "Local simulator returns confirmed on pay/status.",
  },
  {
    value: "simulator_declined",
    label: "Decline",
    hint: "Local simulator declines the payment.",
  },
  {
    value: "simulator_error",
    label: "Error",
    hint: "Local simulator rejects pay with an error.",
  },
  {
    value: "simulator_delayed_confirmation",
    label: "Delayed confirm",
    hint: "Local simulator accepts first, then confirms on a later status check.",
  },
]

export const SIMULATOR_FAULT_VALUES = new Set(SIMULATOR_FAULTS.map((fault) => fault.value))
