import type { UseMutationResult } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type {
  EnvelopeValidationPayload,
  MockQrFixturePayload,
  QrValidationPayload,
  RelayDebugRecordView,
} from "@/modules/dogeconnect/application/contracts"
import {
  ApiResponseView,
  QrPreviewPanel,
  RelayRecordsTable,
  ValidationResultView,
} from "./tools-page-parts"
import type { RelayScenarioOption } from "./tools-search"

const openApiDocsHref = "/api/openapi"

// TanStack Form's generic Field API is too strict to reuse across split files without coupling.
type ToolsFormLike = {
  // biome-ignore lint/suspicious/noExplicitAny: shared form shell for split presentation components
  Field: any
  handleSubmit: () => void | Promise<void>
}

type ToolsFormFieldApi = {
  // biome-ignore lint/suspicious/noExplicitAny: field values vary per form section
  state: { value: any }
  // biome-ignore lint/suspicious/noExplicitAny: field values vary per form section
  handleChange: (value: any) => void
  handleBlur: () => void
}

export function ToolsPageHero() {
  return (
    <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-amber-100/70 via-background to-orange-100/70 p-6">
      <h1 className="font-semibold text-2xl tracking-tight">DogeConnect Tools</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground text-sm leading-relaxed">
        Strict protocol and cryptographic checks are enabled by default. Use these tools to verify
        QR URIs and payment envelopes, then test pay/status behavior against the no-op relay
        simulator.
      </p>
    </section>
  )
}

export function ToolsQuickStartSection() {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-base">Quick Start</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            New here? Follow this path to get from QR input to relay response quickly.
          </p>
        </div>
        <a href="/flight-recorder" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Need full traces? Open Flight Recorder
        </a>
      </div>
      <ol className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <li className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="font-medium text-foreground">1. Generate or paste a QR URI</p>
          <p className="mt-1 text-muted-foreground">
            Start with Mock QR if you need known-good fixture data.
          </p>
          <a
            href="#mock-fixture"
            className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
          >
            Open Mock QR
          </a>
        </li>
        <li className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="font-medium text-foreground">2. Run validation checks</p>
          <p className="mt-1 text-muted-foreground">
            Verify URI fields, then inspect envelope schema and signature.
          </p>
          <a
            href="#qr-validator"
            className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
          >
            Open Validators
          </a>
        </li>
        <li className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="font-medium text-foreground">3. Test relay behavior</p>
          <p className="mt-1 text-muted-foreground">
            Register a scenario and call pay/status against the local simulator.
          </p>
          <a
            href="#relay-registration"
            className={buttonVariants({ variant: "outline", size: "sm", className: "mt-3" })}
          >
            Open Relay Tools
          </a>
        </li>
      </ol>
    </section>
  )
}

export function MockQrFixtureCard({
  mockQrForm,
  generateMockQrMutation,
  validateQrMutation,
  mockCopyState,
  onUpdateSearch,
  onCopyMockUri,
  onLoadMockIntoQrValidator,
  onValidateGeneratedMockUri,
}: {
  mockQrForm: ToolsFormLike
  generateMockQrMutation: UseMutationResult<
    MockQrFixturePayload,
    Error,
    { paymentId: string },
    unknown
  >
  validateQrMutation: UseMutationResult<
    QrValidationPayload,
    Error,
    { uri: string; fetchEnvelope: boolean },
    unknown
  >
  mockCopyState: "idle" | "copied" | "failed"
  onUpdateSearch: (patch: { mockPaymentId: string }) => void
  onCopyMockUri: () => void
  onLoadMockIntoQrValidator: () => void
  onValidateGeneratedMockUri: () => void
}) {
  return (
    <Card id="mock-fixture" className="min-w-0 scroll-mt-24">
      <CardHeader>
        <CardTitle>Mock QR Fixture Generator</CardTitle>
        <CardDescription>
          Create a fully valid DogeConnect QR URI with a live mock `dc` envelope endpoint on this
          app. Use this for wallet and relay integration debugging.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto]">
          <mockQrForm.Field name="paymentId">
            {(field: ToolsFormFieldApi) => (
              <Input
                placeholder="Optional payment ID (e.g. demo-001)"
                value={field.state.value}
                onChange={(event) => {
                  const value = event.target.value
                  field.handleChange(value)
                  onUpdateSearch({ mockPaymentId: value })
                }}
                onBlur={field.handleBlur}
              />
            )}
          </mockQrForm.Field>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={generateMockQrMutation.isPending}
            onClick={() => {
              void mockQrForm.handleSubmit()
            }}
          >
            {generateMockQrMutation.isPending ? "Generating..." : "Generate Mock QR"}
          </Button>
        </div>

        {generateMockQrMutation.error ? (
          <p className="text-rose-700 text-sm">{generateMockQrMutation.error.message}</p>
        ) : null}

        {generateMockQrMutation.data ? (
          <div className="min-w-0 space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
            <div className="grid gap-2 text-xs sm:grid-cols-3">
              <p className="text-muted-foreground">
                Payment ID:{" "}
                <span className="font-medium text-foreground">
                  {generateMockQrMutation.data.paymentId}
                </span>
              </p>
              <p className="truncate text-muted-foreground">
                h:{" "}
                <span className="font-medium text-foreground">{generateMockQrMutation.data.h}</span>
              </p>
              <p className="truncate text-muted-foreground">
                dc:{" "}
                <span className="font-medium text-foreground">
                  {generateMockQrMutation.data.dc}
                </span>
              </p>
            </div>
            <Textarea
              value={generateMockQrMutation.data.uri}
              readOnly
              rows={4}
              className="font-mono text-xs"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void onCopyMockUri()}>
                Copy URI
              </Button>
              <Button type="button" variant="outline" onClick={onLoadMockIntoQrValidator}>
                Load Into QR Validator
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onValidateGeneratedMockUri}
                disabled={validateQrMutation.isPending}
              >
                Validate Generated URI
              </Button>
            </div>
            {mockCopyState === "copied" ? (
              <p className="text-emerald-700 text-xs">URI copied to clipboard.</p>
            ) : null}
            {mockCopyState === "failed" ? (
              <p className="text-rose-700 text-xs">
                Clipboard copy failed in this environment. Copy from the textarea above.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function QrValidatorCard({
  qrForm,
  validateQrMutation,
  qrPreviewUri,
  onUpdateSearch,
  onSetQrPreviewUri,
}: {
  qrForm: ToolsFormLike
  validateQrMutation: UseMutationResult<
    QrValidationPayload,
    Error,
    { uri: string; fetchEnvelope: boolean },
    unknown
  >
  qrPreviewUri: string
  onUpdateSearch: (patch: { qrUri: string } | { qrFetchEnvelope: boolean }) => void
  onSetQrPreviewUri: (value: string) => void
}) {
  return (
    <Card id="qr-validator" className="min-w-0 scroll-mt-24">
      <CardHeader>
        <CardTitle>Validate QR URI</CardTitle>
        <CardDescription>
          Parses `dogecoin:` URI, enforces `dc`/`h`, and optionally fetches envelope from the relay
          endpoint defined in `dc`.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="space-y-3">
          <qrForm.Field name="uri">
            {(field: ToolsFormFieldApi) => (
              <div className="space-y-1.5">
                <p className="font-medium text-muted-foreground text-xs uppercase">URI</p>
                <Textarea
                  placeholder="dogecoin:DPD7...?...&dc=example.com/dc/id&h=..."
                  value={field.state.value}
                  onChange={(event) => {
                    const value = event.target.value
                    field.handleChange(value)
                    onSetQrPreviewUri(value)
                    onUpdateSearch({ qrUri: value })
                  }}
                  onBlur={field.handleBlur}
                  rows={4}
                />
              </div>
            )}
          </qrForm.Field>
          <qrForm.Field name="fetchEnvelope">
            {(field: ToolsFormFieldApi) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(event) => {
                    const value = event.target.checked
                    field.handleChange(value)
                    onUpdateSearch({ qrFetchEnvelope: value })
                  }}
                  className="size-4 rounded border-border accent-amber-500"
                />
                Fetch and verify envelope from relay URL
              </label>
            )}
          </qrForm.Field>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={validateQrMutation.isPending}
            onClick={() => {
              void qrForm.handleSubmit()
            }}
          >
            {validateQrMutation.isPending ? "Validating..." : "Validate URI"}
          </Button>
        </div>
        <QrPreviewPanel uri={qrPreviewUri} />
        <ValidationResultView
          result={validateQrMutation.data}
          error={validateQrMutation.error?.message}
        />
      </CardContent>
    </Card>
  )
}

export function EnvelopeValidatorCard({
  envelopeForm,
  validateEnvelopeMutation,
  envelopeInputError,
  onUpdateSearch,
}: {
  envelopeForm: ToolsFormLike
  validateEnvelopeMutation: UseMutationResult<
    EnvelopeValidationPayload,
    Error,
    { envelope: unknown; expectedHash?: string },
    unknown
  >
  envelopeInputError: string
  onUpdateSearch: (patch: { envelopeExpectedHash: string }) => void
}) {
  return (
    <Card id="envelope-validator" className="min-w-0 scroll-mt-24">
      <CardHeader>
        <CardTitle>Validate Payment Envelope</CardTitle>
        <CardDescription>
          Validates envelope structure, payment schema, and BIP-340 Schnorr signature.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="space-y-3">
          <envelopeForm.Field name="expectedHash">
            {(field: ToolsFormFieldApi) => (
              <div className="space-y-1.5">
                <p className="font-medium text-muted-foreground text-xs uppercase">
                  Expected URI `h` (optional)
                </p>
                <Input
                  placeholder="72b-LVh5K_mm7zyN9PXO"
                  value={field.state.value}
                  onChange={(event) => {
                    const value = event.target.value
                    field.handleChange(value)
                    onUpdateSearch({ envelopeExpectedHash: value })
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </envelopeForm.Field>
          <envelopeForm.Field name="envelope">
            {(field: ToolsFormFieldApi) => (
              <div className="space-y-1.5">
                <p className="font-medium text-muted-foreground text-xs uppercase">Envelope JSON</p>
                <Textarea
                  placeholder='{"version":"1.0","payload":"...","pubkey":"...","sig":"..."}'
                  value={field.state.value}
                  onChange={(event) => {
                    field.handleChange(event.target.value)
                  }}
                  onBlur={field.handleBlur}
                  rows={8}
                />
              </div>
            )}
          </envelopeForm.Field>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={validateEnvelopeMutation.isPending}
            onClick={() => {
              void envelopeForm.handleSubmit()
            }}
          >
            {validateEnvelopeMutation.isPending ? "Validating..." : "Validate Envelope"}
          </Button>
        </div>
        {envelopeInputError ? <p className="text-rose-700 text-sm">{envelopeInputError}</p> : null}
        <ValidationResultView
          result={validateEnvelopeMutation.data}
          error={validateEnvelopeMutation.error?.message}
        />
      </CardContent>
    </Card>
  )
}

export function RelayRegistrationCard({
  registerForm,
  registerScenarioMutation,
  resetRelayMutation,
  relayRecords,
  onUpdateSearch,
  onRefetchRelayRecords,
}: {
  registerForm: ToolsFormLike
  registerScenarioMutation: UseMutationResult<
    unknown,
    Error,
    {
      id: string
      scenario: RelayScenarioOption
      reason: string
      relayToken: string
      required: number
      dueSec: number
    },
    unknown
  >
  resetRelayMutation: UseMutationResult<{ ok: boolean }, Error, void, unknown>
  relayRecords: RelayDebugRecordView[]
  onUpdateSearch: (
    patch:
      | { relayRegisterId: string }
      | { relayRegisterScenario: RelayScenarioOption }
      | { relayRegisterToken: string }
      | { relayRegisterRequired: number }
      | { relayRegisterDueSec: number }
      | { relayRegisterReason: string }
  ) => void
  onRefetchRelayRecords: () => void
}) {
  return (
    <Card id="relay-registration" className="min-w-0 scroll-mt-24">
      <CardHeader>
        <CardTitle>Relay Scenario Registration</CardTitle>
        <CardDescription>
          Register simulated payment IDs and choose response path for pay/status.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <registerForm.Field name="id">
            {(field: ToolsFormFieldApi) => (
              <div className="space-y-1.5 sm:col-span-2">
                <p className="font-medium text-muted-foreground text-xs uppercase">Payment ID</p>
                <Input
                  placeholder="pay-101"
                  value={field.state.value}
                  onChange={(event) => {
                    const value = event.target.value
                    field.handleChange(value)
                    onUpdateSearch({ relayRegisterId: value })
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </registerForm.Field>
          <registerForm.Field name="scenario">
            {(field: ToolsFormFieldApi) => (
              <div className="space-y-1.5">
                <p className="font-medium text-muted-foreground text-xs uppercase">Scenario</p>
                <select
                  value={field.state.value}
                  onChange={(event) => {
                    const value = event.target.value as RelayScenarioOption
                    field.handleChange(value)
                    onUpdateSearch({ relayRegisterScenario: value })
                  }}
                  className="h-10 w-full rounded-2xl border border-input bg-background/70 px-3 text-sm"
                >
                  <option value="accepted">accepted</option>
                  <option value="confirmed">confirmed</option>
                  <option value="declined">declined</option>
                  <option value="error">error</option>
                </select>
              </div>
            )}
          </registerForm.Field>
          <registerForm.Field name="relayToken">
            {(field: ToolsFormFieldApi) => (
              <div className="space-y-1.5">
                <p className="font-medium text-muted-foreground text-xs uppercase">Relay Token</p>
                <Input
                  placeholder="optional token"
                  value={field.state.value}
                  onChange={(event) => {
                    const value = event.target.value
                    field.handleChange(value)
                    onUpdateSearch({ relayRegisterToken: value })
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </registerForm.Field>
          <registerForm.Field name="required">
            {(field: ToolsFormFieldApi) => (
              <div className="space-y-1.5">
                <p className="font-medium text-muted-foreground text-xs uppercase">
                  Required Confirmations
                </p>
                <Input
                  type="number"
                  min={1}
                  value={field.state.value}
                  onChange={(event) => {
                    const value = Number(event.target.value) || 1
                    field.handleChange(value)
                    onUpdateSearch({ relayRegisterRequired: value })
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </registerForm.Field>
          <registerForm.Field name="dueSec">
            {(field: ToolsFormFieldApi) => (
              <div className="space-y-1.5">
                <p className="font-medium text-muted-foreground text-xs uppercase">ETA Seconds</p>
                <Input
                  type="number"
                  min={1}
                  value={field.state.value}
                  onChange={(event) => {
                    const value = Number(event.target.value) || 1
                    field.handleChange(value)
                    onUpdateSearch({ relayRegisterDueSec: value })
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </registerForm.Field>
          <registerForm.Field name="reason">
            {(field: ToolsFormFieldApi) => (
              <div className="space-y-1.5 sm:col-span-2">
                <p className="font-medium text-muted-foreground text-xs uppercase">
                  Decline/Error Reason
                </p>
                <Input
                  placeholder="Used when scenario returns declined/error"
                  value={field.state.value}
                  onChange={(event) => {
                    const value = event.target.value
                    field.handleChange(value)
                    onUpdateSearch({ relayRegisterReason: value })
                  }}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </registerForm.Field>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              type="button"
              disabled={registerScenarioMutation.isPending}
              onClick={() => {
                void registerForm.handleSubmit()
              }}
            >
              {registerScenarioMutation.isPending ? "Saving..." : "Save Scenario"}
            </Button>
            <Button type="button" variant="outline" onClick={onRefetchRelayRecords}>
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void resetRelayMutation.mutateAsync()
              }}
              disabled={resetRelayMutation.isPending}
            >
              {resetRelayMutation.isPending ? "Resetting..." : "Reset State"}
            </Button>
          </div>
        </div>
        {registerScenarioMutation.error ? (
          <p className="text-rose-700 text-sm">{registerScenarioMutation.error.message}</p>
        ) : null}
        <RelayRecordsTable records={relayRecords} />
      </CardContent>
    </Card>
  )
}

export function RelayTesterCard({
  relayPayForm,
  relayStatusForm,
  relayPayMutation,
  relayStatusMutation,
  onUpdateSearch,
}: {
  relayPayForm: ToolsFormLike
  relayStatusForm: ToolsFormLike
  relayPayMutation: UseMutationResult<
    { ok: boolean; status: number; body: unknown },
    Error,
    { id: string; tx: string; refund: string; relay_token: string },
    unknown
  >
  relayStatusMutation: UseMutationResult<
    { ok: boolean; status: number; body: unknown },
    Error,
    { id: string },
    unknown
  >
  onUpdateSearch: (patch: { relayPayId: string } | { relayStatusId: string }) => void
}) {
  return (
    <Card id="relay-tester" className="min-w-0 scroll-mt-24">
      <CardHeader>
        <CardTitle>Relay Pay / Status Tester</CardTitle>
        <CardDescription>
          Submit relay payloads against local no-op API and inspect contract responses.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">POST /api/relay/pay</h3>
          <relayPayForm.Field name="id">
            {(field: ToolsFormFieldApi) => (
              <Input
                placeholder="Payment ID"
                value={field.state.value}
                onChange={(event) => {
                  const value = event.target.value
                  field.handleChange(value)
                  onUpdateSearch({ relayPayId: value })
                }}
                onBlur={field.handleBlur}
              />
            )}
          </relayPayForm.Field>
          <relayPayForm.Field name="tx">
            {(field: ToolsFormFieldApi) => (
              <Textarea
                placeholder="Hex signed transaction"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value)
                }}
                onBlur={field.handleBlur}
                rows={4}
              />
            )}
          </relayPayForm.Field>
          <relayPayForm.Field name="relay_token">
            {(field: ToolsFormFieldApi) => (
              <Input
                placeholder="relay_token (optional)"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value)
                }}
                onBlur={field.handleBlur}
              />
            )}
          </relayPayForm.Field>
          <relayPayForm.Field name="refund">
            {(field: ToolsFormFieldApi) => (
              <Input
                placeholder="refund address (optional)"
                value={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.target.value)
                }}
                onBlur={field.handleBlur}
              />
            )}
          </relayPayForm.Field>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={relayPayMutation.isPending}
            onClick={() => {
              void relayPayForm.handleSubmit()
            }}
          >
            {relayPayMutation.isPending ? "Submitting..." : "Submit Pay"}
          </Button>
        </div>

        <div className="space-y-3 border-border/60 border-t pt-4">
          <h3 className="font-semibold text-sm">POST /api/relay/status</h3>
          <relayStatusForm.Field name="id">
            {(field: ToolsFormFieldApi) => (
              <Input
                placeholder="Payment ID"
                value={field.state.value}
                onChange={(event) => {
                  const value = event.target.value
                  field.handleChange(value)
                  onUpdateSearch({ relayStatusId: value })
                }}
                onBlur={field.handleBlur}
              />
            )}
          </relayStatusForm.Field>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={relayStatusMutation.isPending}
            onClick={() => {
              void relayStatusForm.handleSubmit()
            }}
          >
            {relayStatusMutation.isPending ? "Checking..." : "Fetch Status"}
          </Button>
        </div>

        <ApiResponseView label="Pay Response" response={relayPayMutation.data} />
        <ApiResponseView label="Status Response" response={relayStatusMutation.data} />
        <a
          href={openApiDocsHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex font-medium text-amber-700 text-sm hover:underline"
        >
          Open OpenAPI docs in a new tab
        </a>
      </CardContent>
    </Card>
  )
}
