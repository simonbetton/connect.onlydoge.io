import { createFileRoute } from "@tanstack/react-router"
import { dogeConnectMcpServer } from "@/modules/dogeconnect/adapters/http/api-composition-root"

export const Route = createFileRoute("/mcp")({
  server: {
    handlers: {
      ANY: ({ request }) => dogeConnectMcpServer.handleHttp(request),
    },
  },
})
