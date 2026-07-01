import type * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-2xl border border-input bg-background/75 px-3.5 py-2 text-base shadow-[0_1px_0_oklch(1_0_0/0.55)_inset] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
