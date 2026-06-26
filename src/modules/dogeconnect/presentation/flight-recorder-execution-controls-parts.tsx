import type { UseMutationResult } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { FlightRecorderSessionV1 } from "@/modules/dogeconnect/application/flight-recorder-contracts"
import type { FlightRecorderPayDraftFields } from "./flight-recorder-page-utils"
import type { FlightRecorderSearchState } from "./flight-recorder-search"

export function CurrentRelayTargetPanel({
  sessionView,
  onSetLiveWriteArmed,
}: {
  sessionView: FlightRecorderSessionV1
  onSetLiveWriteArmed: (liveWriteArmed: boolean) => void
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-sm">Current relay target</p>
          <p className="text-muted-foreground text-xs">
            {sessionView.artifacts.relay?.statusUrl || "No relay target derived"}
          </p>
        </div>
        <Badge variant={sessionView.artifacts.relay?.liveWriteArmed ? "danger" : "neutral"}>
          {sessionView.artifacts.relay?.liveWriteArmed ? "live writes armed" : "disarmed"}
        </Badge>
      </div>
      {sessionView.artifacts.relay?.mode === "live" ? (
        <LiveRelayWriteGate sessionView={sessionView} onSetLiveWriteArmed={onSetLiveWriteArmed} />
      ) : null}
    </div>
  )
}

function LiveRelayWriteGate({
  sessionView,
  onSetLiveWriteArmed,
}: {
  sessionView: FlightRecorderSessionV1
  onSetLiveWriteArmed: (liveWriteArmed: boolean) => void
}) {
  const relay = sessionView.artifacts.relay
  if (!relay) {
    return null
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-warning-border bg-warning-muted/80 p-4">
      <div className="space-y-1">
        <p className="font-medium text-foreground text-sm">Live relay write gate</p>
        <p className="text-muted-foreground text-xs">
          Status checks are safe live reads. Pay requests stay disabled until you arm outbound
          writes for this session.
        </p>
      </div>
      <div className="grid gap-2 text-muted-foreground text-xs sm:grid-cols-2">
        <div>
          <p className="font-medium text-foreground">Status URL</p>
          <p>{relay.statusUrl}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Pay URL</p>
          <p>{relay.payUrl}</p>
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-2xl border border-warning-border bg-background/80 p-3 text-sm">
        <input
          type="checkbox"
          checked={relay.liveWriteArmed}
          onChange={(event) => onSetLiveWriteArmed(event.target.checked)}
          aria-label="Arm outbound pay requests to this live relay"
          className="mt-0.5 size-4 rounded border-border accent-amber-500"
        />
        <span className="space-y-1">
          <span className="block font-medium text-foreground">
            Arm outbound pay requests to this live relay
          </span>
          <span className="block text-muted-foreground text-xs">
            Leave this off to inspect the live target without sending a pay request.
          </span>
        </span>
      </label>
    </div>
  )
}

export function PayDraftFieldsPanel({
  sessionView,
  payDraftFields,
  onUpdateSearch,
  onSetPayDraftFields,
}: {
  sessionView: FlightRecorderSessionV1
  payDraftFields: FlightRecorderPayDraftFields
  onUpdateSearch: (patch: Partial<FlightRecorderSearchState>) => void
  onSetPayDraftFields: (value: FlightRecorderPayDraftFields) => void
}) {
  return (
    <div className="space-y-3">
      <Field label="Pay Draft">
        {(paymentId) => (
          <Input
            id={paymentId}
            value={sessionView.artifacts.payDraft?.id ?? ""}
            onChange={(event) => onUpdateSearch({ payDraftId: event.target.value })}
            placeholder="Payment ID"
          />
        )}
      </Field>
      <Field label="Transaction hex">
        {(txId) => (
          <Textarea
            id={txId}
            value={sessionView.artifacts.payDraft?.tx ?? ""}
            onChange={(event) =>
              onSetPayDraftFields({
                ...payDraftFields,
                payDraftTx: event.target.value,
              })
            }
            rows={4}
            placeholder="Hex transaction"
          />
        )}
      </Field>
      <Field label="Relay token">
        {(tokenId) => (
          <Input
            id={tokenId}
            value={sessionView.artifacts.payDraft?.relay_token ?? ""}
            onChange={(event) =>
              onSetPayDraftFields({
                ...payDraftFields,
                payDraftRelayToken: event.target.value,
              })
            }
            placeholder="relay_token"
          />
        )}
      </Field>
      <Field label="Refund address">
        {(refundId) => (
          <Input
            id={refundId}
            value={sessionView.artifacts.payDraft?.refund ?? ""}
            onChange={(event) =>
              onSetPayDraftFields({
                ...payDraftFields,
                payDraftRefund: event.target.value,
              })
            }
            placeholder="Refund address"
          />
        )}
      </Field>
    </div>
  )
}

export function ExecutionActionButtons({
  sessionView,
  requiresLiveWriteArm,
  statusMutation,
  payMutation,
}: {
  sessionView: FlightRecorderSessionV1
  requiresLiveWriteArm: boolean
  statusMutation: UseMutationResult<
    FlightRecorderSessionV1,
    Error,
    FlightRecorderSessionV1,
    unknown
  >
  payMutation: UseMutationResult<FlightRecorderSessionV1, Error, FlightRecorderSessionV1, unknown>
}) {
  const isLiveRelay = sessionView.artifacts.relay?.mode === "live"

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void statusMutation.mutateAsync(sessionView)
          }}
          disabled={!sessionView.artifacts.relay || statusMutation.isPending}
        >
          {statusMutation.isPending
            ? "Running..."
            : isLiveRelay
              ? "Read Live Status"
              : "Run Status Check"}
        </Button>
        <Button
          type="button"
          variant={isLiveRelay ? "destructive" : "default"}
          onClick={() => {
            void payMutation.mutateAsync(sessionView)
          }}
          disabled={
            !sessionView.artifacts.payDraft || payMutation.isPending || requiresLiveWriteArm
          }
        >
          {payMutation.isPending ? "Submitting..." : isLiveRelay ? "Submit Live Pay" : "Submit Pay"}
        </Button>
      </div>

      {requiresLiveWriteArm ? (
        <p className="text-sm text-warning-foreground">
          Arm live relay writes above to enable pay submission against the live target.
        </p>
      ) : null}
    </>
  )
}

export function AutoPollSettingsPanel({
  search,
  onUpdateSearch,
}: {
  search: FlightRecorderSearchState
  onUpdateSearch: (patch: Partial<FlightRecorderSearchState>) => void
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={search.autoPoll}
          onChange={(event) => onUpdateSearch({ autoPoll: event.target.checked })}
          className="size-4 rounded border-border accent-amber-500"
        />
        Auto-poll status
      </label>
      <Field label="Poll Interval (seconds)">
        {(id) => (
          <Input
            id={id}
            type="number"
            min={1}
            value={search.pollIntervalSec}
            onChange={(event) => {
              onUpdateSearch({
                pollIntervalSec: Math.max(1, Number(event.target.value) || 1),
              })
            }}
          />
        )}
      </Field>
    </div>
  )
}

export function SessionExportButtons({
  onExportSession,
}: {
  onExportSession: (mode: "sanitized" | "full") => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={() => onExportSession("sanitized")}>
        Export Sanitized JSON
      </Button>
      <Button type="button" variant="outline" onClick={() => onExportSession("full")}>
        Export Full JSON
      </Button>
    </div>
  )
}

export function MutationErrorMessages({
  statusMutation,
  payMutation,
}: {
  statusMutation: UseMutationResult<
    FlightRecorderSessionV1,
    Error,
    FlightRecorderSessionV1,
    unknown
  >
  payMutation: UseMutationResult<FlightRecorderSessionV1, Error, FlightRecorderSessionV1, unknown>
}) {
  return (
    <>
      {statusMutation.error ? (
        <p className="text-danger-foreground text-sm">{statusMutation.error.message}</p>
      ) : null}
      {payMutation.error ? (
        <p className="text-danger-foreground text-sm">{payMutation.error.message}</p>
      ) : null}
    </>
  )
}
