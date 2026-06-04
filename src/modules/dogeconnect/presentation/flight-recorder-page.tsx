import { useMutation } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import * as React from "react"
import { JsonCodeBlock } from "@/components/json-code-block"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type {
  BuildFlightRecorderSessionInput,
  FlightRecorderFaultPreset,
  FlightRecorderSessionExport,
  FlightRecorderSessionV1,
} from "@/modules/dogeconnect/application/flight-recorder-contracts"
import {
  exportFlightRecorderSession,
  parseImportedFlightRecorderSession,
} from "@/modules/dogeconnect/application/flight-recorder-session"
import {
  cleanFlightRecorderSearch,
  defaultFlightRecorderSearch,
  type FlightRecorderSearchState,
  resolveFlightRecorderSearch,
} from "./flight-recorder-search"
import { decodeQrTextFromImageFile } from "./qr-image-decoder"

const READ_SAFE_FAULTS: Array<{
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

const SIMULATOR_FAULTS: Array<{
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

const SIMULATOR_FAULT_VALUES = new Set(SIMULATOR_FAULTS.map((fault) => fault.value))

export function FlightRecorderPage() {
  const rawSearch = useSearch({ from: "/flight-recorder" })
  const search = resolveFlightRecorderSearch(rawSearch)
  const navigate = useNavigate({ from: "/flight-recorder" })
  const [importError, setImportError] = React.useState("")
  const [qrImageError, setQrImageError] = React.useState("")
  const [qrImageName, setQrImageName] = React.useState("")
  const [qrImageDecodePending, setQrImageDecodePending] = React.useState(false)
  const [session, setSession] = React.useState<FlightRecorderSessionV1 | null>(null)
  const [pageMessage, setPageMessage] = React.useState("")
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
    () => applySearchStateToSession(session, search),
    [search, session]
  )

  const updateSearch = React.useEffectEvent((patch: Partial<FlightRecorderSearchState>) => {
    React.startTransition(() => {
      void navigate({
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
  })

  const buildSessionMutation = useMutation({
    mutationFn: (payload: BuildFlightRecorderSessionInput) =>
      postJson<FlightRecorderSessionV1>("/api/flight-recorder/session", payload),
    onSuccess: (nextSession) => {
      setSession(nextSession)
      setImportError("")
      setPageMessage("Flight Recorder session built successfully.")
      updateSearch({
        ...payDraftSearchPatch(nextSession),
        liveWriteArmed: false,
        selectedTraceId: nextSession.trace.at(-1)?.id ?? "",
      })
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
    },
  })

  React.useEffect(() => {
    if (!sessionView) {
      return
    }

    const selected = search.selectedTraceId
    const hasSelectedTrace = Boolean(
      selected && sessionView.trace.some((entry) => entry.id === selected)
    )
    if (hasSelectedTrace) {
      return
    }

    const fallback = sessionView.trace.at(-1)?.id ?? ""
    if (fallback) {
      updateSearch({ selectedTraceId: fallback })
    }
  }, [search.selectedTraceId, sessionView])

  const runStatusCheck = React.useEffectEvent(() => {
    if (!sessionView || !sessionView.artifacts.relay || statusMutation.isPending) {
      return
    }

    void statusMutation.mutateAsync(sessionView)
  })

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
  }, [search.autoPoll, search.pollIntervalSec, sessionView?.artifacts.relay])

  const selectedTrace =
    sessionView?.trace.find((entry) => entry.id === search.selectedTraceId) ??
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
      parsedJson = JSON.parse(search.importJson)
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
    updateSearch({ importJson: text })
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
    if (!sessionView?.artifacts.relay || sessionView.artifacts.relay.mode !== "live") {
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

  const requiresLiveWriteArm =
    sessionView?.artifacts.relay?.mode === "live" && !sessionView.artifacts.relay.liveWriteArmed

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-amber-100/75 via-background to-orange-100/75 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Flight Recorder</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Build replayable DogeConnect sessions that trace QR parsing, envelope fetch and
              verification, relay targeting, and pay/status execution against simulator or live
              endpoints.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                sessionView ? badgeVariantForVerdict(sessionView.summary.verdict) : "neutral"
              }
            >
              {sessionView ? sessionView.summary.verdict : "idle"}
            </Badge>
            <Badge variant={search.targetMode === "live" ? "warning" : "neutral"}>
              {search.targetMode === "live" ? "builder: live target" : "builder: simulator"}
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard
          title="Session Builder"
          description="Create a new trace from a QR URI, mock fixture, or imported JSON session."
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {(["qr", "mock", "import"] as const).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  variant={search.sourceTab === tab ? "default" : "outline"}
                  onClick={() => setSourceTab(tab)}
                >
                  {tab === "qr" ? "QR URI" : tab === "mock" ? "Mock Fixture" : "Import JSON"}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Target Mode</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TargetModeCard
                  active={search.targetMode === "simulator"}
                  title="Simulator"
                  description="Safe local relay responses with deterministic execution presets."
                  onClick={() => setTargetMode("simulator")}
                />
                <TargetModeCard
                  active={search.targetMode === "live"}
                  title="Live target"
                  description="Reads the resolved live relay. Outbound pay writes stay blocked until you arm them."
                  onClick={() => setTargetMode("live")}
                />
              </div>
            </div>

            {search.targetMode === "live" ? (
              <LiveModeNotice ignoredFaultCount={ignoredLiveFaults.length} />
            ) : null}

            {search.sourceTab === "qr" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Dogecoin URI
                  </p>
                  <Textarea
                    value={search.qrUri}
                    onChange={(event) => updateSearch({ qrUri: event.target.value })}
                    rows={5}
                    placeholder="dogecoin:DPD7...?amount=12.25&dc=example.com/dc/id&h=..."
                  />
                </div>
                <div className="space-y-3 rounded-2xl border border-dashed border-border/70 bg-background/50 p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      QR Image Upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pick a QR image to decode it locally in your browser. Nothing is sent to the
                      server.
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={qrImageDecodePending}
                    onChange={(event) => {
                      const input = event.currentTarget
                      void loadQrImage(input.files?.[0] ?? null)
                      input.value = ""
                    }}
                  />
                  {qrImageName ? (
                    <p className="text-xs text-muted-foreground">
                      {qrImageDecodePending
                        ? `Decoding ${qrImageName} locally...`
                        : `Last image: ${qrImageName}`}
                    </p>
                  ) : null}
                  {qrImageError ? <p className="text-sm text-rose-700">{qrImageError}</p> : null}
                </div>
              </div>
            ) : null}

            {search.sourceTab === "mock" ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Mock Payment ID
                </p>
                <Input
                  value={search.mockPaymentId}
                  onChange={(event) => updateSearch({ mockPaymentId: event.target.value })}
                  placeholder="Optional stable payment ID"
                />
              </div>
            ) : null}

            {search.sourceTab === "import" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Session JSON
                  </p>
                  <Textarea
                    value={search.importJson}
                    onChange={(event) => updateSearch({ importJson: event.target.value })}
                    rows={8}
                    placeholder='{"version":"flight-recorder/v1", ...}'
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) => {
                      void loadImportFile(event.target.files?.[0] ?? null)
                    }}
                  />
                  <Button type="button" onClick={importSession}>
                    Import Session
                  </Button>
                </div>
                {importError ? <p className="text-sm text-rose-700">{importError}</p> : null}
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={search.includeInitialStatus}
                onChange={(event) => updateSearch({ includeInitialStatus: event.target.checked })}
                className="size-4 rounded border-border accent-amber-500"
              />
              Include an initial status read after session build
            </label>

            <FaultSelector
              title="Read-safe fault presets"
              faults={READ_SAFE_FAULTS}
              selectedFaults={search.selectedFaults}
              onToggle={toggleFault}
            />
            <FaultSelector
              title="Simulator execution presets"
              faults={SIMULATOR_FAULTS}
              selectedFaults={search.selectedFaults}
              onToggle={toggleFault}
              disabled={search.targetMode === "live"}
              disabledHint="Ignored while live target mode is selected. Switch back to simulator to use these presets."
            />

            <div className="flex flex-wrap gap-2">
              {search.sourceTab === "import" ? null : (
                <Button
                  type="button"
                  onClick={() => {
                    void buildSession()
                  }}
                  disabled={buildSessionMutation.isPending}
                >
                  {buildSessionMutation.isPending ? "Building..." : "Build Session"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  updateSearch(defaultFlightRecorderSearch)
                  setImportError("")
                  setQrImageError("")
                  setQrImageName("")
                  setPageMessage("")
                  setSession(null)
                }}
              >
                Reset Builder
              </Button>
            </div>

            {buildSessionMutation.error ? (
              <p className="text-sm text-rose-700">{buildSessionMutation.error.message}</p>
            ) : null}
            {pageMessage ? <p className="text-sm text-emerald-700">{pageMessage}</p> : null}
          </div>
        </PanelCard>

        <PanelCard
          title="Timeline"
          description="Trace each protocol step, compare verdicts, and jump into the inspector."
        >
          {sessionView ? (
            <div className="space-y-4">
              <SessionSummaryView session={sessionView} />
              <div className="space-y-2">
                {sessionView.trace.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => updateSearch({ selectedTraceId: entry.id })}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selectedTrace?.id === entry.id
                        ? "border-amber-400 bg-amber-50"
                        : "border-border/70 bg-background/60 hover:border-amber-300 hover:bg-amber-50/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatPhaseLabel(entry.phase)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.target} · {entry.durationMs}ms
                        </p>
                      </div>
                      <Badge variant={badgeVariantForVerdict(entry.verdict)}>{entry.verdict}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entry.responseSummary.note}
                    </p>
                    {entry.issues.length > 0 ? (
                      <p className="mt-2 text-xs text-rose-700">
                        {entry.issues[0]?.field}: {entry.issues[0]?.message}
                      </p>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <EmptyPanelMessage message="Build or import a session to populate the timeline." />
          )}
        </PanelCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard
          title="Inspector"
          description="Inspect the selected trace entry and the normalized artifacts carried through the session."
        >
          {sessionView && selectedTrace ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={badgeVariantForVerdict(selectedTrace.verdict)}>
                  {selectedTrace.verdict}
                </Badge>
                <Badge variant="neutral">{formatPhaseLabel(selectedTrace.phase)}</Badge>
              </div>
              <JsonSection title="Selected Request" value={selectedTrace.requestSummary.body} />
              <JsonSection title="Selected Response" value={selectedTrace.responseSummary.body} />
              <JsonSection title="Parsed QR" value={sessionView.artifacts.qr} />
              <JsonSection title="Envelope Artifact" value={sessionView.artifacts.envelope} />
              <JsonSection title="Payment Artifact" value={sessionView.artifacts.payment} />
              <JsonSection title="Relay Target" value={sessionView.artifacts.relay} />
              <JsonSection title="Pay Draft" value={sessionView.artifacts.payDraft} />
            </div>
          ) : (
            <EmptyPanelMessage message="Select a trace item to inspect its request, response, and artifacts." />
          )}
        </PanelCard>

        <PanelCard
          title="Execution Controls"
          description="Run pay/status against the resolved relay target, export sessions, and manage live-write arming."
        >
          {sessionView ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Current relay target</p>
                    <p className="text-xs text-muted-foreground">
                      {sessionView.artifacts.relay?.statusUrl || "No relay target derived"}
                    </p>
                  </div>
                  <Badge
                    variant={sessionView.artifacts.relay?.liveWriteArmed ? "danger" : "neutral"}
                  >
                    {sessionView.artifacts.relay?.liveWriteArmed ? "live writes armed" : "disarmed"}
                  </Badge>
                </div>
                {sessionView.artifacts.relay?.mode === "live" ? (
                  <div className="mt-4 space-y-3 rounded-2xl border border-amber-300/80 bg-amber-50/80 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Live relay write gate</p>
                      <p className="text-xs text-muted-foreground">
                        Status checks are safe live reads. Pay requests stay disabled until you arm
                        outbound writes for this session.
                      </p>
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div>
                        <p className="font-medium text-foreground">Status URL</p>
                        <p>{sessionView.artifacts.relay.statusUrl}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Pay URL</p>
                        <p>{sessionView.artifacts.relay.payUrl}</p>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 rounded-2xl border border-amber-300/80 bg-background/80 p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={sessionView.artifacts.relay.liveWriteArmed}
                        onChange={(event) => setLiveWriteArmed(event.target.checked)}
                        aria-label="Arm outbound pay requests to this live relay"
                        className="mt-0.5 size-4 rounded border-border accent-amber-500"
                      />
                      <span className="space-y-1">
                        <span className="block font-medium text-foreground">
                          Arm outbound pay requests to this live relay
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Leave this off to inspect the live target without sending a pay request.
                        </span>
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Pay Draft</p>
                <Input
                  value={sessionView.artifacts.payDraft?.id ?? ""}
                  onChange={(event) => updateSearch({ payDraftId: event.target.value })}
                  placeholder="Payment ID"
                />
                <Textarea
                  value={sessionView.artifacts.payDraft?.tx ?? ""}
                  onChange={(event) => updateSearch({ payDraftTx: event.target.value })}
                  rows={4}
                  placeholder="Hex transaction"
                />
                <Input
                  value={sessionView.artifacts.payDraft?.relay_token ?? ""}
                  onChange={(event) => updateSearch({ payDraftRelayToken: event.target.value })}
                  placeholder="relay_token"
                />
                <Input
                  value={sessionView.artifacts.payDraft?.refund ?? ""}
                  onChange={(event) => updateSearch({ payDraftRefund: event.target.value })}
                  placeholder="Refund address"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void statusMutation.mutateAsync(sessionView)
                  }}
                  disabled={!sessionView.artifacts.relay || statusMutation.isPending}
                >
                  {statusMutation.isPending
                    ? "Running..."
                    : sessionView.artifacts.relay?.mode === "live"
                      ? "Read Live Status"
                      : "Run Status Check"}
                </Button>
                <Button
                  type="button"
                  variant={sessionView.artifacts.relay?.mode === "live" ? "destructive" : "default"}
                  onClick={() => {
                    void payMutation.mutateAsync(sessionView)
                  }}
                  disabled={
                    !sessionView.artifacts.payDraft || payMutation.isPending || requiresLiveWriteArm
                  }
                >
                  {payMutation.isPending
                    ? "Submitting..."
                    : sessionView.artifacts.relay?.mode === "live"
                      ? "Submit Live Pay"
                      : "Submit Pay"}
                </Button>
              </div>

              {requiresLiveWriteArm ? (
                <p className="text-sm text-amber-800">
                  Arm live relay writes above to enable pay submission against the live target.
                </p>
              ) : null}

              <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={search.autoPoll}
                    onChange={(event) => updateSearch({ autoPoll: event.target.checked })}
                    className="size-4 rounded border-border accent-amber-500"
                  />
                  Auto-poll status
                </label>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Poll Interval (seconds)
                  </p>
                  <Input
                    type="number"
                    min={1}
                    value={search.pollIntervalSec}
                    onChange={(event) => {
                      updateSearch({
                        pollIntervalSec: Math.max(1, Number(event.target.value) || 1),
                      })
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => exportSession("sanitized")}>
                  Export Sanitized JSON
                </Button>
                <Button type="button" variant="outline" onClick={() => exportSession("full")}>
                  Export Full JSON
                </Button>
              </div>

              {statusMutation.error ? (
                <p className="text-sm text-rose-700">{statusMutation.error.message}</p>
              ) : null}
              {payMutation.error ? (
                <p className="text-sm text-rose-700">{payMutation.error.message}</p>
              ) : null}
            </div>
          ) : (
            <EmptyPanelMessage message="Build or import a session to enable execution controls." />
          )}
        </PanelCard>
      </div>
    </div>
  )
}

function FaultSelector({
  title,
  faults,
  selectedFaults,
  onToggle,
  disabled = false,
  disabledHint,
}: {
  title: string
  faults: Array<{ value: FlightRecorderFaultPreset; label: string; hint: string }>
  selectedFaults: FlightRecorderFaultPreset[]
  onToggle: (fault: FlightRecorderFaultPreset) => void
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {faults.map((fault) => (
          <label
            key={fault.value}
            className={`flex items-start gap-3 rounded-2xl border p-3 ${
              disabled
                ? "border-border/60 bg-muted/40 opacity-70"
                : "border-border/70 bg-background/60"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedFaults.includes(fault.value)}
              onChange={() => onToggle(fault.value)}
              disabled={disabled}
              aria-label={fault.label}
              className="mt-0.5 size-4 rounded border-border accent-amber-500"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-foreground">{fault.label}</span>
              <span className="block text-xs text-muted-foreground">
                {disabled ? disabledHint || fault.hint : fault.hint}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

function PanelCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function TargetModeCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-amber-400 bg-amber-50"
          : "border-border/70 bg-background/60 hover:border-amber-300 hover:bg-amber-50/60"
      }`}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </button>
  )
}

function LiveModeNotice({ ignoredFaultCount }: { ignoredFaultCount: number }) {
  return (
    <div className="rounded-2xl border border-amber-300/80 bg-amber-50/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Live target mode</Badge>
        <Badge variant="neutral">Read-only until armed</Badge>
      </div>
      <p className="mt-3 text-sm text-foreground">
        Builds in this mode resolve the real relay target from the QR or imported session. Status
        reads can hit live infrastructure, and pay submission stays blocked until you explicitly arm
        outbound writes for the built session.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {ignoredFaultCount > 0
          ? `${ignoredFaultCount} simulator preset${ignoredFaultCount === 1 ? "" : "s"} remain selected in the URL but will be ignored while live mode is active.`
          : "Simulator execution presets are disabled here and will reactivate if you switch back to simulator mode."}
      </p>
    </div>
  )
}

function SessionSummaryView({ session }: { session: FlightRecorderSessionV1 }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={badgeVariantForVerdict(session.summary.verdict)}>
          {session.summary.verdict}
        </Badge>
        <Badge variant="neutral">{session.meta.sourceMode}</Badge>
        <Badge variant="neutral">{session.meta.targetMode}</Badge>
      </div>
      <p className="mt-3 text-sm text-foreground">
        {session.summary.firstFailingStep
          ? `First divergence: ${formatPhaseLabel(session.summary.firstFailingStep)}`
          : "No failing trace step detected."}
      </p>
      <div className="mt-2 space-y-1">
        {session.summary.likelyCauses.map((cause) => (
          <p key={cause} className="text-xs text-muted-foreground">
            {cause}
          </p>
        ))}
      </div>
    </div>
  )
}

function JsonSection({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
      <JsonCodeBlock
        filename={`${title.toLowerCase().replaceAll(" ", "-")}.json`}
        value={JSON.stringify(value, null, 2)}
      />
    </div>
  )
}

function EmptyPanelMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
      {message}
    </div>
  )
}

const badgeVariantForVerdict = (verdict: "pass" | "warn" | "fail") =>
  verdict === "pass" ? "success" : verdict === "warn" ? "warning" : "danger"

const formatPhaseLabel = (phase: string): string =>
  phase.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())

const applySearchStateToSession = (
  session: FlightRecorderSessionV1 | null,
  search: FlightRecorderSearchState
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
        tx: search.payDraftTx ?? session.artifacts.payDraft.tx,
        relay_token: search.payDraftRelayToken ?? session.artifacts.payDraft.relay_token,
        refund: search.payDraftRefund ?? session.artifacts.payDraft.refund,
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

const payDraftSearchPatch = (
  session: FlightRecorderSessionV1
): Pick<
  FlightRecorderSearchState,
  "payDraftId" | "payDraftTx" | "payDraftRelayToken" | "payDraftRefund"
> => ({
  payDraftId: session.artifacts.payDraft?.id ?? "",
  payDraftTx: session.artifacts.payDraft?.tx ?? "",
  payDraftRelayToken: session.artifacts.payDraft?.relay_token ?? "",
  payDraftRefund: session.artifacts.payDraft?.refund ?? "",
})

const postJson = async <T,>(path: string, payload: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  const body = (await response.json()) as Record<string, unknown>
  if (!response.ok) {
    if (Array.isArray(body.errors)) {
      throw new Error(
        body.errors
          .map((issue) =>
            typeof issue === "object" &&
            issue &&
            "field" in issue &&
            "message" in issue &&
            typeof issue.field === "string" &&
            typeof issue.message === "string"
              ? `${issue.field}: ${issue.message}`
              : "Request failed"
          )
          .join("; ")
      )
    }

    if (typeof body.message === "string") {
      throw new Error(body.message)
    }

    throw new Error(`Request failed with ${response.status}`)
  }

  return body as T
}

const downloadJsonFile = (value: FlightRecorderSessionExport, filename: string) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
