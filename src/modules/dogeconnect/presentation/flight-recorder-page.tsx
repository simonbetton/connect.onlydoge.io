import { Link } from "@tanstack/react-router"
import { PageHero } from "@/components/page-hero"
import { PageJumpNav } from "@/components/page-jump-nav"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button-variants"
import { toolsMockSearch, toolsQrValidatorSearch } from "./deep-link-builders"
import { FlightRecorderExecutionControlsPanel } from "./flight-recorder-execution-controls-panel"
import { FlightRecorderInspectorPanel } from "./flight-recorder-inspector-panel"
import { badgeVariantForVerdict } from "./flight-recorder-page-utils"
import { FlightRecorderSessionBuilder } from "./flight-recorder-session-builder"
import { FlightRecorderTimelinePanel } from "./flight-recorder-timeline-panel"
import { useFlightRecorderPage } from "./use-flight-recorder-page"

const sectionNavItems = [
  { href: "#session-builder", label: "Builder" },
  { href: "#timeline", label: "Timeline" },
  { href: "#inspector", label: "Inspector" },
  { href: "#execution", label: "Execution" },
] as const

export function FlightRecorderPage() {
  const page = useFlightRecorderPage()
  const qrUri = page.search.qrUri.trim()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <PageHero
        title="Flight Recorder"
        description="Build replayable DogeConnect sessions that trace QR parsing, envelope fetch and verification, relay targeting, and pay/status execution against simulator or live endpoints."
        aside={
          <>
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
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          <Link to="/tools" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Open Tools
          </Link>
          <Link
            to="/tools"
            hash="mock-fixture"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Mock fixture in Tools
          </Link>
          {qrUri ? (
            <Link
              to="/tools"
              search={toolsQrValidatorSearch(qrUri)}
              hash="qr-validator"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Validate URI in Tools
            </Link>
          ) : null}
          {page.search.mockPaymentId.trim() ? (
            <Link
              to="/tools"
              search={toolsMockSearch(page.search.mockPaymentId.trim())}
              hash="mock-fixture"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open mock in Tools
            </Link>
          ) : null}
        </div>
      </PageHero>

      <PageJumpNav items={[...sectionNavItems]} ariaLabel="Flight Recorder sections" />

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
