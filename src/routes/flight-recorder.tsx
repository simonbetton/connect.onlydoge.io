import { createFileRoute } from "@tanstack/react-router"
import { FlightRecorderPage } from "@/modules/dogeconnect/presentation/flight-recorder-page"
import { validateFlightRecorderSearch } from "@/modules/dogeconnect/presentation/flight-recorder-search"

export const Route = createFileRoute("/flight-recorder")({
  validateSearch: validateFlightRecorderSearch,
  component: FlightRecorderPage,
})
