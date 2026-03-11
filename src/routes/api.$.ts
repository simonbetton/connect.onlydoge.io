import { createFileRoute } from "@tanstack/react-router"
import { dogeConnectApiApp } from "@/modules/dogeconnect/adapters/http/api-composition-root"

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      ANY: ({ request }) => dogeConnectApiApp.handle(request),
    },
  },
})
