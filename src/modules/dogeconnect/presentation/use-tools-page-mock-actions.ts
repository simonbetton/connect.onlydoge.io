import type { UseMutationResult } from "@tanstack/react-query"
import type {
  MockQrFixturePayload,
  QrValidationPayload,
} from "@/modules/dogeconnect/application/contracts"
import type { defaultToolsSearch } from "@/modules/dogeconnect/presentation/tools-search"

type QrValidatorForm = {
  setFieldValue: (field: "uri" | "fetchEnvelope", value: string | boolean) => void
}

export function useToolsPageMockActions({
  generateMockQrMutation,
  validateQrMutation,
  qrForm,
  updateSearch,
  setQrPreviewUri,
  setMockCopyState,
}: {
  generateMockQrMutation: UseMutationResult<MockQrFixturePayload, Error, { paymentId: string }>
  validateQrMutation: UseMutationResult<
    QrValidationPayload,
    Error,
    { uri: string; fetchEnvelope: boolean }
  >
  qrForm: QrValidatorForm
  updateSearch: (patch: Partial<typeof defaultToolsSearch>) => void
  setQrPreviewUri: (value: string) => void
  setMockCopyState: (value: "idle" | "copied" | "failed") => void
}) {
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

  return {
    loadMockIntoQrValidator,
    validateGeneratedMockUri,
    copyMockUri,
  }
}
