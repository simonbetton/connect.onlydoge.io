import { Button as ButtonPrimitive } from "@base-ui/react/button"
import type { VariantProps } from "class-variance-authority"
import type * as React from "react"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

function ButtonRoot({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

function ButtonText(props: React.ComponentProps<"span">) {
  return <span {...props} />
}

const Button = Object.assign(ButtonRoot, {
  Text: ButtonText,
})

export { Button }
