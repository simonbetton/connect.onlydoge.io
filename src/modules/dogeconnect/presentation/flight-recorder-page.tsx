import { Badge } from "@/components/ui/badge"
import { FlightRecorderExecutionControlsPanel } from "./flight-recorder-execution-controls-panel"
import { FlightRecorderInspectorPanel } from "./flight-recorder-inspector-panel"
import { badgeVariantForVerdict } from "./flight-recorder-page-utils"
import { FlightRecorderSessionBuilder } from "./flight-recorder-session-builder"
import { FlightRecorderTimelinePanel } from "./flight-recorder-timeline-panel"
import { useFlightRecorderPage } from "./use-flight-recorder-page"

export function FlightRecorderPage() {
  const {
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
  } = useFlightRecorderPage()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-amber-100/75 via-background to-orange-100/75 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <h1 className="font-semibold text-2xl tracking-tight">Flight Recorder</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
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
        <FlightRecorderSessionBuilder
          search={search}
          importJson={importJson}
          importError={importError}
          qrImageError={qrImageError}
          qrImageName={qrImageName}
          qrImageDecodePending={qrImageDecodePending}
          pageMessage={pageMessage}
          buildPending={buildSessionMutation.isPending}
          buildError={buildSessionMutation.error?.message}
          ignoredLiveFaultCount={ignoredLiveFaults.length}
          onUpdateSearch={updateSearch}
          onSetSourceTab={setSourceTab}
          onSetTargetMode={setTargetMode}
          onSetImportJson={setImportJson}
          onLoadQrImage={loadQrImage}
          onLoadImportFile={loadImportFile}
          onImportSession={importSession}
          onBuildSession={() => {
            void buildSession()
          }}
          onToggleFault={toggleFault}
          onResetBuilder={resetBuilder}
        />

        <FlightRecorderTimelinePanel
          sessionView={sessionView}
          selectedTrace={selectedTrace}
          onSelectTrace={(traceId) => updateSearch({ selectedTraceId: traceId })}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <FlightRecorderInspectorPanel sessionView={sessionView} selectedTrace={selectedTrace} />

        <FlightRecorderExecutionControlsPanel
          sessionView={sessionView}
          search={search}
          payDraftFields={payDraftFields}
          requiresLiveWriteArm={requiresLiveWriteArm}
          statusMutation={statusMutation}
          payMutation={payMutation}
          onUpdateSearch={updateSearch}
          onSetPayDraftFields={setPayDraftFields}
          onSetLiveWriteArmed={setLiveWriteArmed}
          onExportSession={exportSession}
        />
      </div>
    </div>
  )
}
