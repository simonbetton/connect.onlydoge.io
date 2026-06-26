import { PanelCard } from "@/components/panel-card"
import { Badge } from "@/components/ui/badge"
import type {
  FlightRecorderSessionV1,
  FlightTraceEntry,
} from "@/modules/dogeconnect/application/flight-recorder-contracts"
import { EmptyPanelMessage, JsonSection } from "./flight-recorder-page-parts"
import { badgeVariantForVerdict, formatPhaseLabel } from "./flight-recorder-page-utils"

export function FlightRecorderInspectorPanel({
  sessionView,
  selectedTrace,
}: {
  sessionView: FlightRecorderSessionV1 | null
  selectedTrace: FlightTraceEntry | null
}) {
  return (
    <PanelCard
      id="inspector"
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
  )
}
