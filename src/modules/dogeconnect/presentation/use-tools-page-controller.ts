import { useNavigate, useSearch } from "@tanstack/react-router"
import * as React from "react"
import {
  cleanToolsSearch,
  defaultToolsSearch,
  resolveToolsSearch,
} from "@/modules/dogeconnect/presentation/tools-search"
import { useToolsPageForms } from "./use-tools-page-forms"
import { useToolsPageMockActions } from "./use-tools-page-mock-actions"
import { useToolsPageMutations } from "./use-tools-page-mutations"

export function useToolsPageController() {
  const isClient = typeof window !== "undefined"
  const rawSearch = useSearch({ from: "/tools" })
  const search = resolveToolsSearch(rawSearch)
  const navigate = useNavigate({ from: "/tools" })
  const navigateRef = React.useRef(navigate)
  navigateRef.current = navigate
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

  const mutations = useToolsPageMutations(isClient)

  const forms = useToolsPageForms({
    search,
    validateQrMutation: mutations.validateQrMutation,
    validateEnvelopeMutation: mutations.validateEnvelopeMutation,
    generateMockQrMutation: mutations.generateMockQrMutation,
    registerScenarioMutation: mutations.registerScenarioMutation,
    relayPayMutation: mutations.relayPayMutation,
    relayStatusMutation: mutations.relayStatusMutation,
    setEnvelopeInputError,
    setMockCopyState,
  })

  const mockActions = useToolsPageMockActions({
    generateMockQrMutation: mutations.generateMockQrMutation,
    validateQrMutation: mutations.validateQrMutation,
    qrForm: forms.qrForm,
    updateSearch,
    setQrPreviewUri,
    setMockCopyState,
  })

  React.useEffect(() => {
    setQrPreviewUri(search.qrUri)
  }, [search.qrUri])

  return {
    updateSearch,
    ...mutations,
    ...forms,
    envelopeInputError,
    qrPreviewUri,
    mockCopyState,
    loadMockIntoQrValidator: mockActions.loadMockIntoQrValidator,
    validateGeneratedMockUri: mockActions.validateGeneratedMockUri,
    copyMockUri: mockActions.copyMockUri,
    setQrPreviewUri,
  }
}
