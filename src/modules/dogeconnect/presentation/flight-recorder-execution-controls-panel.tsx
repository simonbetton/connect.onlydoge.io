import type { UseMutationResult } from "@tanstack/react-query"
import { PanelCard } from "@/components/panel-card"
import type { FlightRecorderSessionV1 } from "@/modules/dogeconnect/application/flight-recorder-contracts"
import {
  AutoPollSettingsPanel,
  CurrentRelayTargetPanel,
  ExecutionActionButtons,
  MutationErrorMessages,
  PayDraftFieldsPanel,
  SessionExportButtons,
} from "./flight-recorder-execution-controls-parts"
import { EmptyPanelMessage } from "./flight-recorder-page-parts"
import type { FlightRecorderPayDraftFields } from "./flight-recorder-page-utils"
import type { FlightRecorderSearchState } from "./flight-recorder-search"

export function FlightRecorderExecutionControlsPanel({
  sessionView,
  search,
  payDraftFields,
  requiresLiveWriteArm,
  statusMutation,
  payMutation,
  onUpdateSearch,
  onSetPayDraftFields,
  onSetLiveWriteArmed,
  onExportSession,
}: {
  sessionView: FlightRecorderSessionV1 | null
  search: FlightRecorderSearchState
  payDraftFields: FlightRecorderPayDraftFields
  requiresLiveWriteArm: boolean
  statusMutation: UseMutationResult<
    FlightRecorderSessionV1,
    Error,
    FlightRecorderSessionV1,
    unknown
  >
  payMutation: UseMutationResult<FlightRecorderSessionV1, Error, FlightRecorderSessionV1, unknown>
  onUpdateSearch: (patch: Partial<FlightRecorderSearchState>) => void
  onSetPayDraftFields: (value: FlightRecorderPayDraftFields) => void
  onSetLiveWriteArmed: (liveWriteArmed: boolean) => void
  onExportSession: (mode: "sanitized" | "full") => void
}) {
  return (
    <PanelCard
      id="execution"
      title="Execution Controls"
      description="Run pay/status against the resolved relay target, export sessions, and manage live-write arming."
    >
      {sessionView ? (
        <div className="space-y-5">
          <CurrentRelayTargetPanel
            sessionView={sessionView}
            onSetLiveWriteArmed={onSetLiveWriteArmed}
          />
          <PayDraftFieldsPanel
            sessionView={sessionView}
            payDraftFields={payDraftFields}
            onUpdateSearch={onUpdateSearch}
            onSetPayDraftFields={onSetPayDraftFields}
          />
          <ExecutionActionButtons
            sessionView={sessionView}
            requiresLiveWriteArm={requiresLiveWriteArm}
            statusMutation={statusMutation}
            payMutation={payMutation}
          />
          <AutoPollSettingsPanel search={search} onUpdateSearch={onUpdateSearch} />
          <SessionExportButtons onExportSession={onExportSession} />
          <MutationErrorMessages statusMutation={statusMutation} payMutation={payMutation} />
        </div>
      ) : (
        <EmptyPanelMessage message="Build or import a session to enable execution controls." />
      )}
    </PanelCard>
  )
}
