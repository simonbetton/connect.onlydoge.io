import { useForm } from "@tanstack/react-form"
import type { UseMutationResult } from "@tanstack/react-query"
import type {
  EnvelopeValidationPayload,
  MockQrFixturePayload,
  QrValidationPayload,
} from "@/modules/dogeconnect/application/contracts"
import { defaultToolsSearch } from "@/modules/dogeconnect/presentation/tools-search"

export function useToolsPageForms({
  search,
  validateQrMutation,
  validateEnvelopeMutation,
  generateMockQrMutation,
  registerScenarioMutation,
  relayPayMutation,
  relayStatusMutation,
  setEnvelopeInputError,
  setMockCopyState,
}: {
  search: ReturnType<typeof import("./tools-search").resolveToolsSearch>
  validateQrMutation: UseMutationResult<
    QrValidationPayload,
    Error,
    { uri: string; fetchEnvelope: boolean }
  >
  validateEnvelopeMutation: UseMutationResult<
    EnvelopeValidationPayload,
    Error,
    { envelope: unknown; expectedHash?: string }
  >
  generateMockQrMutation: UseMutationResult<MockQrFixturePayload, Error, { paymentId: string }>
  registerScenarioMutation: UseMutationResult<
    unknown,
    Error,
    {
      id: string
      scenario: import("./tools-search").RelayScenarioOption
      reason: string
      relayToken: string
      required: number
      dueSec: number
    }
  >
  relayPayMutation: UseMutationResult<
    unknown,
    Error,
    { id: string; tx: string; refund: string; relay_token: string }
  >
  relayStatusMutation: UseMutationResult<unknown, Error, { id: string }>
  setEnvelopeInputError: (value: string) => void
  setMockCopyState: (value: "idle" | "copied" | "failed") => void
}) {
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

  return {
    qrForm,
    envelopeForm,
    mockQrForm,
    registerForm,
    relayPayForm,
    relayStatusForm,
  }
}
