import { openapi } from "@elysiajs/openapi"
import { Elysia, t } from "elysia"
import type { BuildFlightRecorderSessionInput } from "../../application/flight-recorder-contracts"
import { parseImportedFlightRecorderSession } from "../../application/flight-recorder-session"
import type { BuildFlightRecorderSessionUseCase } from "../../application/use-cases/build-flight-recorder-session-use-case"
import type { ExecuteFlightRecorderRelayPayUseCase } from "../../application/use-cases/execute-flight-recorder-relay-pay-use-case"
import type { ExecuteFlightRecorderRelayStatusUseCase } from "../../application/use-cases/execute-flight-recorder-relay-status-use-case"
import type { GenerateMockQrUseCase } from "../../application/use-cases/generate-mock-qr-use-case"
import type { GetMockEnvelopeUseCase } from "../../application/use-cases/get-mock-envelope-use-case"
import type { ListRelayScenariosUseCase } from "../../application/use-cases/list-relay-scenarios-use-case"
import type { RegisterRelayScenarioUseCase } from "../../application/use-cases/register-relay-scenario-use-case"
import type { RelayPayUseCase } from "../../application/use-cases/relay-pay-use-case"
import type { RelayStatusUseCase } from "../../application/use-cases/relay-status-use-case"
import type { ResetRelayStateUseCase } from "../../application/use-cases/reset-relay-state-use-case"
import type { ValidateDogeConnectUriUseCase } from "../../application/use-cases/validate-dogeconnect-uri-use-case"
import type { ValidatePaymentEnvelopeUseCase } from "../../application/use-cases/validate-payment-envelope-use-case"

interface DogeConnectApiDependencies {
  validateDogeConnectUriUseCase: ValidateDogeConnectUriUseCase
  validatePaymentEnvelopeUseCase: ValidatePaymentEnvelopeUseCase
  generateMockQrUseCase: GenerateMockQrUseCase
  getMockEnvelopeUseCase: GetMockEnvelopeUseCase
  relayPayUseCase: RelayPayUseCase
  relayStatusUseCase: RelayStatusUseCase
  registerRelayScenarioUseCase: RegisterRelayScenarioUseCase
  listRelayScenariosUseCase: ListRelayScenariosUseCase
  resetRelayStateUseCase: ResetRelayStateUseCase
  buildFlightRecorderSessionUseCase: BuildFlightRecorderSessionUseCase
  executeFlightRecorderRelayPayUseCase: ExecuteFlightRecorderRelayPayUseCase
  executeFlightRecorderRelayStatusUseCase: ExecuteFlightRecorderRelayStatusUseCase
}

const validationIssueSchema = t.Object({
  field: t.String(),
  message: t.String(),
  severity: t.Union([t.Literal("error"), t.Literal("warning")]),
  code: t.Optional(t.String()),
})

const validationCheckSchema = t.Object({
  name: t.String(),
  passed: t.Boolean(),
  details: t.String(),
})

const relayStatusSchema = t.Object({
  id: t.String(),
  status: t.Union([
    t.Literal("unpaid"),
    t.Literal("accepted"),
    t.Literal("confirmed"),
    t.Literal("declined"),
  ]),
  reason: t.Optional(t.String()),
  txid: t.Optional(t.String()),
  confirmed_at: t.Optional(t.String()),
  required: t.Optional(t.Number()),
  confirmed: t.Optional(t.Number()),
  due_sec: t.Optional(t.Number()),
})

const relayErrorSchema = t.Object({
  error: t.Union([
    t.Literal("not_found"),
    t.Literal("expired"),
    t.Literal("invalid_tx"),
    t.Literal("invalid_outputs"),
    t.Literal("invalid_token"),
  ]),
  message: t.String(),
})

const mockEnvelopeSchema = t.Object({
  version: t.Literal("1.0"),
  payload: t.String(),
  pubkey: t.String(),
  sig: t.String(),
})

const mockQrResponseSchema = t.Object({
  uri: t.String(),
  paymentId: t.String(),
  address: t.String(),
  amount: t.String(),
  dc: t.String(),
  h: t.String(),
  envelope: mockEnvelopeSchema,
  payment: t.Record(t.String(), t.Any()),
})

const flightRecorderFaultSchema = t.Union([
  t.Literal("wrong_hash"),
  t.Literal("missing_hash"),
  t.Literal("bad_signature"),
  t.Literal("bad_pubkey_hash"),
  t.Literal("expired_timeout"),
  t.Literal("missing_relay_token"),
  t.Literal("simulator_confirmed"),
  t.Literal("simulator_declined"),
  t.Literal("simulator_error"),
  t.Literal("simulator_delayed_confirmation"),
])

const flightTraceSchema = t.Object({
  id: t.String(),
  kind: t.String(),
  phase: t.String(),
  target: t.String(),
  startedAt: t.String(),
  endedAt: t.String(),
  durationMs: t.Number(),
  verdict: t.String(),
  issues: t.Array(validationIssueSchema),
  requestSummary: t.Object({
    method: t.String(),
    endpoint: t.String(),
    note: t.String(),
    body: t.Any(),
  }),
  responseSummary: t.Object({
    statusCode: t.Union([t.Null(), t.Number()]),
    note: t.String(),
    body: t.Any(),
  }),
  artifactsChanged: t.Array(t.String()),
})

const flightRecorderSessionSchema = t.Object({
  version: t.String(),
  meta: t.Object({
    createdAt: t.String(),
    updatedAt: t.String(),
    sourceMode: t.String(),
    targetMode: t.String(),
    exportMode: t.String(),
  }),
  source: t.Object({
    mode: t.String(),
    uri: t.String(),
    paymentId: t.String(),
    origin: t.String(),
    imported: t.Boolean(),
  }),
  artifacts: t.Any(),
  faults: t.Array(flightRecorderFaultSchema),
  trace: t.Array(flightTraceSchema),
  summary: t.Object({
    verdict: t.String(),
    firstFailingStep: t.String(),
    likelyCauses: t.Array(t.String()),
  }),
})

const openApiThemeCss = `
@font-face {
  font-family: "DogeSans";
  src: url("/fonts/dogesans/DogeSansVF.ttf") format("truetype");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "DogeSans";
  src: url("/fonts/dogesans/DogeSans-Italic.otf") format("opentype");
  font-style: italic;
  font-weight: 400;
  font-display: swap;
}

body,
.light-mode,
.dark-mode {
  font-family: "Figtree Variable", "Figtree", "Segoe UI", sans-serif;
}

h1,
h2,
h3,
h4,
h5,
h6,
.t-doc__title,
.t-doc__sidebar .sidebar-heading {
  font-family: "DogeSans", "Figtree Variable", sans-serif;
}

.light-mode {
  --scalar-color-1: oklch(0.25 0.01 50);
  --scalar-color-2: oklch(0.5 0.02 55);
  --scalar-color-3: oklch(0.58 0.02 60);
  --scalar-color-accent: oklch(0.74 0.16 85);

  --scalar-background-1: oklch(0.987 0.012 94.2);
  --scalar-background-2: oklch(0.95 0.012 80);
  --scalar-background-3: oklch(0.9 0.018 84);
  --scalar-background-accent: oklch(0.74 0.16 85 / 0.16);

  --scalar-border-color: oklch(0.88 0.018 82 / 0.85);

  --scalar-button-1: oklch(0.74 0.16 85);
  --scalar-button-1-color: oklch(0.21 0.018 40);
  --scalar-button-1-hover: oklch(0.68 0.14 85);

  --scalar-scrollbar-color: oklch(0.8 0.05 86 / 0.55);
  --scalar-scrollbar-color-active: oklch(0.78 0.08 86 / 0.8);
}

.dark-mode {
  --scalar-color-1: oklch(0.94 0.01 95);
  --scalar-color-2: oklch(0.8 0.01 92);
  --scalar-color-3: oklch(0.72 0.01 90);
  --scalar-color-accent: oklch(0.78 0.15 86);

  --scalar-background-1: oklch(0.19 0.01 58);
  --scalar-background-2: oklch(0.24 0.01 58);
  --scalar-background-3: oklch(0.29 0.01 58);
  --scalar-background-accent: oklch(0.78 0.15 86 / 0.18);

  --scalar-border-color: oklch(0.35 0.015 62 / 0.9);

  --scalar-button-1: oklch(0.76 0.15 86);
  --scalar-button-1-color: oklch(0.2 0.01 55);
  --scalar-button-1-hover: oklch(0.72 0.13 86);
}

.light-mode body {
  background-image:
    radial-gradient(circle at 8% 10%, oklch(0.82 0.14 85 / 22%) 0, transparent 35%),
    radial-gradient(circle at 90% 0%, oklch(0.9 0.06 100 / 30%) 0, transparent 35%);
  background-attachment: fixed;
}

.light-mode .t-doc__sidebar,
.dark-mode .t-doc__sidebar {
  --scalar-sidebar-item-active-background: var(--scalar-background-accent);
  --scalar-sidebar-color-active: var(--scalar-color-accent);
}
`

export const createDogeConnectApiApp = (dependencies: DogeConnectApiDependencies) =>
  new Elysia({ prefix: "/api" })
    .use(
      openapi({
        path: "/openapi",
        specPath: "/openapi/json",
        scalar: {
          customCss: openApiThemeCss,
        },
        documentation: {
          info: {
            title: "OnlyDoge DogeConnect Debugger API",
            version: "1.0.0",
            description:
              "Validation and no-op relay simulation endpoints for DogeConnect development.",
          },
          tags: [
            { name: "Tools", description: "URI and envelope validation" },
            { name: "Mock", description: "Mock DogeConnect fixture generators" },
            { name: "Relay", description: "No-op relay simulation endpoints" },
            { name: "Relay Debug", description: "Scenario and state controls" },
            { name: "Flight Recorder", description: "End-to-end DogeConnect session tracing" },
          ],
        },
      })
    )
    .post(
      "/flight-recorder/session",
      async ({ body, request }) => {
        const payload: BuildFlightRecorderSessionInput =
          body.source.mode === "qr"
            ? {
                source: {
                  mode: "qr",
                  uri: body.source.uri,
                },
                targetMode: body.targetMode,
                faults: body.faults,
                options: body.options,
                origin: new URL(request.url).origin,
              }
            : {
                source: {
                  mode: "mock",
                  paymentId: body.source.paymentId,
                },
                targetMode: body.targetMode,
                faults: body.faults,
                options: body.options,
                origin: new URL(request.url).origin,
              }

        return dependencies.buildFlightRecorderSessionUseCase.execute(payload)
      },
      {
        detail: {
          tags: ["Flight Recorder"],
          summary: "Build a Flight Recorder session from a QR or mock source",
        },
        body: t.Object({
          source: t.Union([
            t.Object({
              mode: t.Literal("qr"),
              uri: t.String(),
            }),
            t.Object({
              mode: t.Literal("mock"),
              paymentId: t.Optional(t.String()),
            }),
          ]),
          targetMode: t.Union([t.Literal("simulator"), t.Literal("live")]),
          faults: t.Optional(t.Array(flightRecorderFaultSchema)),
          options: t.Optional(
            t.Object({
              includeInitialStatus: t.Optional(t.Boolean()),
            })
          ),
        }),
        response: flightRecorderSessionSchema,
      }
    )
    .post(
      "/flight-recorder/relay/status",
      async ({ body, set }) => {
        const parsed = parseImportedFlightRecorderSession(body.session)
        if (!parsed.value) {
          set.status = 400
          return { errors: parsed.issues }
        }

        return dependencies.executeFlightRecorderRelayStatusUseCase.execute({
          session: parsed.value,
        })
      },
      {
        detail: {
          tags: ["Flight Recorder"],
          summary: "Append a traced relay status check to a Flight Recorder session",
        },
        body: t.Object({
          session: flightRecorderSessionSchema,
        }),
        response: {
          200: flightRecorderSessionSchema,
          400: t.Object({
            errors: t.Array(validationIssueSchema),
          }),
        },
      }
    )
    .post(
      "/flight-recorder/relay/pay",
      async ({ body, set }) => {
        const parsed = parseImportedFlightRecorderSession(body.session)
        if (!parsed.value) {
          set.status = 400
          return { errors: parsed.issues }
        }

        return dependencies.executeFlightRecorderRelayPayUseCase.execute({
          session: parsed.value,
          liveWriteArmed: body.liveWriteArmed,
        })
      },
      {
        detail: {
          tags: ["Flight Recorder"],
          summary: "Append a traced relay pay request to a Flight Recorder session",
        },
        body: t.Object({
          session: flightRecorderSessionSchema,
          liveWriteArmed: t.Boolean(),
        }),
        response: {
          200: flightRecorderSessionSchema,
          400: t.Object({
            errors: t.Array(validationIssueSchema),
          }),
        },
      }
    )
    .post(
      "/tools/mock-qr",
      ({ body, request }) =>
        dependencies.generateMockQrUseCase.execute({
          paymentId: body.paymentId,
          origin: new URL(request.url).origin,
        }),
      {
        detail: {
          tags: ["Mock"],
          summary: "Generate a valid mock DogeConnect QR URI fixture",
        },
        body: t.Object({
          paymentId: t.Optional(t.String()),
        }),
        response: mockQrResponseSchema,
      }
    )
    .get(
      "/tools/mock-envelope/:paymentId",
      ({ params }) =>
        dependencies.getMockEnvelopeUseCase.execute({
          paymentId: params.paymentId,
        }),
      {
        detail: {
          tags: ["Mock"],
          summary: "Fetch mock envelope by payment ID for dc endpoint testing",
        },
        params: t.Object({
          paymentId: t.String(),
        }),
        response: mockEnvelopeSchema,
      }
    )
    .post(
      "/tools/validate-qr",
      async ({ body }) =>
        dependencies.validateDogeConnectUriUseCase.execute({
          uri: body.uri,
          fetchEnvelope: body.fetchEnvelope,
        }),
      {
        detail: {
          tags: ["Tools"],
          summary: "Validate a DogeConnect QR URI",
        },
        body: t.Object({
          uri: t.String(),
          fetchEnvelope: t.Optional(t.Boolean()),
        }),
        response: t.Object({
          verdict: t.Union([t.Literal("valid"), t.Literal("invalid"), t.Literal("inconclusive")]),
          checks: t.Array(validationCheckSchema),
          errors: t.Array(validationIssueSchema),
          parsed: t.Union([
            t.Null(),
            t.Object({
              address: t.String(),
              amount: t.String(),
              connectUrl: t.String(),
              pubKeyHashBase64Url: t.String(),
              isConnectUri: t.Boolean(),
            }),
          ]),
          envelopeValidation: t.Optional(t.Any()),
        }),
      }
    )
    .post(
      "/tools/validate-envelope",
      ({ body }) =>
        dependencies.validatePaymentEnvelopeUseCase.execute({
          envelope: body.envelope,
          expectedHash: body.expectedHash,
        }),
      {
        detail: {
          tags: ["Tools"],
          summary: "Validate a DogeConnect payment envelope",
        },
        body: t.Object({
          envelope: t.Any(),
          expectedHash: t.Optional(t.String()),
        }),
        response: t.Object({
          verdict: t.Union([t.Literal("valid"), t.Literal("invalid")]),
          checks: t.Array(validationCheckSchema),
          errors: t.Array(validationIssueSchema),
          envelope: t.Union([
            t.Null(),
            t.Object({
              version: t.String(),
              payload: t.String(),
              pubkey: t.String(),
              sig: t.String(),
            }),
          ]),
          payment: t.Union([t.Null(), t.Record(t.String(), t.Any())]),
        }),
      }
    )
    .post(
      "/relay/pay",
      async ({ body, set }) => {
        const result = await dependencies.relayPayUseCase.execute(body)
        set.status = result.statusCode
        return result.body
      },
      {
        detail: {
          tags: ["Relay"],
          summary: "Submit payment transaction to relay simulator",
        },
        body: t.Object({
          id: t.String(),
          tx: t.String(),
          refund: t.Optional(t.String()),
          relay_token: t.Optional(t.String()),
        }),
        response: {
          200: relayStatusSchema,
          400: relayErrorSchema,
          404: relayErrorSchema,
        },
      }
    )
    .post(
      "/relay/status",
      async ({ body, set }) => {
        const result = await dependencies.relayStatusUseCase.execute(body)
        set.status = result.statusCode
        return result.body
      },
      {
        detail: {
          tags: ["Relay"],
          summary: "Read current relay payment status",
        },
        body: t.Object({
          id: t.String(),
        }),
        response: {
          200: relayStatusSchema,
          400: relayErrorSchema,
          404: relayErrorSchema,
        },
      }
    )
    .post(
      "/relay/debug/payment",
      async ({ body, set }) => {
        const result = await dependencies.registerRelayScenarioUseCase.execute(body)
        if (!result.ok) {
          set.status = 400
          return { errors: result.errors }
        }
        return result.record
      },
      {
        detail: {
          tags: ["Relay Debug"],
          summary: "Register or update a relay simulation scenario",
        },
        body: t.Object({
          id: t.String(),
          scenario: t.Union([
            t.Literal("accepted"),
            t.Literal("confirmed"),
            t.Literal("declined"),
            t.Literal("error"),
          ]),
          reason: t.Optional(t.String()),
          relayToken: t.Optional(t.String()),
          required: t.Optional(t.Number()),
          dueSec: t.Optional(t.Number()),
        }),
        response: {
          200: t.Object({
            id: t.String(),
            scenario: t.String(),
            status: t.String(),
            reason: t.String(),
            txid: t.String(),
            relayToken: t.String(),
            required: t.Number(),
            confirmed: t.Number(),
            dueSec: t.Number(),
            confirmedAt: t.String(),
            updatedAt: t.String(),
          }),
          400: t.Object({
            errors: t.Array(validationIssueSchema),
          }),
        },
      }
    )
    .get("/relay/debug/payments", async () => dependencies.listRelayScenariosUseCase.execute(), {
      detail: {
        tags: ["Relay Debug"],
        summary: "List relay simulation records",
      },
      response: t.Array(
        t.Object({
          id: t.String(),
          scenario: t.String(),
          status: t.String(),
          reason: t.String(),
          txid: t.String(),
          relayToken: t.String(),
          required: t.Number(),
          confirmed: t.Number(),
          dueSec: t.Number(),
          confirmedAt: t.String(),
          updatedAt: t.String(),
        })
      ),
    })
    .post(
      "/relay/debug/reset",
      async () => {
        await dependencies.resetRelayStateUseCase.execute()
        return { ok: true }
      },
      {
        detail: {
          tags: ["Relay Debug"],
          summary: "Reset relay simulation state",
        },
        response: t.Object({
          ok: t.Boolean(),
        }),
      }
    )
