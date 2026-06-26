import type { ReactNode } from "react"
import { JsonCodeBlock } from "@/components/json-code-block"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  FlightRecorderFaultPreset,
  FlightRecorderSessionV1,
} from "@/modules/dogeconnect/application/flight-recorder-contracts"
import { badgeVariantForVerdict, formatPhaseLabel } from "./flight-recorder-page-utils"

export function FaultSelector({
  title,
  faults,
  selectedFaults,
  onToggle,
  disabled = false,
  disabledHint,
}: {
  title: string
  faults: Array<{ value: FlightRecorderFaultPreset; label: string; hint: string }>
  selectedFaults: FlightRecorderFaultPreset[]
  onToggle: (fault: FlightRecorderFaultPreset) => void
  disabled?: boolean
  disabledHint?: string
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-muted-foreground text-xs uppercase">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {faults.map((fault) => (
          <label
            key={fault.value}
            className={`flex items-start gap-3 rounded-2xl border p-3 ${
              disabled
                ? "border-border/60 bg-muted/40 opacity-70"
                : "border-border/70 bg-background/60"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedFaults.includes(fault.value)}
              onChange={() => onToggle(fault.value)}
              disabled={disabled}
              aria-label={fault.label}
              className="mt-0.5 size-4 rounded border-border accent-amber-500"
            />
            <span className="space-y-1">
              <span className="block font-medium text-foreground text-sm">{fault.label}</span>
              <span className="block text-muted-foreground text-xs">
                {disabled ? disabledHint || fault.hint : fault.hint}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function PanelCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function TargetModeCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-amber-400 bg-amber-50"
          : "border-border/70 bg-background/60 hover:border-amber-300 hover:bg-amber-50/60"
      }`}
    >
      <p className="font-medium text-foreground text-sm">{title}</p>
      <p className="mt-1 text-muted-foreground text-xs">{description}</p>
    </button>
  )
}

export function LiveModeNotice({ ignoredFaultCount }: { ignoredFaultCount: number }) {
  return (
    <div className="rounded-2xl border border-amber-300/80 bg-amber-50/80 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Live target mode</Badge>
        <Badge variant="neutral">Read-only until armed</Badge>
      </div>
      <p className="mt-3 text-foreground text-sm">
        Builds in this mode resolve the real relay target from the QR or imported session. Status
        reads can hit live infrastructure, and pay submission stays blocked until you explicitly arm
        outbound writes for the built session.
      </p>
      <p className="mt-2 text-muted-foreground text-xs">
        {ignoredFaultCount > 0
          ? `${ignoredFaultCount} simulator preset${ignoredFaultCount === 1 ? "" : "s"} remain selected in the URL but will be ignored while live mode is active.`
          : "Simulator execution presets are disabled here and will reactivate if you switch back to simulator mode."}
      </p>
    </div>
  )
}

export function SessionSummaryView({ session }: { session: FlightRecorderSessionV1 }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={badgeVariantForVerdict(session.summary.verdict)}>
          {session.summary.verdict}
        </Badge>
        <Badge variant="neutral">{session.meta.sourceMode}</Badge>
        <Badge variant="neutral">{session.meta.targetMode}</Badge>
      </div>
      <p className="mt-3 text-foreground text-sm">
        {session.summary.firstFailingStep
          ? `First divergence: ${formatPhaseLabel(session.summary.firstFailingStep)}`
          : "No failing trace step detected."}
      </p>
      <div className="mt-2 space-y-1">
        {session.summary.likelyCauses.map((cause) => (
          <p key={cause} className="text-muted-foreground text-xs">
            {cause}
          </p>
        ))}
      </div>
    </div>
  )
}

export function JsonSection({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-4">
      <p className="font-medium text-muted-foreground text-xs uppercase">{title}</p>
      <JsonCodeBlock
        filename={`${title.toLowerCase().replaceAll(" ", "-")}.json`}
        value={JSON.stringify(value, null, 2)}
      />
    </div>
  )
}

export function EmptyPanelMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border/70 border-dashed bg-background/40 p-4 text-muted-foreground text-sm">
      {message}
    </div>
  )
}
