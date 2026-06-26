import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import * as React from "react"
import type {
  EnvelopeValidationPayload,
  MockQrFixturePayload,
  QrValidationPayload,
  RelayDebugRecordView,
} from "@/modules/dogeconnect/application/contracts"
import { getJson, postJson, postJsonWithMeta } from "@/modules/dogeconnect/presentation/api-client"
import {
  cleanToolsSearch,
  defaultToolsSearch,
  type RelayScenarioOption,
  resolveToolsSearch,
} from "@/modules/dogeconnect/presentation/tools-search"
import {
  EnvelopeValidatorCard,
  MockQrFixtureCard,
  QrValidatorCard,
  RelayRegistrationCard,
  RelayTesterCard,
  ToolsPageHero,
  ToolsQuickStartSection,
} from "./tools-page-sections"

export function ToolsPage() {
  const isClient = typeof window !== "undefined"
  const rawSearch = useSearch({ from: "/tools" })
  const search = resolveToolsSearch(rawSearch)
  const navigate = useNavigate({ from: "/tools" })
  const navigateRef = React.useRef(navigate)
  navigateRef.current = navigate
  const queryClient = useQueryClient()
  const [envelopeInputError, setEnvelopeInputError] = React.useState("")
  const [qrPreviewUri, setQrPreviewUri] = React.useState(search.qrUri)
  const [mockCopyState, setMockCopyState] = React.useState<"idle" | "copied" | "failed">("idle")

  const updateSearch = React.useCallback((patch: Partial<typeof defaultToolsSearch>) => {
    React.startTransition(() => {
      void navigateRef.current({
        search: (previous) =>
          cleanToolsSearch({
            ...defaultToolsSearch,
            ...previous,
            ...patch,
          }),
        replace: true,
        resetScroll: false,
      })
    })
  }, [])

  const validateQrMutation = useMutation({
    mutationFn: (values: { uri: string; fetchEnvelope: boolean }) =>
      postJson<QrValidationPayload>("/api/tools/validate-qr", values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["relay-debug-payments"] })
    },
  })

  const validateEnvelopeMutation = useMutation({
    mutationFn: (values: { envelope: unknown; expectedHash?: string }) =>
      postJson<EnvelopeValidationPayload>("/api/tools/validate-envelope", values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["relay-debug-payments"] })
    },
  })

  const generateMockQrMutation = useMutation({
    mutationFn: (values: { paymentId: string }) =>
      postJson<MockQrFixturePayload>("/api/tools/mock-qr", {
        paymentId: values.paymentId || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["relay-debug-payments"] })
    },
  })

  const { data: relayRecords = [], refetch: refetchRelayRecords } = useQuery({
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
      void queryClient.invalidateQueries({ queryKey: ["relay-debug-payments"] })
      void refetchRelayRecords()
    },
  })

  const resetRelayMutation = useMutation({
    mutationFn: () => postJson<{ ok: boolean }>("/api/relay/debug/reset", {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["relay-debug-payments"] })
      void refetchRelayRecords()
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
      void queryClient.invalidateQueries({ queryKey: ["relay-debug-payments"] })
      void refetchRelayRecords()
    },
  })

  const relayStatusMutation = useMutation({
    mutationFn: (values: { id: string }) => postJsonWithMeta("/api/relay/status", values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["relay-debug-payments"] })
    },
  })

  const qrForm = useForm({
    defaultValues: {
      uri: search.qrUri,
      fetchEnvelope: search.qrFetchEnvelope,
    },
    onSubmit: async ({ value }) => {
      await validateQrMutation.mutateAsync(value)
    },
  })

  const envelopeForm = useForm({
    defaultValues: {
      envelope: defaultToolsSearch.envelopeJson,
      expectedHash: search.envelopeExpectedHash,
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
      paymentId: search.mockPaymentId,
    },
    onSubmit: async ({ value }) => {
      setMockCopyState("idle")
      await generateMockQrMutation.mutateAsync(value)
    },
  })

  const registerForm = useForm({
    defaultValues: {
      id: search.relayRegisterId,
      scenario: search.relayRegisterScenario,
      reason: search.relayRegisterReason,
      relayToken: search.relayRegisterToken,
      required: search.relayRegisterRequired,
      dueSec: search.relayRegisterDueSec,
    },
    onSubmit: async ({ value }) => {
      await registerScenarioMutation.mutateAsync(value)
    },
  })

  const relayPayForm = useForm({
    defaultValues: {
      id: search.relayPayId,
      tx: defaultToolsSearch.relayPayTx,
      refund: defaultToolsSearch.relayPayRefund,
      relay_token: defaultToolsSearch.relayPayRelayToken,
    },
    onSubmit: async ({ value }) => {
      await relayPayMutation.mutateAsync(value)
    },
  })

  const relayStatusForm = useForm({
    defaultValues: {
      id: search.relayStatusId,
    },
    onSubmit: async ({ value }) => {
      await relayStatusMutation.mutateAsync(value)
    },
  })

  React.useEffect(() => {
    setQrPreviewUri(search.qrUri)
  }, [search.qrUri])

  const loadMockIntoQrValidator = () => {
    const mock = generateMockQrMutation.data
    if (!mock) {
      return
    }

    qrForm.setFieldValue("uri", mock.uri)
    setQrPreviewUri(mock.uri)
    qrForm.setFieldValue("fetchEnvelope", true)
    updateSearch({
      qrUri: mock.uri,
      qrFetchEnvelope: true,
    })
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
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <ToolsPageHero />
      <ToolsQuickStartSection />

      <MockQrFixtureCard
        mockQrForm={mockQrForm}
        generateMockQrMutation={generateMockQrMutation}
        validateQrMutation={validateQrMutation}
        mockCopyState={mockCopyState}
        onUpdateSearch={updateSearch}
        onCopyMockUri={copyMockUri}
        onLoadMockIntoQrValidator={loadMockIntoQrValidator}
        onValidateGeneratedMockUri={() => {
          void validateGeneratedMockUri()
        }}
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <QrValidatorCard
          qrForm={qrForm}
          validateQrMutation={validateQrMutation}
          qrPreviewUri={qrPreviewUri}
          onUpdateSearch={updateSearch}
          onSetQrPreviewUri={setQrPreviewUri}
        />
        <EnvelopeValidatorCard
          envelopeForm={envelopeForm}
          validateEnvelopeMutation={validateEnvelopeMutation}
          envelopeInputError={envelopeInputError}
          onUpdateSearch={updateSearch}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <RelayRegistrationCard
          registerForm={registerForm}
          registerScenarioMutation={registerScenarioMutation}
          resetRelayMutation={resetRelayMutation}
          relayRecords={relayRecords}
          onUpdateSearch={updateSearch}
          onRefetchRelayRecords={() => {
            void refetchRelayRecords()
          }}
        />
        <RelayTesterCard
          relayPayForm={relayPayForm}
          relayStatusForm={relayStatusForm}
          relayPayMutation={relayPayMutation}
          relayStatusMutation={relayStatusMutation}
          onUpdateSearch={updateSearch}
        />
      </div>
    </div>
  )
}
