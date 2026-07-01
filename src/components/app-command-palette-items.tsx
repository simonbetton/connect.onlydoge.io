import type { AppCommandItem } from "./app-command-palette"

export const appCommandItems: AppCommandItem[] = [
  {
    id: "overview",
    label: "Open overview",
    hint: "Premium product tour",
    action: () => {
      window.location.href = "/"
    },
  },
  {
    id: "protocol",
    label: "Open protocol",
    hint: "Plain-language DogeConnect map",
    action: () => {
      window.location.href = "/protocol"
    },
  },
  {
    id: "tools",
    label: "Open tools",
    hint: "QR, envelope, and relay validators",
    action: () => {
      window.location.href = "/tools"
    },
  },
  {
    id: "flight-recorder",
    label: "Open Flight Recorder",
    hint: "Build and inspect full traces",
    action: () => {
      window.location.href = "/flight-recorder"
    },
  },
]
