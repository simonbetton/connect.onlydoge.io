import { createFileRoute } from "@tanstack/react-router"
import { ToolsPage } from "@/modules/dogeconnect/presentation/tools-page"
import { validateToolsSearch } from "@/modules/dogeconnect/presentation/tools-search"

export const Route = createFileRoute("/tools")({
  validateSearch: validateToolsSearch,
  component: ToolsPage,
})
