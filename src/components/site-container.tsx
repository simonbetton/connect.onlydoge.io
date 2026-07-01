import type * as React from "react"
import { cn } from "@/lib/utils"

export function SiteContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-332 px-4 sm:px-6 lg:px-5", className)} {...props} />
  )
}
