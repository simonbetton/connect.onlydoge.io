import { Link } from "@tanstack/react-router"
import type { PageJumpNavItem } from "@/components/page-jump-nav"
import { buttonVariants } from "@/components/ui/button-variants"
import { Paragraph } from "@/components/ui/paragraph"
import {
  WorkbenchHeader,
  WorkbenchPageLayout,
  WorkbenchSection,
  WorkbenchShell,
} from "@/components/workbench-shell"
import { toolsMockSearch, toolsQrValidatorSearch } from "./deep-link-builders"
import { FlightRecorderExecutionControlsPanel } from "./flight-recorder-execution-controls-panel"
import { FlightRecorderInspectorPanel } from "./flight-recorder-inspector-panel"
import { verdictTextClass } from "./flight-recorder-page-utils"
import { FlightRecorderSessionBuilder } from "./flight-recorder-session-builder"
import { FlightRecorderTimelinePanel } from "./flight-recorder-timeline-panel"
import { useFlightRecorderPage } from "./use-flight-recorder-page"

const sectionNavItems: PageJumpNavItem[] = [
  { href: "#session-builder", label: "Session" },
  { href: "#timeline", label: "Trace" },
  { href: "#inspect-execute", label: "Inspect" },
]

function FlightRecorderPipelineMeta({
  verdict,
  targetMode,
}: {
  verdict?: "pass" | "warn" | "fail"
  targetMode: "live" | "simulator"
}) {
  return (
    <Paragraph size="xs" className="rounded-full border border-border/70 bg-muted/45 px-3 py-1">
      {verdict ? (
        <>
          <Paragraph as="span" size="inherit" color="inherit" className={verdictTextClass(verdict)}>
            {verdict}
          </Paragraph>
          <span aria-hidden> · </span>
        </>
      ) : (
        <>
          <span>build</span>
          <span aria-hidden> → </span>
          <span>trace</span>
          <span aria-hidden> → </span>
          <span>inspect</span>
          <span aria-hidden> · </span>
        </>
      )}
      <span>{targetMode === "live" ? "live target" : "simulator"}</span>
    </Paragraph>
  )
}

export function FlightRecorderPage() {
  const page = useFlightRecorderPage()
  const qrUri = page.search.qrUri.trim()

  return (
    <WorkbenchShell
      header={
        <WorkbenchHeader
          title="Flight Recorder"
          description="A trace-first debugging cockpit for building sessions, reading protocol events, inspecting artifacts, and safely running relay calls."
          aside={
            <FlightRecorderPipelineMeta
              verdict={page.sessionView?.summary.verdict}
              targetMode={page.search.targetMode}
            />
          }
          actions={
            <>
              <Link to="/tools" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Paragraph as="span" size="sm-medium" color="inherit">
                  Tools
                </Paragraph>
              </Link>
              {qrUri ? (
                <Link
                  to="/tools"
                  search={toolsQrValidatorSearch(qrUri)}
                  hash="qr-validator"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Paragraph as="span" size="sm-medium" color="inherit">
                    Validate URI
                  </Paragraph>
                </Link>
              ) : null}
              {page.search.mockPaymentId.trim() ? (
                <Link
                  to="/tools"
                  search={toolsMockSearch(page.search.mockPaymentId.trim())}
                  hash="mock-fixture"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Paragraph as="span" size="sm-medium" color="inherit">
                    Open mock
                  </Paragraph>
                </Link>
              ) : null}
            </>
          }
        />
      }
    >
      <WorkbenchPageLayout
        sectionNavItems={sectionNavItems}
        sectionNavAriaLabel="Flight Recorder sections"
      >
        <WorkbenchSection
          id="session-builder"
          title="Compose the session"
          description="Start from a QR URI, mock fixture, or imported JSON, then choose simulator or live target mode."
        >
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
        </WorkbenchSection>

        <WorkbenchSection
          id="timeline"
          title="Read the trace"
          description="Review each protocol step, compare verdicts, and select entries for forensic inspection."
        >
          <FlightRecorderTimelinePanel
            sessionView={page.sessionView}
            selectedTrace={page.selectedTrace}
            onSelectTrace={(traceId) => page.updateSearch({ selectedTraceId: traceId })}
          />
        </WorkbenchSection>

        <WorkbenchSection
          id="inspect-execute"
          title="Inspect and execute"
          description="Drill into normalized artifacts, run status checks, export evidence, or arm controlled pay submission."
        >
          <div className="grid min-w-0 gap-(--space-md) xl:grid-cols-2 xl:gap-(--space-lg)">
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
        </WorkbenchSection>
      </WorkbenchPageLayout>
    </WorkbenchShell>
  )
}
