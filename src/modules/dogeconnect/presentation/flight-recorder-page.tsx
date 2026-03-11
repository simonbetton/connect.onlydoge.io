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

export function FlightRecorderPage() {
  const rawSearch = useSearch({ from: "/flight-recorder" })
  const search = resolveFlightRecorderSearch(rawSearch)
  const navigate = useNavigate({ from: "/flight-recorder" })
  const [qrUri, setQrUri] = React.useState("")
  const [mockPaymentId, setMockPaymentId] = React.useState("")
  const [includeInitialStatus, setIncludeInitialStatus] = React.useState(true)
  const [selectedFaults, setSelectedFaults] = React.useState<FlightRecorderFaultPreset[]>([])
  const [importJson, setImportJson] = React.useState("")
  const [importError, setImportError] = React.useState("")
  const [session, setSession] = React.useState<FlightRecorderSessionV1 | null>(null)
  const [pageMessage, setPageMessage] = React.useState("")

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
      const normalized = withLiveWriteState(nextSession, false)
      setSession(normalized)
      setImportError("")
      setPageMessage("Flight Recorder session built successfully.")
      updateSearch({
        selectedTraceId: normalized.trace.at(-1)?.id ?? "",
      })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (currentSession: FlightRecorderSessionV1) =>
      postJson<FlightRecorderSessionV1>("/api/flight-recorder/relay/status", {
        session: currentSession,
      }),
    onSuccess: (nextSession) => {
      const normalized = withLiveWriteState(
        nextSession,
        session?.artifacts.relay?.liveWriteArmed ?? false
      )
      setSession(normalized)
      setPageMessage("Status trace appended.")
      updateSearch({
        selectedTraceId: normalized.trace.at(-1)?.id ?? "",
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
      const normalized = withLiveWriteState(
        nextSession,
        session?.artifacts.relay?.liveWriteArmed ?? false
      )
      setSession(normalized)
      setPageMessage("Pay trace appended.")
      updateSearch({
        selectedTraceId: normalized.trace.at(-1)?.id ?? "",
      })
    },
  })

  React.useEffect(() => {
    if (!session) {
      return
    }

    const selected = search.selectedTraceId
    const hasSelectedTrace = Boolean(
      selected && session.trace.some((entry) => entry.id === selected)
    )
    if (hasSelectedTrace) {
      return
    }

    const fallback = session.trace.at(-1)?.id ?? ""
    if (fallback) {
      updateSearch({ selectedTraceId: fallback })
    }
  }, [search.selectedTraceId, session])

  const runStatusCheck = React.useEffectEvent(() => {
    if (!session || !session.artifacts.relay || statusMutation.isPending) {
      return
    }

    void statusMutation.mutateAsync(session)
  })

  React.useEffect(() => {
    if (!search.autoPoll || !session?.artifacts.relay) {
      return
    }

    const intervalMs = Math.max(1, search.pollIntervalSec) * 1000
    const handle = window.setInterval(() => {
      runStatusCheck()
    }, intervalMs)

    return () => {
      window.clearInterval(handle)
    }
  }, [search.autoPoll, search.pollIntervalSec, session?.artifacts.relay])

  const selectedTrace =
    session?.trace.find((entry) => entry.id === search.selectedTraceId) ??
    session?.trace.at(-1) ??
    null

  const buildSession = async () => {
    setPageMessage("")
    setImportError("")

    const payload: BuildFlightRecorderSessionInput =
      search.sourceTab === "mock"
        ? {
            source: {
              mode: "mock",
              paymentId: mockPaymentId || undefined,
            },
            targetMode: search.targetMode,
            faults: selectedFaults,
            options: {
              includeInitialStatus,
            },
            origin: window.location.origin,
          }
        : {
            source: {
              mode: "qr",
              uri: qrUri,
            },
            targetMode: search.targetMode,
            faults: selectedFaults,
            options: {
              includeInitialStatus,
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

    const importedSession = withLiveWriteState(
      {
        ...parsed.value,
        source: {
          ...parsed.value.source,
          imported: true,
        },
      },
      false
    )

    setSession(importedSession)
    setPageMessage("Imported session loaded.")
    updateSearch({
      sourceTab: "import",
      targetMode: importedSession.meta.targetMode,
      selectedTraceId: importedSession.trace.at(-1)?.id ?? "",
    })
  }

  const toggleFault = (fault: FlightRecorderFaultPreset) => {
    setSelectedFaults((current) =>
      current.includes(fault) ? current.filter((value) => value !== fault) : [...current, fault]
    )
  }

  const loadImportFile = async (file: File | null) => {
    if (!file) {
      return
    }

    const text = await file.text()
    setImportJson(text)
  }

  const exportSession = (mode: "sanitized" | "full") => {
    if (!session) {
      return
    }

    const exported = exportFlightRecorderSession(session, mode)
    downloadJsonFile(exported, `flight-recorder-${mode}-${Date.now().toString(36)}.json`)
    setPageMessage(mode === "full" ? "Full session exported." : "Sanitized session exported.")
  }

  const setSourceTab = (sourceTab: FlightRecorderSearchState["sourceTab"]) => {
    updateSearch({ sourceTab })
    setSession((current) => (current ? withLiveWriteState(current, false) : current))
  }

  const setTargetMode = (targetMode: FlightRecorderSearchState["targetMode"]) => {
    updateSearch({ targetMode })
    setSession((current) => (current ? withLiveWriteState(current, false) : current))
  }

  const togglePanel = (
    key: keyof Pick<
      FlightRecorderSearchState,
      "builderExpanded" | "timelineExpanded" | "inspectorExpanded" | "controlsExpanded"
    >
  ) => {
    updateSearch({
      [key]: !search[key],
    } as Partial<FlightRecorderSearchState>)
  }

  const armLiveWrites = () => {
    if (!session?.artifacts.relay || session.artifacts.relay.mode !== "live") {
      return
    }

    if (
      window.confirm(
        "Arm live relay writes? This enables an outbound relay/pay request to the current live target."
      )
    ) {
      setSession((current) => (current ? withLiveWriteState(current, true) : current))
      setPageMessage("Live relay writes armed for the current session.")
    }
  }

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
            <Badge variant={session ? badgeVariantForVerdict(session.summary.verdict) : "neutral"}>
              {session ? session.summary.verdict : "idle"}
            </Badge>
            <Badge variant="neutral">{search.targetMode}</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard
          title="Session Builder"
          description="Create a new trace from a QR URI, mock fixture, or imported JSON session."
          expanded={search.builderExpanded}
          onToggle={() => togglePanel("builderExpanded")}
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
              <div className="flex flex-wrap gap-2">
                {(["simulator", "live"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={search.targetMode === mode ? "default" : "outline"}
                    onClick={() => setTargetMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            {search.sourceTab === "qr" ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase">Dogecoin URI</p>
                <Textarea
                  value={qrUri}
                  onChange={(event) => setQrUri(event.target.value)}
                  rows={5}
                  placeholder="dogecoin:DPD7...?amount=12.25&dc=example.com/dc/id&h=..."
                />
              </div>
            ) : null}

            {search.sourceTab === "mock" ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Mock Payment ID
                </p>
                <Input
                  value={mockPaymentId}
                  onChange={(event) => setMockPaymentId(event.target.value)}
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
                    value={importJson}
                    onChange={(event) => setImportJson(event.target.value)}
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
                checked={includeInitialStatus}
                onChange={(event) => setIncludeInitialStatus(event.target.checked)}
                className="size-4 rounded border-border accent-amber-500"
              />
              Include an initial status read after session build
            </label>

            <FaultSelector
              title="Read-safe fault presets"
              faults={READ_SAFE_FAULTS}
              selectedFaults={selectedFaults}
              onToggle={toggleFault}
            />
            <FaultSelector
              title="Simulator execution presets"
              faults={SIMULATOR_FAULTS}
              selectedFaults={selectedFaults}
              onToggle={toggleFault}
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
                  setQrUri("")
                  setMockPaymentId("")
                  setImportJson("")
                  setSelectedFaults([])
                  setIncludeInitialStatus(true)
                  setImportError("")
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
          expanded={search.timelineExpanded}
          onToggle={() => togglePanel("timelineExpanded")}
        >
          {session ? (
            <div className="space-y-4">
              <SessionSummaryView session={session} />
              <div className="space-y-2">
                {session.trace.map((entry) => (
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
          expanded={search.inspectorExpanded}
          onToggle={() => togglePanel("inspectorExpanded")}
        >
          {session && selectedTrace ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={badgeVariantForVerdict(selectedTrace.verdict)}>
                  {selectedTrace.verdict}
                </Badge>
                <Badge variant="neutral">{formatPhaseLabel(selectedTrace.phase)}</Badge>
              </div>
              <JsonSection title="Selected Request" value={selectedTrace.requestSummary.body} />
              <JsonSection title="Selected Response" value={selectedTrace.responseSummary.body} />
              <JsonSection title="Parsed QR" value={session.artifacts.qr} />
              <JsonSection title="Envelope Artifact" value={session.artifacts.envelope} />
              <JsonSection title="Payment Artifact" value={session.artifacts.payment} />
              <JsonSection title="Relay Target" value={session.artifacts.relay} />
              <JsonSection title="Pay Draft" value={session.artifacts.payDraft} />
            </div>
          ) : (
            <EmptyPanelMessage message="Select a trace item to inspect its request, response, and artifacts." />
          )}
        </PanelCard>

        <PanelCard
          title="Execution Controls"
          description="Run pay/status against the resolved relay target, export sessions, and manage live-write arming."
          expanded={search.controlsExpanded}
          onToggle={() => togglePanel("controlsExpanded")}
        >
          {session ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Current relay target</p>
                    <p className="text-xs text-muted-foreground">
                      {session.artifacts.relay?.statusUrl || "No relay target derived"}
                    </p>
                  </div>
                  <Badge variant={session.artifacts.relay?.liveWriteArmed ? "danger" : "neutral"}>
                    {session.artifacts.relay?.liveWriteArmed ? "live writes armed" : "disarmed"}
                  </Badge>
                </div>
                {session.artifacts.relay?.mode === "live" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="destructive" onClick={armLiveWrites}>
                      Arm Live Writes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setSession((current) =>
                          current ? withLiveWriteState(current, false) : current
                        )
                      }
                    >
                      Disarm
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Pay Draft</p>
                <Input
                  value={session.artifacts.payDraft?.id ?? ""}
                  onChange={(event) => {
                    setSession((current) => updatePayDraft(current, "id", event.target.value))
                  }}
                  placeholder="Payment ID"
                />
                <Textarea
                  value={session.artifacts.payDraft?.tx ?? ""}
                  onChange={(event) => {
                    setSession((current) => updatePayDraft(current, "tx", event.target.value))
                  }}
                  rows={4}
                  placeholder="Hex transaction"
                />
                <Input
                  value={session.artifacts.payDraft?.relay_token ?? ""}
                  onChange={(event) => {
                    setSession((current) =>
                      updatePayDraft(current, "relay_token", event.target.value)
                    )
                  }}
                  placeholder="relay_token"
                />
                <Input
                  value={session.artifacts.payDraft?.refund ?? ""}
                  onChange={(event) => {
                    setSession((current) => updatePayDraft(current, "refund", event.target.value))
                  }}
                  placeholder="Refund address"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void statusMutation.mutateAsync(session)
                  }}
                  disabled={!session.artifacts.relay || statusMutation.isPending}
                >
                  {statusMutation.isPending ? "Running..." : "Run Status Check"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    void payMutation.mutateAsync(session)
                  }}
                  disabled={!session.artifacts.payDraft || payMutation.isPending}
                >
                  {payMutation.isPending ? "Submitting..." : "Submit Pay"}
                </Button>
              </div>

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
}: {
  title: string
  faults: Array<{ value: FlightRecorderFaultPreset; label: string; hint: string }>
  selectedFaults: FlightRecorderFaultPreset[]
  onToggle: (fault: FlightRecorderFaultPreset) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {faults.map((fault) => (
          <label
            key={fault.value}
            className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/60 p-3"
          >
            <input
              type="checkbox"
              checked={selectedFaults.includes(fault.value)}
              onChange={() => onToggle(fault.value)}
              className="mt-0.5 size-4 rounded border-border accent-amber-500"
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium text-foreground">{fault.label}</span>
              <span className="block text-xs text-muted-foreground">{fault.hint}</span>
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
  expanded,
  onToggle,
  children,
}: {
  title: string
  description: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onToggle}>
            {expanded ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>
      {expanded ? <CardContent>{children}</CardContent> : null}
    </Card>
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

const updatePayDraft = (
  session: FlightRecorderSessionV1 | null,
  field: "id" | "tx" | "refund" | "relay_token",
  value: string
): FlightRecorderSessionV1 | null => {
  if (!session?.artifacts.payDraft) {
    return session
  }

  return {
    ...session,
    artifacts: {
      ...session.artifacts,
      payDraft: {
        ...session.artifacts.payDraft,
        [field]: value,
      },
    },
  }
}

const withLiveWriteState = (
  session: FlightRecorderSessionV1,
  liveWriteArmed: boolean
): FlightRecorderSessionV1 => ({
  ...session,
  artifacts: {
    ...session.artifacts,
    relay: session.artifacts.relay
      ? {
          ...session.artifacts.relay,
          liveWriteArmed,
        }
      : null,
  },
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
