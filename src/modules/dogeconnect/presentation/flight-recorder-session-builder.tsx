import type { FlightRecorderFaultPreset } from "@/modules/dogeconnect/application/flight-recorder-contracts"
import { PanelCard } from "./flight-recorder-page-parts"
import type { FlightRecorderSearchState } from "./flight-recorder-search"
import {
  BuilderActionButtons,
  SessionBuilderFaultSection,
  SessionBuilderSourcePanel,
  SessionBuilderTargetSection,
  SourceTabButtons,
} from "./flight-recorder-session-builder-parts"

export interface FlightRecorderSessionBuilderProps {
  search: FlightRecorderSearchState
  importJson: string
  importError: string
  qrImageError: string
  qrImageName: string
  qrImageDecodePending: boolean
  pageMessage: string
  buildPending: boolean
  buildError: string | undefined
  ignoredLiveFaultCount: number
  onUpdateSearch: (patch: Partial<FlightRecorderSearchState>) => void
  onSetSourceTab: (sourceTab: FlightRecorderSearchState["sourceTab"]) => void
  onSetTargetMode: (targetMode: FlightRecorderSearchState["targetMode"]) => void
  onSetImportJson: (value: string) => void
  onLoadQrImage: (file: File | null) => void
  onLoadImportFile: (file: File | null) => void
  onImportSession: () => void
  onBuildSession: () => void
  onToggleFault: (fault: FlightRecorderFaultPreset) => void
  onResetBuilder: () => void
}

export function FlightRecorderSessionBuilder(props: FlightRecorderSessionBuilderProps) {
  return (
    <PanelCard
      id="session-builder"
      title="Session Builder"
      description="Create a new trace from a QR URI, mock fixture, or imported JSON session."
    >
      <SessionBuilderContent {...props} />
    </PanelCard>
  )
}

function SessionBuilderContent(props: FlightRecorderSessionBuilderProps) {
  return (
    <div className="space-y-5">
      <SourceTabButtons activeTab={props.search.sourceTab} onSetSourceTab={props.onSetSourceTab} />

      <SessionBuilderTargetSection
        search={props.search}
        ignoredLiveFaultCount={props.ignoredLiveFaultCount}
        onSetTargetMode={props.onSetTargetMode}
      />

      <SessionBuilderSourcePanel
        sourceTab={props.search.sourceTab}
        search={props.search}
        importJson={props.importJson}
        importError={props.importError}
        qrImageName={props.qrImageName}
        qrImageError={props.qrImageError}
        qrImageDecodePending={props.qrImageDecodePending}
        onUpdateSearch={props.onUpdateSearch}
        onSetImportJson={props.onSetImportJson}
        onLoadQrImage={props.onLoadQrImage}
        onLoadImportFile={props.onLoadImportFile}
        onImportSession={props.onImportSession}
      />

      <SessionBuilderFaultSection
        search={props.search}
        onUpdateSearch={props.onUpdateSearch}
        onToggleFault={props.onToggleFault}
      />

      <BuilderActionButtons
        sourceTab={props.search.sourceTab}
        buildPending={props.buildPending}
        onBuildSession={props.onBuildSession}
        onResetBuilder={props.onResetBuilder}
      />

      <SessionBuilderStatusMessages buildError={props.buildError} pageMessage={props.pageMessage} />
    </div>
  )
}

function SessionBuilderStatusMessages({
  buildError,
  pageMessage,
}: {
  buildError: string | undefined
  pageMessage: string
}) {
  return (
    <>
      {buildError ? <p className="text-danger-foreground text-sm">{buildError}</p> : null}
      {pageMessage ? <p className="text-sm text-success-foreground">{pageMessage}</p> : null}
    </>
  )
}
