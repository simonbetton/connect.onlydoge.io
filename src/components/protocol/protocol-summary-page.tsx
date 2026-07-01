import type { PageJumpNavItem } from "@/components/page-jump-nav"
import { Badge } from "@/components/ui/badge"
import { Heading } from "@/components/ui/heading"
import { Paragraph } from "@/components/ui/paragraph"
import { SiteContainer } from "../site-container"
import { ProtocolSectionNav } from "./protocol-section-nav"
import { DefList, ExternalDocLink, ProtoCode, SectionHang } from "./protocol-summary-parts"
import { ProtocolTryItSection } from "./protocol-try-it-section"

const specIntroHref = "https://connect.dogecoin.org/getting_started/introduction.html"
const specPrintHref = "https://connect.dogecoin.org/print.html"
const dogeconnectGoHref = "https://github.com/dogeorg/dogeconnect-go"

const sectionNavItems: PageJumpNavItem[] = [
  { href: "#lede", label: "Overview" },
  { href: "#three-parts", label: "Three parts" },
  { href: "#flow", label: "Flow" },
  { href: "#merchants", label: "Merchants" },
  { href: "#integrators", label: "Integrators" },
  { href: "#spec", label: "Full spec" },
  { href: "#next", label: "Try it" },
]

const protocolParts = [
  {
    name: "Payment QR codes",
    detail:
      "URIs that point at a hosted request, not just an address. dogecoin: adds dc (envelope URL) and h (relay key hash). dogeconnect: drops legacy fallback.",
  },
  {
    name: "Payment Envelope",
    detail:
      "Signed JSON (version, payload, pubkey, sig) with vendor branding, line items, taxes, and the exact outputs to pay.",
  },
  {
    name: "Payment Relay API",
    detail:
      "relay/pay and relay/status POST endpoints. The wallet submits a signed transaction and polls for accepted, confirmed, or declined.",
  },
] as const

const paymentFlow = [
  "Customer wants to buy from a vendor.",
  "Vendor software asks the Payment Relay to start a payment with itemised details.",
  "Relay returns a QR URI and payment ID.",
  "Customer scans the code. The wallet fetches the Payment Envelope from the dc URL.",
  "Wallet checks the h hash against the envelope pubkey to catch tampering.",
  "Wallet verifies the BIP-340 Schnorr signature, shows the itemised total, and asks for confirmation.",
  "Customer signs. Wallet POSTs the transaction to relay/pay.",
  "Relay validates outputs, fee, and size limits, then broadcasts to Dogecoin.",
  "Vendor hears accepted, then confirmed once enough blocks arrive. Confirmation depth is the relay's call.",
] as const

const merchantBenefits = [
  {
    term: "Receipts before signing",
    detail: "Customer sees vendor name, logo, SKUs, tax, and fees in the wallet.",
  },
  {
    term: "Fixed outputs",
    detail: "Amounts and addresses come from the signed envelope, not an editable amount field.",
  },
  {
    term: "Earlier feedback",
    detail: "Relay status beats waiting to spot the transaction on-chain yourself.",
  },
  {
    term: "Risk policy you control",
    detail: "Your relay sets minimum fees, max transaction size, and required confirmations.",
  },
  {
    term: "Backward-compatible QR codes",
    detail:
      "Legacy wallets still read the embedded address and amount. DogeConnect wallets use the full payload.",
  },
] as const

const integratorNotes = [
  {
    term: "URI parsing",
    detail:
      "Explicit rules for dogecoin: (dc and h must appear together) and dogeconnect: schemes.",
  },
  {
    term: "Cryptographic checks",
    detail: "Pubkey hash, double-SHA256 payload hash, BIP-340 Schnorr verify.",
  },
  {
    term: "Amount encoding",
    detail: "8-DP string amounts so JSON floats do not eat precision.",
  },
  {
    term: "Idempotent relay/pay",
    detail: "Retries must not double-charge.",
  },
  {
    term: "HTTP semantics",
    detail: "400/403 permanent, 500/503 retry with backoff.",
  },
  {
    term: "Reference code",
    detail: "dogeorg/dogeconnect-go on GitHub.",
    href: dogeconnectGoHref,
  },
] as const

const specChapters = [
  {
    title: "Introduction",
    href: "https://connect.dogecoin.org/getting_started/introduction.html",
  },
  { title: "Payment QR-Code", href: "https://connect.dogecoin.org/qr_codes/qr_codes.html" },
  {
    title: "Payment Envelope",
    href: "https://connect.dogecoin.org/payment_envelope/envelope.html",
  },
  { title: "Payment Relay", href: "https://connect.dogecoin.org/payment_relay/relay.html" },
  {
    title: "Schema Reference",
    href: "https://connect.dogecoin.org/schema_reference/schema_reference.html",
  },
] as const

function ProtocolPartCard({
  index,
  name,
  detail,
}: {
  index: number
  name: string
  detail: string
}) {
  return (
    <div className="micro-hover-lift rounded-3xl border border-border/70 bg-card/70 p-5 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset]">
      <span className="grid size-9 place-items-center rounded-full bg-primary/55 font-display font-semibold text-foreground text-sm">
        {index}
      </span>
      <Paragraph size="lg" color="foreground" font="display" className="mt-5 font-semibold">
        {name}
      </Paragraph>
      <Paragraph size="sm" className="mt-2">
        {detail}
      </Paragraph>
    </div>
  )
}

export function ProtocolSummaryPage() {
  return (
    <div className="min-w-0">
      <section className="relative overflow-hidden border-border/70 border-b py-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_20%_10%,oklch(from_var(--primary)_l_c_h/0.3),transparent_34%),linear-gradient(180deg,var(--color-hero-wash),transparent)]"
          aria-hidden
        />
        <SiteContainer className="relative">
          <div className="max-w-[68ch]">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">Protocol summary</Badge>
              <Badge variant="success">Ready to implement</Badge>
            </div>
            <Heading as="h1" size="hero" className="wrap-anywhere mt-5 max-w-[12ch]">
              DogeConnect in plain terms
            </Heading>
            <Paragraph size="xl" color="foreground" className="mt-6 max-w-[52ch]">
              A plain <ProtoCode highlight>dogecoin:</ProtoCode> QR code sends coins to an address.
              DogeConnect turns that moment into a signed payment request with relay feedback and
              wallet-grade verification.
            </Paragraph>
          </div>
        </SiteContainer>
      </section>

      <SiteContainer className="grid gap-(--space-xl) py-10 sm:py-12 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:items-start lg:gap-(--space-2xl)">
        <aside
          className="sticky top-[calc(var(--space-xl)+4rem)] hidden pt-(--space-xs) lg:block"
          aria-label="On this page"
        >
          <Paragraph size="xs-medium" className="mb-4 uppercase tracking-(--tracking-label)">
            On this page
          </Paragraph>
          <ProtocolSectionNav
            items={sectionNavItems}
            ariaLabel="Protocol summary sections"
            orientation="vertical"
          />
        </aside>

        <article className="min-w-0">
          <section id="lede" className="scroll-mt-24 sm:scroll-mt-28">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)]">
              <div className="flex flex-col gap-5">
                <Paragraph>
                  The merchant no longer waits in the dark for block confirmation. The payer no
                  longer sees only an address and an amount. The wallet can inspect vendor details,
                  fixed outputs, line items, fees, and a relay contract before signing.
                </Paragraph>
                <Paragraph>
                  DogeConnect defines how a vendor sends a detailed payment request to a wallet, and
                  how a Payment Relay validates the signed transaction before it reaches the
                  network.
                </Paragraph>
                <Paragraph>
                  The authoritative specification lives at{" "}
                  <ExternalDocLink href={specIntroHref}>connect.dogecoin.org</ExternalDocLink>.
                </Paragraph>
              </div>
              <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset]">
                <Paragraph size="sm-medium" color="foreground">
                  Mental model
                </Paragraph>
                <div className="mt-4 grid gap-3">
                  {["QR points at request", "Envelope proves intent", "Relay reports progress"].map(
                    (label) => (
                      <div key={label} className="rounded-2xl bg-muted/45 p-3">
                        <Paragraph size="sm-medium" color="foreground">
                          {label}
                        </Paragraph>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          <SectionHang id="three-parts">Three parts</SectionHang>
          <Paragraph className="mb-6 max-w-[56ch]">
            The protocol has three pieces that work together, and each piece maps to a page in this
            debugger.
          </Paragraph>
          <div className="grid gap-4 lg:grid-cols-3">
            {protocolParts.map((part, index) => (
              <ProtocolPartCard
                key={part.name}
                index={index + 1}
                name={part.name}
                detail={part.detail}
              />
            ))}
          </div>

          <SectionHang id="flow">How a payment moves</SectionHang>
          <ol className="m-0 flex list-none flex-col gap-6 p-0">
            {paymentFlow.map((step, index) => (
              <li
                key={step}
                className="group/flow-step grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4"
              >
                <span
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-paper-2 font-display font-semibold text-(--text-xs) text-foreground transition-transform duration-(--dur-press) ease-[var(--ease-out)] group-hover/flow-step:scale-105 motion-reduce:group-hover/flow-step:scale-100"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <Paragraph className="m-0">{step}</Paragraph>
              </li>
            ))}
          </ol>

          <SectionHang id="merchants">What merchants get</SectionHang>
          <DefList items={merchantBenefits} />

          <SectionHang id="integrators">What wallet and relay builders get</SectionHang>
          <DefList items={integratorNotes} />

          <SectionHang id="spec">Full specification</SectionHang>
          <Paragraph className="mb-6 max-w-[56ch]">
            This page is a summary. Authoritative detail lives in the official book.
          </Paragraph>
          <div className="divide-y divide-border/70 rounded-3xl border border-border/70 bg-card/70">
            {specChapters.map((chapter) => (
              <div key={chapter.href} className="grid gap-2 p-5 sm:grid-cols-[14rem_minmax(0,1fr)]">
                <Paragraph size="sm-medium" color="foreground">
                  {chapter.title}
                </Paragraph>
                <ExternalDocLink href={chapter.href}>
                  {chapter.href.replace("https://", "")}
                </ExternalDocLink>
              </div>
            ))}
          </div>
          <Paragraph size="sm" className="mt-6">
            Printable version:{" "}
            <ExternalDocLink href={specPrintHref}>connect.dogecoin.org/print.html</ExternalDocLink>
          </Paragraph>

          <ProtocolTryItSection />
        </article>
      </SiteContainer>
    </div>
  )
}
