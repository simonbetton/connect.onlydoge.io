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
          <div className="relative space-y-3">
            <div className="absolute top-5 bottom-5 left-[1.35rem] w-px bg-border" aria-hidden />
            {sessionView.trace.map((entry, index) => (
              <div
                key={entry.id}
                className="mock-timeline-event relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3"
                data-mock-phase={index % 4}
              >
                <span className="mock-timeline-dot relative z-1 mt-5 size-3 justify-self-center rounded-full border-2 border-card bg-success shadow-[0_0_0_4px_var(--background)]" />
                <button
                  type="button"
                  onClick={() => onSelectTrace(entry.id)}
                  aria-current={selectedTrace?.id === entry.id ? "true" : undefined}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 ease-out active:scale-[0.995] motion-reduce:active:scale-100",
                    selectedTrace?.id === entry.id ? selectedInteractiveClass : idleInteractiveClass
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="mock-timeline-label font-medium text-base text-foreground sm:text-sm">
                        {formatPhaseLabel(entry.phase)}
                      </p>
                      <p className="mock-timeline-meta text-muted-foreground text-sm sm:text-xs">
                        {entry.target} · {entry.durationMs}ms
                      </p>
                    </div>
                    <Badge variant={badgeVariantForVerdict(entry.verdict)}>{entry.verdict}</Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground text-sm sm:text-xs">
                    {entry.responseSummary.note}
                  </p>
                  {entry.issues.length > 0 ? (
                    <p className="mt-2 text-danger-foreground text-sm sm:text-xs">
                      {entry.issues[0]?.field}: {entry.issues[0]?.message}
                    </p>
                  ) : null}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyPanelMessage message="Build or import a session to populate the timeline." />
      )}
    </PanelCard>
  )
}
