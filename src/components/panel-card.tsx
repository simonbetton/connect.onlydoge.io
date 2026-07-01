import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function PanelCard({
  id,
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  id?: string
  title: string
  description: string
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Card
      id={id}
      className={cn("min-w-0 overflow-hidden", id ? "scroll-mt-24" : undefined, className)}
    >
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}
