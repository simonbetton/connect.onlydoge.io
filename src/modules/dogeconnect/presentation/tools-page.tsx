import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type {
  EnvelopeValidationPayload,
  MockQrFixturePayload,
  QrValidationPayload,
  RelayDebugRecordView,
} from "@/modules/dogeconnect/application/contracts"

type RelayScenarioOption = "accepted" | "confirmed" | "declined" | "error"

export function ToolsPage() {
  const isClient = typeof window !== "undefined"
  const [envelopeInputError, setEnvelopeInputError] = React.useState("")
  const [mockCopyState, setMockCopyState] = React.useState<"idle" | "copied" | "failed">("idle")

  const validateQrMutation = useMutation({
    mutationFn: (values: { uri: string; fetchEnvelope: boolean }) =>
      postJson<QrValidationPayload>("/api/tools/validate-qr", values),
  })

  const validateEnvelopeMutation = useMutation({
    mutationFn: (values: { envelope: unknown; expectedHash?: string }) =>
      postJson<EnvelopeValidationPayload>("/api/tools/validate-envelope", values),
  })

  const generateMockQrMutation = useMutation({
    mutationFn: (values: { paymentId: string }) =>
      postJson<MockQrFixturePayload>("/api/tools/mock-qr", {
        paymentId: values.paymentId || undefined,
      }),
  })

  const relayRecordsQuery = useQuery({
    queryKey: ["relay-debug-payments"],
    queryFn: () => getJson<RelayDebugRecordView[]>("/api/relay/debug/payments"),
    enabled: isClient,
    initialData: [],
  })

  const registerScenarioMutation = useMutation({
    mutationFn: (values: {
      id: string
      scenario: RelayScenarioOption
      reason: string
      relayToken: string
      required: number
      dueSec: number
    }) =>
      postJson("/api/relay/debug/payment", {
        ...values,
        reason: values.reason || undefined,
        relayToken: values.relayToken || undefined,
      }),
    onSuccess: () => {
      void relayRecordsQuery.refetch()
    },
  })

  const resetRelayMutation = useMutation({
    mutationFn: () => postJson<{ ok: boolean }>("/api/relay/debug/reset", {}),
    onSuccess: () => {
      void relayRecordsQuery.refetch()
    },
  })

  const relayPayMutation = useMutation({
    mutationFn: (values: { id: string; tx: string; refund: string; relay_token: string }) =>
      postJsonWithMeta("/api/relay/pay", {
        ...values,
        refund: values.refund || undefined,
        relay_token: values.relay_token || undefined,
      }),
    onSuccess: () => {
      void relayRecordsQuery.refetch()
    },
  })

  const relayStatusMutation = useMutation({
    mutationFn: (values: { id: string }) => postJsonWithMeta("/api/relay/status", values),
  })

  const qrForm = useForm({
    defaultValues: {
      uri: "",
      fetchEnvelope: true,
    },
    onSubmit: async ({ value }) => {
      await validateQrMutation.mutateAsync(value)
    },
  })

  const envelopeForm = useForm({
    defaultValues: {
      envelope: "",
      expectedHash: "",
    },
    onSubmit: async ({ value }) => {
      setEnvelopeInputError("")
      let envelope: unknown = value.envelope
      try {
        envelope = JSON.parse(value.envelope)
      } catch {
        setEnvelopeInputError("Envelope must be valid JSON.")
        return
      }

      await validateEnvelopeMutation.mutateAsync({
        envelope,
        expectedHash: value.expectedHash || undefined,
      })
    },
  })

  const mockQrForm = useForm({
    defaultValues: {
      paymentId: "",
    },
    onSubmit: async ({ value }) => {
      setMockCopyState("idle")
      await generateMockQrMutation.mutateAsync(value)
    },
  })

  const registerForm = useForm({
    defaultValues: {
      id: "",
      scenario: "accepted" as RelayScenarioOption,
      reason: "",
      relayToken: "",
      required: 6,
      dueSec: 600,
    },
    onSubmit: async ({ value }) => {
      await registerScenarioMutation.mutateAsync(value)
    },
  })

  const relayPayForm = useForm({
    defaultValues: {
      id: "",
      tx: "",
      refund: "",
      relay_token: "",
    },
    onSubmit: async ({ value }) => {
      await relayPayMutation.mutateAsync(value)
    },
  })

  const relayStatusForm = useForm({
    defaultValues: {
      id: "",
    },
    onSubmit: async ({ value }) => {
      await relayStatusMutation.mutateAsync(value)
    },
  })

  const loadMockIntoQrValidator = () => {
    const mock = generateMockQrMutation.data
    if (!mock) {
      return
    }

    qrForm.setFieldValue("uri", mock.uri)
    qrForm.setFieldValue("fetchEnvelope", true)
  }

  const validateGeneratedMockUri = async () => {
    const mock = generateMockQrMutation.data
    if (!mock) {
      return
    }

    await validateQrMutation.mutateAsync({
      uri: mock.uri,
      fetchEnvelope: true,
    })
  }

  const copyMockUri = async () => {
    const mock = generateMockQrMutation.data
    if (!mock || typeof navigator === "undefined" || !navigator.clipboard) {
      setMockCopyState("failed")
      return
    }

    try {
      await navigator.clipboard.writeText(mock.uri)
      setMockCopyState("copied")
    } catch {
      setMockCopyState("failed")
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-amber-100/70 via-background to-orange-100/70 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">DogeConnect Tools</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Strict protocol and cryptographic checks are enabled by default. Use these tools to verify
          QR URIs and payment envelopes, then test pay/status behavior against the no-op relay
          simulator.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Mock QR Fixture Generator</CardTitle>
          <CardDescription>
            Create a fully valid DogeConnect QR URI with a live mock `dc` envelope endpoint on this
            app. Use this for wallet and relay integration debugging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void mockQrForm.handleSubmit()
            }}
          >
            <mockQrForm.Field name="paymentId">
              {(field) => (
                <Input
                  placeholder="Optional payment ID (e.g. demo-001)"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </mockQrForm.Field>
            <Button type="submit" disabled={generateMockQrMutation.isPending}>
              {generateMockQrMutation.isPending ? "Generating..." : "Generate Mock QR"}
            </Button>
          </form>

          {generateMockQrMutation.error ? (
            <p className="text-sm text-rose-700">{generateMockQrMutation.error.message}</p>
          ) : null}

          {generateMockQrMutation.data ? (
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="grid gap-2 text-xs sm:grid-cols-3">
                <p className="text-muted-foreground">
                  Payment ID:{" "}
                  <span className="font-medium text-foreground">
                    {generateMockQrMutation.data.paymentId}
                  </span>
                </p>
                <p className="truncate text-muted-foreground">
                  h:{" "}
                  <span className="font-medium text-foreground">
                    {generateMockQrMutation.data.h}
                  </span>
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
                <Button type="button" variant="outline" onClick={() => void copyMockUri()}>
                  Copy URI
                </Button>
                <Button type="button" variant="outline" onClick={loadMockIntoQrValidator}>
                  Load Into QR Validator
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void validateGeneratedMockUri()
                  }}
                  disabled={validateQrMutation.isPending}
                >
                  Validate Generated URI
                </Button>
              </div>
              {mockCopyState === "copied" ? (
                <p className="text-xs text-emerald-700">URI copied to clipboard.</p>
              ) : null}
              {mockCopyState === "failed" ? (
                <p className="text-xs text-rose-700">
                  Clipboard copy failed in this environment. Copy from the textarea above.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Validate QR URI</CardTitle>
            <CardDescription>
              Parses `dogecoin:` URI, enforces `dc`/`h`, and optionally fetches envelope from the
              relay endpoint defined in `dc`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void qrForm.handleSubmit()
              }}
            >
              <qrForm.Field name="uri">
                {(field) => (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">URI</p>
                    <Textarea
                      placeholder="dogecoin:DPD7...?...&dc=example.com/dc/id&h=..."
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      rows={4}
                    />
                  </div>
                )}
              </qrForm.Field>
              <qrForm.Field name="fetchEnvelope">
                {(field) => (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(event) => field.handleChange(event.target.checked)}
                      className="size-4 rounded border-border accent-amber-500"
                    />
                    Fetch and verify envelope from relay URL
                  </label>
                )}
              </qrForm.Field>
              <Button type="submit" disabled={validateQrMutation.isPending}>
                {validateQrMutation.isPending ? "Validating..." : "Validate URI"}
              </Button>
            </form>
            <ValidationResultView
              result={validateQrMutation.data}
              error={validateQrMutation.error?.message}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validate Payment Envelope</CardTitle>
            <CardDescription>
              Validates envelope structure, payment schema, and BIP-340 Schnorr signature.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void envelopeForm.handleSubmit()
              }}
            >
              <envelopeForm.Field name="expectedHash">
                {(field) => (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Expected URI `h` (optional)
                    </p>
                    <Input
                      placeholder="72b-LVh5K_mm7zyN9PXO"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </envelopeForm.Field>
              <envelopeForm.Field name="envelope">
                {(field) => (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Envelope JSON
                    </p>
                    <Textarea
                      placeholder='{"version":"1.0","payload":"...","pubkey":"...","sig":"..."}'
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      rows={8}
                    />
                  </div>
                )}
              </envelopeForm.Field>
              <Button type="submit" disabled={validateEnvelopeMutation.isPending}>
                {validateEnvelopeMutation.isPending ? "Validating..." : "Validate Envelope"}
              </Button>
            </form>
            {envelopeInputError ? (
              <p className="text-sm text-rose-700">{envelopeInputError}</p>
            ) : null}
            <ValidationResultView
              result={validateEnvelopeMutation.data}
              error={validateEnvelopeMutation.error?.message}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Relay Scenario Registration</CardTitle>
            <CardDescription>
              Register simulated payment IDs and choose response path for pay/status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void registerForm.handleSubmit()
              }}
            >
              <registerForm.Field name="id">
                {(field) => (
                  <div className="space-y-1.5 sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Payment ID
                    </p>
                    <Input
                      placeholder="pay-101"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </registerForm.Field>
              <registerForm.Field name="scenario">
                {(field) => (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Scenario</p>
                    <select
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value as RelayScenarioOption)
                      }
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
                {(field) => (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Relay Token
                    </p>
                    <Input
                      placeholder="optional token"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </registerForm.Field>
              <registerForm.Field name="required">
                {(field) => (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Required Confirmations
                    </p>
                    <Input
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(Number(event.target.value) || 1)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </registerForm.Field>
              <registerForm.Field name="dueSec">
                {(field) => (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      ETA Seconds
                    </p>
                    <Input
                      type="number"
                      min={1}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(Number(event.target.value) || 1)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </registerForm.Field>
              <registerForm.Field name="reason">
                {(field) => (
                  <div className="space-y-1.5 sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Decline/Error Reason
                    </p>
                    <Input
                      placeholder="Used when scenario returns declined/error"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </registerForm.Field>
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button type="submit" disabled={registerScenarioMutation.isPending}>
                  {registerScenarioMutation.isPending ? "Saving..." : "Save Scenario"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void relayRecordsQuery.refetch()
                  }}
                >
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
            </form>
            {registerScenarioMutation.error ? (
              <p className="text-sm text-rose-700">{registerScenarioMutation.error.message}</p>
            ) : null}
            <RelayRecordsTable records={relayRecordsQuery.data ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relay Pay / Status Tester</CardTitle>
            <CardDescription>
              Submit relay payloads against local no-op API and inspect contract responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void relayPayForm.handleSubmit()
              }}
            >
              <h3 className="text-sm font-semibold">POST /api/relay/pay</h3>
              <relayPayForm.Field name="id">
                {(field) => (
                  <Input
                    placeholder="Payment ID"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </relayPayForm.Field>
              <relayPayForm.Field name="tx">
                {(field) => (
                  <Textarea
                    placeholder="Hex signed transaction"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    rows={4}
                  />
                )}
              </relayPayForm.Field>
              <relayPayForm.Field name="relay_token">
                {(field) => (
                  <Input
                    placeholder="relay_token (optional)"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </relayPayForm.Field>
              <relayPayForm.Field name="refund">
                {(field) => (
                  <Input
                    placeholder="refund address (optional)"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </relayPayForm.Field>
              <Button type="submit" disabled={relayPayMutation.isPending}>
                {relayPayMutation.isPending ? "Submitting..." : "Submit Pay"}
              </Button>
            </form>

            <form
              className="space-y-3 border-t border-border/60 pt-4"
              onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void relayStatusForm.handleSubmit()
              }}
            >
              <h3 className="text-sm font-semibold">POST /api/relay/status</h3>
              <relayStatusForm.Field name="id">
                {(field) => (
                  <Input
                    placeholder="Payment ID"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </relayStatusForm.Field>
              <Button type="submit" variant="outline" disabled={relayStatusMutation.isPending}>
                {relayStatusMutation.isPending ? "Checking..." : "Fetch Status"}
              </Button>
            </form>

            <ApiResponseView label="Pay Response" response={relayPayMutation.data} />
            <ApiResponseView label="Status Response" response={relayStatusMutation.data} />
            <a
              href="/api/openapi"
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm font-medium text-amber-700 hover:underline"
            >
              Open OpenAPI docs in a new tab
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ValidationResultView({
  result,
  error,
}: {
  result: QrValidationPayload | EnvelopeValidationPayload | undefined
  error?: string
}) {
  if (error) {
    return <p className="text-sm text-rose-700">{error}</p>
  }

  if (!result) {
    return null
  }

  const verdict = result.verdict
  const badgeVariant =
    verdict === "valid" ? "success" : verdict === "inconclusive" ? "warning" : "danger"

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Result</span>
        <Badge variant={badgeVariant}>{verdict}</Badge>
      </div>
      <div className="space-y-1">
        {(result.checks ?? []).map((check) => (
          <p key={check.name} className="text-xs text-muted-foreground">
            <span className={check.passed ? "text-emerald-700" : "text-rose-700"}>
              {check.passed ? "PASS" : "FAIL"}
            </span>{" "}
            {check.name}: {check.details}
          </p>
        ))}
      </div>
      {(result.errors ?? []).length > 0 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
          {(result.errors ?? []).map((issue) => (
            <p key={`${issue.field}:${issue.message}`} className="text-xs text-rose-700">
              {issue.field}: {issue.message}
            </p>
          ))}
        </div>
      ) : null}
      {"parsed" in result && result.parsed ? (
        <pre className="overflow-x-auto rounded-xl border border-border/70 bg-background p-3 text-xs">
          {JSON.stringify(result.parsed, null, 2)}
        </pre>
      ) : null}
    </div>
  )
}

function RelayRecordsTable({ records }: { records: RelayDebugRecordView[] }) {
  if (!records.length) {
    return (
      <p className="rounded-2xl border border-border/60 bg-background/50 p-3 text-sm text-muted-foreground">
        No relay scenarios registered yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium">Scenario</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Txid</th>
            <th className="px-3 py-2 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-t border-border/60">
              <td className="px-3 py-2">{record.id}</td>
              <td className="px-3 py-2">{record.scenario}</td>
              <td className="px-3 py-2">{record.status}</td>
              <td className="max-w-40 truncate px-3 py-2">{record.txid || "—"}</td>
              <td className="px-3 py-2">{record.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ApiResponseView({
  label,
  response,
}: {
  label: string
  response:
    | {
        ok: boolean
        status: number
        body: unknown
      }
    | undefined
}) {
  if (!response) {
    return null
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase">
        {label} ({response.status})
      </p>
      <pre className="overflow-x-auto rounded-xl border border-border/70 bg-background p-3 text-xs">
        {JSON.stringify(response.body, null, 2)}
      </pre>
    </div>
  )
}

const getJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })

  const json = (await response.json()) as T
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }

  return json
}

const postJson = async <T,>(path: string, payload: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  const json = (await response.json()) as T
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`)
  }

  return json
}

const postJsonWithMeta = async (
  path: string,
  payload: unknown
): Promise<{ ok: boolean; status: number; body: unknown }> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  }
}
