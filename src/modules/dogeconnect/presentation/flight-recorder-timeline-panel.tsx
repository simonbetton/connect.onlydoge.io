import { PanelCard } from "@/components/panel-card"
import { Badge } from "@/components/ui/badge"
import { idleInteractiveClass, selectedInteractiveClass } from "@/lib/selection-styles"
import { cn } from "@/lib/utils"
import type {
  FlightRecorderSessionV1,
  FlightTraceEntry,
} from "@/modules/dogeconnect/application/flight-recorder-contracts"
import { EmptyPanelMessage, SessionSummaryView } from "./flight-recorder-page-parts"
import { badgeVariantForVerdict, formatPhaseLabel } from "./flight-recorder-page-utils"

export function FlightRecorderTimelinePanel({
  sessionView,
  selectedTrace,
  onSelectTrace,
}: {
  sessionView: FlightRecorderSessionV1 | null
  selectedTrace: FlightTraceEntry | null
  onSelectTrace: (traceId: string) => void
}) {
  return (
    <PanelCard
      id="timeline"
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
                onClick={() => onSelectTrace(entry.id)}
                aria-current={selectedTrace?.id === entry.id ? "true" : undefined}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition",
                  selectedTrace?.id === entry.id ? selectedInteractiveClass : idleInteractiveClass
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {formatPhaseLabel(entry.phase)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {entry.target} · {entry.durationMs}ms
                    </p>
                  </div>
                  <Badge variant={badgeVariantForVerdict(entry.verdict)}>{entry.verdict}</Badge>
                </div>
                <p className="mt-2 text-muted-foreground text-xs">{entry.responseSummary.note}</p>
                {entry.issues.length > 0 ? (
                  <p className="mt-2 text-danger-foreground text-xs">
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
  )
}
