import { createFileRoute } from "@tanstack/react-router"
import { ProtocolSummaryPage } from "@/components/protocol/protocol-summary-page"

export const Route = createFileRoute("/protocol")({
  component: ProtocolSummaryPage,
})
