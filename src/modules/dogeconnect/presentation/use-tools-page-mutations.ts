import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  EnvelopeValidationPayload,
  MockQrFixturePayload,
  QrValidationPayload,
  RelayDebugRecordView,
} from "@/modules/dogeconnect/application/contracts"
import { getJson, postJson, postJsonWithMeta } from "@/modules/dogeconnect/presentation/api-client"
import type { RelayScenarioOption } from "@/modules/dogeconnect/presentation/tools-search"

const invalidateRelayRecords = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: ["relay-debug-payments"] })
}

export function useToolsPageMutations(isClient: boolean) {
  const queryClient = useQueryClient()

  const validateQrMutation = useMutation({
    mutationFn: (values: { uri: string; fetchEnvelope: boolean }) =>
      postJson<QrValidationPayload>("/api/tools/validate-qr", values),
    onSuccess: () => invalidateRelayRecords(queryClient),
  })

  const validateEnvelopeMutation = useMutation({
    mutationFn: (values: { envelope: unknown; expectedHash?: string }) =>
      postJson<EnvelopeValidationPayload>("/api/tools/validate-envelope", values),
    onSuccess: () => invalidateRelayRecords(queryClient),
  })

  const generateMockQrMutation = useMutation({
    mutationFn: (values: { paymentId: string }) =>
      postJson<MockQrFixturePayload>("/api/tools/mock-qr", {
        paymentId: values.paymentId || undefined,
      }),
    onSuccess: () => invalidateRelayRecords(queryClient),
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
    onSuccess: async () => {
      invalidateRelayRecords(queryClient)
      await refetchRelayRecords()
    },
  })

  const resetRelayMutation = useMutation({
    mutationFn: () => postJson<{ ok: boolean }>("/api/relay/debug/reset", {}),
    onSuccess: async () => {
      invalidateRelayRecords(queryClient)
      await refetchRelayRecords()
    },
  })

  const relayPayMutation = useMutation({
    mutationFn: (values: { id: string; tx: string; refund: string; relay_token: string }) =>
      postJsonWithMeta("/api/relay/pay", {
        ...values,
        refund: values.refund || undefined,
        relay_token: values.relay_token || undefined,
      }),
    onSuccess: async () => {
      invalidateRelayRecords(queryClient)
      await refetchRelayRecords()
    },
  })

  const relayStatusMutation = useMutation({
    mutationFn: (values: { id: string }) => postJsonWithMeta("/api/relay/status", values),
    onSuccess: () => invalidateRelayRecords(queryClient),
  })

  return {
    validateQrMutation,
    validateEnvelopeMutation,
    generateMockQrMutation,
    relayRecords,
    refetchRelayRecords,
    registerScenarioMutation,
    resetRelayMutation,
    relayPayMutation,
    relayStatusMutation,
  }
}
