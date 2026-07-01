"use client"

import * as React from "react"

export function GlobalPasteDiagnose() {
  return null
}

export function useDiagnosisNavigation() {
  return React.useMemo(
    () => ({
      validateClipboard: async () => {
        if (!navigator.clipboard?.readText) {
          return false
        }

        const text = (await navigator.clipboard.readText()).trim()
        if (!text) {
          return false
        }

        const params = new URLSearchParams()
        if (text.startsWith("dogecoin:") || text.startsWith("dogeconnect:")) {
          params.set("qrUri", text)
          window.location.href = `/tools?${params.toString()}#qr-validator`
          return true
        }

        if (text.startsWith("{")) {
          window.location.href = "/tools#envelope-validator"
          return true
        }

        return false
      },
    }),
    []
  )
}
