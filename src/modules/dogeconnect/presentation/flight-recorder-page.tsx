import { Badge } from "@/components/ui/badge"
import { FlightRecorderExecutionControlsPanel } from "./flight-recorder-execution-controls-panel"
import { FlightRecorderInspectorPanel } from "./flight-recorder-inspector-panel"
import { badgeVariantForVerdict } from "./flight-recorder-page-utils"
import { FlightRecorderSessionBuilder } from "./flight-recorder-session-builder"
import { FlightRecorderTimelinePanel } from "./flight-recorder-timeline-panel"
import { useFlightRecorderPage } from "./use-flight-recorder-page"

export function FlightRecorderPage() {
  const page = useFlightRecorderPage()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="rounded-3xl border border-border/70 bg-linear-to-br from-amber-100/75 via-background to-orange-100/75 p-6">
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
                page.sessionView
                  ? badgeVariantForVerdict(page.sessionView.summary.verdict)
                  : "neutral"
              }
            >
              {page.sessionView ? page.sessionView.summary.verdict : "idle"}
            </Badge>
            <Badge variant={page.search.targetMode === "live" ? "warning" : "neutral"}>
              {page.search.targetMode === "live" ? "builder: live target" : "builder: simulator"}
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <FlightRecorderSessionBuilder
          search={page.search}
          importJson={page.importJson}
          importError={page.importError}
          qrImageError={page.qrImageError}
          qrImageName={page.qrImageName}
          qrImageDecodePending={page.qrImageDecodePending}
          pageMessage={page.pageMessage}
          buildPending={page.buildSessionMutation.isPending}
          buildError={page.buildSessionMutation.error?.message}
          ignoredLiveFaultCount={page.ignoredLiveFaults.length}
          onUpdateSearch={page.updateSearch}
          onSetSourceTab={page.setSourceTab}
          onSetTargetMode={page.setTargetMode}
          onSetImportJson={page.setImportJson}
          onLoadQrImage={page.loadQrImage}
          onLoadImportFile={page.loadImportFile}
          onImportSession={page.importSession}
          onBuildSession={() => {
            void page.buildSession()
          }}
          onToggleFault={page.toggleFault}
          onResetBuilder={page.resetBuilder}
        />

        <FlightRecorderTimelinePanel
          sessionView={page.sessionView}
          selectedTrace={page.selectedTrace}
          onSelectTrace={(traceId) => page.updateSearch({ selectedTraceId: traceId })}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <FlightRecorderInspectorPanel
          sessionView={page.sessionView}
          selectedTrace={page.selectedTrace}
        />

        <FlightRecorderExecutionControlsPanel
          sessionView={page.sessionView}
          search={page.search}
          payDraftFields={page.payDraftFields}
          requiresLiveWriteArm={page.requiresLiveWriteArm}
          statusMutation={page.statusMutation}
          payMutation={page.payMutation}
          onUpdateSearch={page.updateSearch}
          onSetPayDraftFields={page.setPayDraftFields}
          onSetLiveWriteArmed={page.setLiveWriteArmed}
          onExportSession={page.exportSession}
        />
      </div>
    </div>
  )
}
