import { Link } from "@tanstack/react-router"
import { ExternalLinkIcon } from "@/components/external-link-icon"
import { GitHubMarkIcon } from "@/components/github-mark-icon"
import { Paragraph } from "@/components/ui/paragraph"
import { debuggerApiHref, debuggerApiLabel } from "@/lib/app-links"
import { SiteContainer } from "./site-container"

const repositoryUrl = "https://github.com/simonbetton/connect.onlydoge.io"

const footerLinks = [
  { to: "/protocol" as const, label: "Protocol" },
  { to: "/tools" as const, label: "Tools" },
  { to: "/flight-recorder" as const, label: "Flight Recorder" },
] as const

export function AppFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-footer-bg text-footer-ink">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/80 to-transparent"
        aria-hidden
      />
      <SiteContainer className="py-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="max-w-[52ch]">
            <Link
              to="/"
              aria-label="Homepage"
              className="inline-flex items-center gap-2 rounded-md text-footer-ink"
            >
              <img src="/favicon.svg" alt="" className="size-6 shrink-0" />
              <Paragraph as="span" size="sm-medium" color="inherit" font="display">
                DogeConnect Debugger
              </Paragraph>
            </Link>
            <Paragraph size="sm" className="mt-4 text-footer-muted">
              A premium local workbench for validating DogeConnect QR codes, payment envelopes,
              relay contracts, and full debugging sessions.
            </Paragraph>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-3 lg:justify-end">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-normal text-footer-muted text-sm hover:text-footer-ink"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={debuggerApiHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-normal text-footer-muted text-sm hover:text-footer-ink"
            >
              {debuggerApiLabel}
              <ExternalLinkIcon className="size-3" />
            </a>
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-normal text-footer-muted text-sm hover:text-footer-ink"
            >
              <GitHubMarkIcon className="size-4" />
              GitHub
            </a>
          </div>
        </div>
        <div className="mt-8 border-footer-rule border-t pt-6">
          <Paragraph size="xs" className="text-footer-muted">
            Built for Dogecoin builders who need repeatable evidence before shipping wallet and
            relay integrations.
          </Paragraph>
        </div>
      </SiteContainer>
    </footer>
  )
}
