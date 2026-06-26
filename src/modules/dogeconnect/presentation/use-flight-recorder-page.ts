import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import * as React from "react"
import type {
  BuildFlightRecorderSessionInput,
  FlightRecorderFaultPreset,
  FlightRecorderSessionV1,
} from "@/modules/dogeconnect/application/flight-recorder-contracts"
import {
  exportFlightRecorderSession,
  parseImportedFlightRecorderSession,
} from "@/modules/dogeconnect/application/flight-recorder-session"
import { postJson } from "./api-client"
import { SIMULATOR_FAULT_VALUES } from "./flight-recorder-fault-presets"
import {
  applySearchStateToSession,
  downloadJsonFile,
  type FlightRecorderPayDraftFields,
  payDraftSearchPatch,
} from "./flight-recorder-page-utils"
import {
  cleanFlightRecorderSearch,
  defaultFlightRecorderSearch,
  type FlightRecorderSearchState,
  resolveFlightRecorderSearch,
} from "./flight-recorder-search"
import {
  createDefaultFlightRecorderPayDraftFields,
  createInitialFlightRecorderUiState,
  flightRecorderUiReducer,
} from "./flight-recorder-ui-state"
import { decodeQrTextFromImageFile } from "./qr-image-decoder"

export function useFlightRecorderPage() {
  const rawSearch = useSearch({ from: "/flight-recorder" })
  const search = resolveFlightRecorderSearch(rawSearch)
  const navigate = useNavigate({ from: "/flight-recorder" })
  const navigateRef = React.useRef(navigate)
  navigateRef.current = navigate
  const queryClient = useQueryClient()
  const [uiState, dispatch] = React.useReducer(
    flightRecorderUiReducer,
    undefined,
    createInitialFlightRecorderUiState
  )
  const {
    importError,
    importJson,
    payDraftFields,
    qrImageError,
    qrImageName,
    qrImageDecodePending,
    session,
    pageMessage,
  } = uiState
  const setImportError = (value: string) => dispatch({ type: "set-import-error", value })
  const setImportJson = (value: string) => dispatch({ type: "set-import-json", value })
  const setPayDraftFields = (value: FlightRecorderPayDraftFields) =>
    dispatch({ type: "set-pay-draft-fields", value })
  const setQrImageError = (value: string) => dispatch({ type: "set-qr-image-error", value })
  const setQrImageName = (value: string) => dispatch({ type: "set-qr-image-name", value })
  const setQrImageDecodePending = (value: boolean) =>
    dispatch({ type: "set-qr-image-decode-pending", value })
  const setSession = (value: FlightRecorderSessionV1 | null) =>
    dispatch({ type: "set-session", value })
  const setPageMessage = (value: string) => dispatch({ type: "set-page-message", value })
  const activeFaults = React.useMemo(
    () =>
      search.targetMode === "live"
        ? search.selectedFaults.filter((fault) => !SIMULATOR_FAULT_VALUES.has(fault))
        : search.selectedFaults,
    [search.selectedFaults, search.targetMode]
  )
  const ignoredLiveFaults = React.useMemo(
    () =>
      search.targetMode === "live"
        ? search.selectedFaults.filter((fault) => SIMULATOR_FAULT_VALUES.has(fault))
        : [],
    [search.selectedFaults, search.targetMode]
  )
  const sessionView = React.useMemo(
    () => applySearchStateToSession(session, search, payDraftFields),
    [payDraftFields, search, session]
  )

  const updateSearch = React.useCallback((patch: Partial<FlightRecorderSearchState>) => {
    React.startTransition(() => {
      void navigateRef.current({
        search: (previous) =>
          cleanFlightRecorderSearch({
            ...defaultFlightRecorderSearch,
            ...previous,
            ...patch,
          }),
        replace: true,
        resetScroll: false,
      })
    })
  }, [])

  const buildSessionMutation = useMutation({
    mutationFn: (payload: BuildFlightRecorderSessionInput) =>
      postJson<FlightRecorderSessionV1>("/api/flight-recorder/session", payload),
    onSuccess: (nextSession) => {
      dispatch({ type: "reset-after-build", session: nextSession })
      updateSearch({
        ...payDraftSearchPatch(nextSession),
        liveWriteArmed: false,
        selectedTraceId: nextSession.trace.at(-1)?.id ?? "",
      })
      void queryClient.invalidateQueries({ queryKey: ["flight-recorder"] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (currentSession: FlightRecorderSessionV1) =>
      postJson<FlightRecorderSessionV1>("/api/flight-recorder/relay/status", {
        session: currentSession,
      }),
    onSuccess: (nextSession) => {
      setSession(nextSession)
      setPageMessage("Status trace appended.")
      updateSearch({
        selectedTraceId: nextSession.trace.at(-1)?.id ?? "",
      })
      void queryClient.invalidateQueries({ queryKey: ["flight-recorder"] })
    },
  })

  const payMutation = useMutation({
    mutationFn: (currentSession: FlightRecorderSessionV1) =>
      postJson<FlightRecorderSessionV1>("/api/flight-recorder/relay/pay", {
        session: currentSession,
        liveWriteArmed: currentSession.artifacts.relay?.liveWriteArmed ?? false,
      }),
    onSuccess: (nextSession) => {
      setSession(nextSession)
      setPageMessage("Pay trace appended.")
      updateSearch({
        selectedTraceId: nextSession.trace.at(-1)?.id ?? "",
      })
      void queryClient.invalidateQueries({ queryKey: ["flight-recorder"] })
    },
  })

  const effectiveSelectedTraceId = React.useMemo(() => {
    if (!sessionView) {
      return search.selectedTraceId
    }

    const selected = search.selectedTraceId
    if (selected && sessionView.trace.some((entry) => entry.id === selected)) {
      return selected
    }

    return sessionView.trace.at(-1)?.id ?? ""
  }, [search.selectedTraceId, sessionView])

  const sessionViewRef = React.useRef(sessionView)
  sessionViewRef.current = sessionView
  const statusMutationRef = React.useRef(statusMutation)
  statusMutationRef.current = statusMutation

  const runStatusCheck = React.useCallback(() => {
    const currentSessionView = sessionViewRef.current
    const mutation = statusMutationRef.current
    if (!currentSessionView?.artifacts.relay || mutation.isPending) {
      return
    }

    void mutation.mutateAsync(currentSessionView)
  }, [])

  React.useEffect(() => {
    if (!search.autoPoll || !sessionView?.artifacts.relay) {
      return
    }

    const intervalMs = Math.max(1, search.pollIntervalSec) * 1000
    const handle = window.setInterval(() => {
      runStatusCheck()
    }, intervalMs)

    return () => {
      window.clearInterval(handle)
    }
  }, [runStatusCheck, search.autoPoll, search.pollIntervalSec, sessionView?.artifacts.relay])

  const selectedTrace =
    sessionView?.trace.find((entry) => entry.id === effectiveSelectedTraceId) ??
    sessionView?.trace.at(-1) ??
    null

  const buildSession = async () => {
    setPageMessage("")
    setImportError("")

    const payload: BuildFlightRecorderSessionInput =
      search.sourceTab === "mock"
        ? {
            source: {
              mode: "mock",
              paymentId: search.mockPaymentId || undefined,
            },
            targetMode: search.targetMode,
            faults: activeFaults,
            options: {
              includeInitialStatus: search.includeInitialStatus,
            },
            origin: window.location.origin,
          }
        : {
            source: {
              mode: "qr",
              uri: search.qrUri,
            },
            targetMode: search.targetMode,
            faults: activeFaults,
            options: {
              includeInitialStatus: search.includeInitialStatus,
            },
            origin: window.location.origin,
          }

    await buildSessionMutation.mutateAsync(payload)
  }

  const importSession = () => {
    setPageMessage("")
    setImportError("")
    let parsedJson: unknown

    try {
      parsedJson = JSON.parse(importJson)
    } catch {
      setImportError("Session JSON must be valid JSON.")
      return
    }

    const parsed = parseImportedFlightRecorderSession(parsedJson)
    if (!parsed.value) {
      setImportError(parsed.issues.map((issue) => `${issue.field}: ${issue.message}`).join("; "))
      return
    }

    const importedSession = {
      ...parsed.value,
      source: {
        ...parsed.value.source,
        imported: true,
      },
    }

    setSession(importedSession)
    setPayDraftFields(createDefaultFlightRecorderPayDraftFields())
    setPageMessage("Imported session loaded.")
    updateSearch({
      ...payDraftSearchPatch(importedSession),
      sourceTab: "import",
      targetMode: importedSession.meta.targetMode,
      liveWriteArmed: false,
      selectedTraceId: importedSession.trace.at(-1)?.id ?? "",
    })
  }

  const toggleFault = (fault: FlightRecorderFaultPreset) => {
    updateSearch({
      selectedFaults: search.selectedFaults.includes(fault)
        ? search.selectedFaults.filter((value) => value !== fault)
        : [...search.selectedFaults, fault],
    })
  }

  const loadImportFile = async (file: File | null) => {
    if (!file) {
      return
    }

    const text = await file.text()
    setImportJson(text)
  }

  const loadQrImage = async (file: File | null) => {
    if (!file) {
      return
    }

    setPageMessage("")
    setQrImageError("")
    setQrImageName(file.name)
    setQrImageDecodePending(true)

    try {
      const decodedText = await decodeQrTextFromImageFile(file)
      updateSearch({
        sourceTab: "qr",
        qrUri: decodedText,
      })
      setPageMessage(`Decoded QR data locally from ${file.name}.`)
    } catch (error) {
      setQrImageError(
        error instanceof Error ? error.message : "The selected image could not be decoded locally."
      )
    } finally {
      setQrImageDecodePending(false)
    }
  }

  const exportSession = (mode: "sanitized" | "full") => {
    if (!sessionView) {
      return
    }

    const exported = exportFlightRecorderSession(sessionView, mode)
    downloadJsonFile(exported, `flight-recorder-${mode}-${Date.now().toString(36)}.json`)
    setPageMessage(mode === "full" ? "Full session exported." : "Sanitized session exported.")
  }

  const setSourceTab = (sourceTab: FlightRecorderSearchState["sourceTab"]) => {
    updateSearch({ sourceTab, liveWriteArmed: false })
  }

  const setTargetMode = (targetMode: FlightRecorderSearchState["targetMode"]) => {
    updateSearch({ targetMode, liveWriteArmed: false })
  }

  const setLiveWriteArmed = (liveWriteArmed: boolean) => {
    if (sessionView?.artifacts.relay?.mode !== "live") {
      return
    }

    if (
      liveWriteArmed &&
      window.confirm(
        "Arm live relay writes? This enables an outbound relay/pay request to the current live target."
      )
    ) {
      updateSearch({ liveWriteArmed: true })
      setPageMessage("Live relay writes armed for the current session.")
      return
    }

    if (!liveWriteArmed) {
      updateSearch({ liveWriteArmed: false })
      setPageMessage("Live relay writes disarmed.")
    }
  }

  const resetBuilder = () => {
    updateSearch(defaultFlightRecorderSearch)
    setImportJson(defaultFlightRecorderSearch.importJson)
    setPayDraftFields(createDefaultFlightRecorderPayDraftFields())
    setImportError("")
    setQrImageError("")
    setQrImageName("")
    setPageMessage("")
    setSession(null)
  }

  const requiresLiveWriteArm =
    sessionView?.artifacts.relay?.mode === "live" && !sessionView.artifacts.relay.liveWriteArmed

  return {
    search,
    sessionView,
    selectedTrace,
    updateSearch,
    importJson,
    importError,
    qrImageError,
    qrImageName,
    qrImageDecodePending,
    pageMessage,
    buildSessionMutation,
    ignoredLiveFaults,
    setSourceTab,
    setTargetMode,
    setImportJson,
    loadQrImage,
    loadImportFile,
    importSession,
    buildSession,
    toggleFault,
    resetBuilder,
    payDraftFields,
    requiresLiveWriteArm,
    statusMutation,
    payMutation,
    setPayDraftFields,
    setLiveWriteArmed,
    exportSession,
  }
}
