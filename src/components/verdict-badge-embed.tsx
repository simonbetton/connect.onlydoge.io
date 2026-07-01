import { Badge } from "@/components/ui/badge"

export function VerdictBadgeEmbed({ verdict }: { verdict: "valid" | "invalid" | "inconclusive" }) {
  const variant = verdict === "valid" ? "success" : verdict === "invalid" ? "danger" : "warning"

  return <Badge variant={variant}>{verdict}</Badge>
}
