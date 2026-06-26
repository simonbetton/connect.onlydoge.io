import { type ReactNode, useId } from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

export function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  className?: string
  children: (id: string) => ReactNode
}) {
  const autoId = useId()
  const id = htmlFor ?? autoId

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
    </div>
  )
}
