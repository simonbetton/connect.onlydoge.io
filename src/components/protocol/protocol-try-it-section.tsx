import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { Paragraph } from "@/components/ui/paragraph"
import { SectionHang } from "./protocol-summary-parts"

const tryItOptions = [
  {
    to: "/tools" as const,
    label: "Tools",
    description: "Validate QR URIs, inspect envelope signatures, and run relay simulator checks.",
    hint: "Best for one-off payloads",
  },
  {
    to: "/flight-recorder" as const,
    label: "Flight Recorder",
    description: "Build a timeline from QR parsing through relay pay and status execution.",
    hint: "Best for end-to-end traces",
  },
] as const

export function ProtocolTryItSection() {
  return (
    <section className="mt-(--space-3xl) scroll-mt-24 border-border border-t pt-(--space-xl) sm:scroll-mt-28">
      <SectionHang id="next">Try it here</SectionHang>
      <Paragraph className="mb-6">
        OnlyDoge DogeConnect Debugger runs locally — no live relay writes unless you opt in.
      </Paragraph>
      <div className="mt-6 overflow-hidden rounded-lg border border-border sm:grid sm:grid-cols-2">
        {tryItOptions.map((option) => (
          <Link
            key={option.to}
            to={option.to}
            className="group micro-hover-lift micro-link-nudge micro-press flex min-w-0 items-start justify-between gap-6 border-border border-b p-6 text-inherit no-underline transition-[background-color,border-color] duration-200 ease-out last:border-b-0 hover:bg-muted/28 focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2 motion-reduce:active:scale-100 sm:border-r sm:border-b-0 sm:first:border-r"
          >
            <div className="min-w-0">
              <Paragraph size="base" color="foreground" font="display" className="font-medium">
                {option.label}
              </Paragraph>
              <Paragraph size="sm" className="mt-1 leading-[1.55]">
                {option.description}
              </Paragraph>
              <Paragraph size="xs" className="mt-2">
                {option.hint}
              </Paragraph>
            </div>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              className="mt-0.5 shrink-0 text-muted-foreground transition-[transform,color] duration-140 ease-out group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:group-hover:translate-x-0"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
