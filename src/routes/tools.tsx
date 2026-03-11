import { createFileRoute } from "@tanstack/react-router"
import { ToolsPage } from "@/modules/dogeconnect/presentation/tools-page"

export const Route = createFileRoute("/tools")({
  component: ToolsPage,
})
