import { createFileRoute } from "@tanstack/react-router"
import { MarketingHomePage } from "@/components/marketing/marketing-home-page"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return <MarketingHomePage />
}
