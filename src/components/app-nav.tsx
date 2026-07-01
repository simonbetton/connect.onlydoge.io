"use client"

import { Link } from "@tanstack/react-router"
import * as React from "react"
import { ExternalLinkIcon } from "@/components/external-link-icon"
import { GitHubMarkIcon } from "@/components/github-mark-icon"
import { useDiagnosisNavigation } from "@/components/global-paste-diagnose"
import { buttonVariants } from "@/components/ui/button-variants"
import { Paragraph } from "@/components/ui/paragraph"
import { debuggerApiHref, debuggerApiLabel } from "@/lib/app-links"
import { cn } from "@/lib/utils"
import { AppCommandPalette, useCommandPaletteToggle } from "./app-command-palette"
import { appCommandItems } from "./app-command-palette-items"
import { SiteContainer } from "./site-container"

const repositoryUrl = "https://github.com/simonbetton/connect.onlydoge.io"

const navLinks = [
  { to: "/" as const, label: "Overview" },
  { to: "/protocol" as const, label: "Protocol" },
  { to: "/tools" as const, label: "Tools" },
  { to: "/flight-recorder" as const, label: "Flight Recorder" },
] as const

export function AppNav() {
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const { validateClipboard } = useDiagnosisNavigation()

  const commandItems = React.useMemo(
    (): typeof appCommandItems => [
      {
        id: "validate-clipboard",
        label: "Validate clipboard",
        hint: "Paste URI or envelope JSON",
        action: async () => {
          const handled = await validateClipboard()
          if (!handled) {
            window.alert("Clipboard does not contain a Dogecoin URI or payment envelope JSON.")
          }
        },
      },
      ...appCommandItems,
    ],
    [validateClipboard]
  )

  useCommandPaletteToggle(setPaletteOpen)

  return (
    <>
      <header className="sticky top-0 z-20 border-border/60 border-b bg-background/82 backdrop-blur-xl supports-backdrop-filter:bg-background/72">
        <SiteContainer className="flex items-center gap-3 py-3">
          <Link
            to="/"
            aria-label="Homepage"
            className="flex min-w-0 shrink-0 items-center gap-2 rounded-md pr-1 transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97] motion-reduce:active:scale-100"
            onClick={() => setMobileOpen(false)}
          >
            <img src="/favicon.svg" alt="" className="size-8 shrink-0" />
            <Paragraph
              as="span"
              size="sm-medium"
              color="foreground"
              font="display"
              className="hidden truncate font-semibold sm:inline"
            >
              DogeConnect Debugger
            </Paragraph>
          </Link>

          <nav className="mx-auto hidden min-w-0 items-center justify-center gap-1 rounded-full border border-border/70 bg-card/55 p-1 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset] lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="whitespace-nowrap rounded-full px-3 py-1.5 transition-[color,background-color,border-color,transform] duration-200 ease-out hover:bg-muted/55 hover:text-foreground active:scale-[0.98] motion-reduce:active:scale-100"
                activeProps={{ className: "bg-muted text-foreground" }}
              >
                <Paragraph as="span" size="sm">
                  {link.label}
                </Paragraph>
              </Link>
            ))}
            <a
              href={debuggerApiHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 transition-[color,background-color,border-color,transform] duration-200 ease-out hover:bg-muted/55 hover:text-foreground active:scale-[0.98] motion-reduce:active:scale-100"
            >
              <Paragraph as="span" size="sm">
                {debuggerApiLabel}
              </Paragraph>
              <ExternalLinkIcon className="size-3 opacity-80" />
            </a>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="hidden h-8 items-center gap-1.5 rounded-full border border-border/80 bg-card/55 px-3 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset] transition-[border-color,box-shadow,color,transform] duration-200 ease-out hover:border-selected-border hover:text-foreground active:scale-[0.97] motion-reduce:active:scale-100 md:inline-flex"
              aria-label="Search pages and sections (⌘K)"
              onClick={() => setPaletteOpen(true)}
            >
              <Paragraph
                as="span"
                size="xs-medium"
                color="inherit"
                className="text-muted-foreground"
              >
                Search
              </Paragraph>
              <span className="inline-flex gap-0.5">
                <Paragraph
                  as="kbd"
                  size="micro"
                  font="mono"
                  className="rounded border border-border bg-background px-1 font-normal"
                >
                  ⌘
                </Paragraph>
                <Paragraph
                  as="kbd"
                  size="micro"
                  font="mono"
                  className="rounded border border-border bg-background px-1 font-normal"
                >
                  K
                </Paragraph>
              </span>
            </button>

            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card/65 text-foreground transition-[border-color,background-color,transform] duration-200 ease-out hover:bg-muted/50 active:scale-[0.97] motion-reduce:active:scale-100 lg:hidden"
              aria-label="Search"
              onClick={() => setPaletteOpen(true)}
            >
              <Paragraph as="span" size="sm" color="foreground" aria-hidden>
                /
              </Paragraph>
            </button>

            <a
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className="hidden size-8 items-center justify-center rounded-md text-muted-foreground transition-[color,transform] duration-200 ease-out hover:text-foreground active:scale-[0.97] motion-reduce:active:scale-100 sm:inline-flex"
            >
              <GitHubMarkIcon className="size-4" />
            </a>

            <Link
              to="/tools"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden shrink-0 sm:inline-flex"
              )}
            >
              <Paragraph as="span" size="sm-medium" color="inherit">
                Get Started
              </Paragraph>
            </Link>

            <button
              type="button"
              className="inline-flex shrink-0 rounded-full border border-border/80 bg-card/55 px-3 py-1.5 transition-[border-color,background-color,transform] duration-200 ease-out hover:bg-muted/50 active:scale-[0.97] motion-reduce:active:scale-100 lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setMobileOpen((open) => !open)}
            >
              <Paragraph as="span" size="sm-medium" color="inherit">
                {mobileOpen ? "Close" : "Menu"}
              </Paragraph>
            </button>
          </div>
        </SiteContainer>

        {mobileOpen ? (
          <div
            id="mobile-nav-drawer"
            className="animate-mobile-nav-enter border-border/60 border-t bg-background/92 px-4 py-3 shadow-xl backdrop-blur-xl motion-reduce:animate-none lg:hidden"
          >
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-2xl px-3 py-2 transition-[color,background-color,border-color,transform] duration-200 ease-out hover:bg-muted/55 hover:text-foreground active:scale-[0.98] motion-reduce:active:scale-100"
                  activeProps={{ className: "bg-muted text-foreground" }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Paragraph as="span" size="sm">
                    {link.label}
                  </Paragraph>
                </Link>
              ))}
              <a
                href={debuggerApiHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 transition-[color,background-color,border-color,transform] duration-200 ease-out hover:bg-muted/55 hover:text-foreground active:scale-[0.98] motion-reduce:active:scale-100"
                onClick={() => setMobileOpen(false)}
              >
                <Paragraph as="span" size="sm">
                  {debuggerApiLabel}
                </Paragraph>
                <ExternalLinkIcon className="size-3 opacity-80" />
              </a>
              <a
                href={repositoryUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 transition-[color,background-color,border-color,transform] duration-200 ease-out hover:bg-muted/55 hover:text-foreground active:scale-[0.98] motion-reduce:active:scale-100"
                onClick={() => setMobileOpen(false)}
              >
                <GitHubMarkIcon className="size-4" />
                <Paragraph as="span" size="sm">
                  GitHub
                </Paragraph>
                <ExternalLinkIcon />
              </a>
              <Link
                to="/tools"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 w-full")}
                onClick={() => setMobileOpen(false)}
              >
                <Paragraph as="span" size="sm-medium" color="inherit">
                  Get Started
                </Paragraph>
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <AppCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={commandItems} />
    </>
  )
}
