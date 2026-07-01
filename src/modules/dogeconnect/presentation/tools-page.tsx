import { Link } from "@tanstack/react-router"
import { ExternalLinkIcon } from "@/components/external-link-icon"
import type { PageJumpNavItem } from "@/components/page-jump-nav"
import { buttonVariants } from "@/components/ui/button-variants"
import { Paragraph } from "@/components/ui/paragraph"
import {
  WorkbenchHeader,
  WorkbenchPageLayout,
  WorkbenchSection,
  WorkbenchShell,
} from "@/components/workbench-shell"
import { debuggerApiHref, debuggerApiLabel } from "@/lib/app-links"
import {
  EnvelopeValidatorCard,
  MockQrFixtureCard,
  QrValidatorCard,
  RelayRegistrationCard,
  RelayTesterCard,
} from "./tools-page-sections"
import { useToolsPageController } from "./use-tools-page-controller"

const sectionNavItems: PageJumpNavItem[] = [
  { href: "#mock-fixture", label: "Mock URI" },
  { href: "#validators", label: "Validators" },
  { href: "#relay-tools", label: "Relay" },
]

function ToolsPipelineMeta() {
  return (
    <Paragraph size="xs" className="rounded-full border border-border/70 bg-muted/45 px-3 py-1">
      <span>fixture</span>
      <span aria-hidden> → </span>
      <span>validate</span>
      <span aria-hidden> → </span>
      <span>relay</span>
    </Paragraph>
  )
}

export function ToolsPage() {
  const controller = useToolsPageController()

  return (
    <WorkbenchShell
      header={
        <WorkbenchHeader
          title="Tools Console"
          description="A focused lab for creating fixtures, validating payloads, previewing QR codes, and exercising the simulator relay without building a full trace."
          aside={<ToolsPipelineMeta />}
          actions={
            <>
              <Link
                to="/flight-recorder"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Paragraph as="span" size="sm-medium" color="inherit">
                  Flight Recorder
                </Paragraph>
              </Link>
              <a
                href={debuggerApiHref}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "gap-1.5",
                })}
              >
                <Paragraph as="span" size="sm-medium" color="inherit">
                  {debuggerApiLabel}
                </Paragraph>
                <ExternalLinkIcon className="size-3 opacity-80" />
              </a>
            </>
          }
        />
      }
    >
      <WorkbenchPageLayout sectionNavItems={sectionNavItems} sectionNavAriaLabel="Tools sections">
        <WorkbenchSection
          id="mock-fixture"
          title="Generate the fixture"
          description="Start with a known-good payment request or paste a live URI to preview it."
        >
          <MockQrFixtureCard
            mockQrForm={controller.mockQrForm}
            generateMockQrMutation={controller.generateMockQrMutation}
            validateQrMutation={controller.validateQrMutation}
            mockCopyState={controller.mockCopyState}
            onUpdateSearch={controller.updateSearch}
            onCopyMockUri={controller.copyMockUri}
            onLoadMockIntoQrValidator={controller.loadMockIntoQrValidator}
            onValidateGeneratedMockUri={() => {
              void controller.validateGeneratedMockUri()
            }}
          />
        </WorkbenchSection>

        <WorkbenchSection
          id="validators"
          title="Prove the payload"
          description="Check URI structure, relay key hash alignment, envelope schema, and Schnorr signatures."
        >
          <div className="grid min-w-0 gap-(--space-md) xl:grid-cols-2 xl:gap-(--space-lg)">
            <QrValidatorCard
              qrForm={controller.qrForm}
              validateQrMutation={controller.validateQrMutation}
              qrPreviewUri={controller.qrPreviewUri}
              onUpdateSearch={controller.updateSearch}
              onSetQrPreviewUri={controller.setQrPreviewUri}
            />
            <EnvelopeValidatorCard
              envelopeForm={controller.envelopeForm}
              validateEnvelopeMutation={controller.validateEnvelopeMutation}
              envelopeInputError={controller.envelopeInputError}
              onUpdateSearch={controller.updateSearch}
            />
          </div>
        </WorkbenchSection>

        <WorkbenchSection
          id="relay-tools"
          title="Exercise the relay"
          description="Register simulator scenarios, call pay and status endpoints, and inspect contract responses."
        >
          <div className="grid min-w-0 gap-(--space-md) xl:grid-cols-2 xl:gap-(--space-lg)">
            <RelayRegistrationCard
              registerForm={controller.registerForm}
              registerScenarioMutation={controller.registerScenarioMutation}
              resetRelayMutation={controller.resetRelayMutation}
              relayRecords={controller.relayRecords}
              onUpdateSearch={controller.updateSearch}
              onRefetchRelayRecords={() => {
                void controller.refetchRelayRecords()
              }}
            />
            <RelayTesterCard
              relayPayForm={controller.relayPayForm}
              relayStatusForm={controller.relayStatusForm}
              relayPayMutation={controller.relayPayMutation}
              relayStatusMutation={controller.relayStatusMutation}
              onUpdateSearch={controller.updateSearch}
            />
          </div>
        </WorkbenchSection>
      </WorkbenchPageLayout>
    </WorkbenchShell>
  )
}
