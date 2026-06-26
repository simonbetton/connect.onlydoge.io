import { PageJumpNav } from "@/components/page-jump-nav"
import {
  EnvelopeValidatorCard,
  MockQrFixtureCard,
  QrValidatorCard,
  RelayRegistrationCard,
  RelayTesterCard,
  ToolsPageHero,
  ToolsQuickStartSection,
} from "./tools-page-sections"
import { useToolsPageController } from "./use-tools-page-controller"

const sectionNavItems = [
  { href: "#mock-fixture", label: "Mock QR" },
  { href: "#qr-validator", label: "QR Validator" },
  { href: "#envelope-validator", label: "Envelope" },
  { href: "#relay-registration", label: "Relay Setup" },
  { href: "#relay-tester", label: "Relay Tester" },
] as const

export function ToolsPage() {
  const controller = useToolsPageController()

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <ToolsPageHero />
      <ToolsQuickStartSection />
      <PageJumpNav items={[...sectionNavItems]} ariaLabel="Tools sections" />

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

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
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

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
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
    </div>
  )
}
