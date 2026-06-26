import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { FlightRecorderFaultPreset } from "@/modules/dogeconnect/application/flight-recorder-contracts"
import { READ_SAFE_FAULTS, SIMULATOR_FAULTS } from "./flight-recorder-fault-presets"
import { FaultSelector, LiveModeNotice, TargetModeCard } from "./flight-recorder-page-parts"
import type { FlightRecorderSearchState } from "./flight-recorder-search"

export function SessionBuilderTargetSection({
  search,
  ignoredLiveFaultCount,
  onSetTargetMode,
}: {
  search: FlightRecorderSearchState
  ignoredLiveFaultCount: number
  onSetTargetMode: (targetMode: FlightRecorderSearchState["targetMode"]) => void
}) {
  return (
    <>
      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-xs uppercase">Target Mode</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TargetModeCard
            active={search.targetMode === "simulator"}
            title="Simulator"
            description="Safe local relay responses with deterministic execution presets."
            onClick={() => onSetTargetMode("simulator")}
          />
          <TargetModeCard
            active={search.targetMode === "live"}
            title="Live target"
            description="Reads the resolved live relay. Outbound pay writes stay blocked until you arm them."
            onClick={() => onSetTargetMode("live")}
          />
        </div>
      </div>

      {search.targetMode === "live" ? (
        <LiveModeNotice ignoredFaultCount={ignoredLiveFaultCount} />
      ) : null}
    </>
  )
}

export function SessionBuilderFaultSection({
  search,
  onUpdateSearch,
  onToggleFault,
}: {
  search: FlightRecorderSearchState
  onUpdateSearch: (patch: Partial<FlightRecorderSearchState>) => void
  onToggleFault: (fault: FlightRecorderFaultPreset) => void
}) {
  return (
    <>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={search.includeInitialStatus}
          onChange={(event) => onUpdateSearch({ includeInitialStatus: event.target.checked })}
          className="size-4 rounded border-border accent-amber-500"
        />
        Include an initial status read after session build
      </label>

      <FaultSelector
        title="Read-safe fault presets"
        faults={READ_SAFE_FAULTS}
        selectedFaults={search.selectedFaults}
        onToggle={onToggleFault}
      />
      <FaultSelector
        title="Simulator execution presets"
        faults={SIMULATOR_FAULTS}
        selectedFaults={search.selectedFaults}
        onToggle={onToggleFault}
        disabled={search.targetMode === "live"}
        disabledHint="Ignored while live target mode is selected. Switch back to simulator to use these presets."
      />
    </>
  )
}

const SOURCE_TABS = ["qr", "mock", "import"] as const

export function SourceTabButtons({
  activeTab,
  onSetSourceTab,
}: {
  activeTab: FlightRecorderSearchState["sourceTab"]
  onSetSourceTab: (sourceTab: FlightRecorderSearchState["sourceTab"]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SOURCE_TABS.map((tab) => (
        <Button
          key={tab}
          type="button"
          variant={activeTab === tab ? "default" : "outline"}
          onClick={() => onSetSourceTab(tab)}
        >
          {tab === "qr" ? "QR URI" : tab === "mock" ? "Mock Fixture" : "Import JSON"}
        </Button>
      ))}
    </div>
  )
}

function QrSourcePanel({
  search,
  qrImageName,
  qrImageError,
  qrImageDecodePending,
  onUpdateSearch,
  onLoadQrImage,
}: {
  search: FlightRecorderSearchState
  qrImageName: string
  qrImageError: string
  qrImageDecodePending: boolean
  onUpdateSearch: (patch: Partial<FlightRecorderSearchState>) => void
  onLoadQrImage: (file: File | null) => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="font-medium text-muted-foreground text-xs uppercase">Dogecoin URI</p>
        <Textarea
          value={search.qrUri}
          onChange={(event) => onUpdateSearch({ qrUri: event.target.value })}
          rows={5}
          placeholder="dogecoin:DPD7...?amount=12.25&dc=example.com/dc/id&h=..."
        />
      </div>
      <div className="space-y-3 rounded-2xl border border-border/70 border-dashed bg-background/50 p-4">
        <div className="space-y-1">
          <p className="font-medium text-muted-foreground text-xs uppercase">QR Image Upload</p>
          <p className="text-muted-foreground text-xs">
            Pick a QR image to decode it locally in your browser. Nothing is sent to the server.
          </p>
        </div>
        <Input
          type="file"
          accept="image/*"
          disabled={qrImageDecodePending}
          onChange={(event) => {
            const input = event.currentTarget
            void onLoadQrImage(input.files?.[0] ?? null)
            input.value = ""
          }}
        />
        {qrImageName ? (
          <p className="text-muted-foreground text-xs">
            {qrImageDecodePending
              ? `Decoding ${qrImageName} locally...`
              : `Last image: ${qrImageName}`}
          </p>
        ) : null}
        {qrImageError ? <p className="text-rose-700 text-sm">{qrImageError}</p> : null}
      </div>
    </div>
  )
}

function MockSourcePanel({
  search,
  onUpdateSearch,
}: {
  search: FlightRecorderSearchState
  onUpdateSearch: (patch: Partial<FlightRecorderSearchState>) => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-medium text-muted-foreground text-xs uppercase">Mock Payment ID</p>
      <Input
        value={search.mockPaymentId}
        onChange={(event) => onUpdateSearch({ mockPaymentId: event.target.value })}
        placeholder="Optional stable payment ID"
      />
    </div>
  )
}

function ImportSourcePanel({
  importJson,
  importError,
  onSetImportJson,
  onLoadImportFile,
  onImportSession,
}: {
  importJson: string
  importError: string
  onSetImportJson: (value: string) => void
  onLoadImportFile: (file: File | null) => void
  onImportSession: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="font-medium text-muted-foreground text-xs uppercase">Session JSON</p>
        <Textarea
          value={importJson}
          onChange={(event) => onSetImportJson(event.target.value)}
          rows={8}
          placeholder='{"version":"flight-recorder/v1", ...}'
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            void onLoadImportFile(event.target.files?.[0] ?? null)
          }}
        />
        <Button type="button" onClick={onImportSession}>
          Import Session
        </Button>
      </div>
      {importError ? <p className="text-rose-700 text-sm">{importError}</p> : null}
    </div>
  )
}

export function SessionBuilderSourcePanel({
  sourceTab,
  search,
  importJson,
  importError,
  qrImageName,
  qrImageError,
  qrImageDecodePending,
  onUpdateSearch,
  onSetImportJson,
  onLoadQrImage,
  onLoadImportFile,
  onImportSession,
}: {
  sourceTab: FlightRecorderSearchState["sourceTab"]
  search: FlightRecorderSearchState
  importJson: string
  importError: string
  qrImageName: string
  qrImageError: string
  qrImageDecodePending: boolean
  onUpdateSearch: (patch: Partial<FlightRecorderSearchState>) => void
  onSetImportJson: (value: string) => void
  onLoadQrImage: (file: File | null) => void
  onLoadImportFile: (file: File | null) => void
  onImportSession: () => void
}) {
  if (sourceTab === "qr") {
    return (
      <QrSourcePanel
        search={search}
        qrImageName={qrImageName}
        qrImageError={qrImageError}
        qrImageDecodePending={qrImageDecodePending}
        onUpdateSearch={onUpdateSearch}
        onLoadQrImage={onLoadQrImage}
      />
    )
  }

  if (sourceTab === "mock") {
    return <MockSourcePanel search={search} onUpdateSearch={onUpdateSearch} />
  }

  return (
    <ImportSourcePanel
      importJson={importJson}
      importError={importError}
      onSetImportJson={onSetImportJson}
      onLoadImportFile={onLoadImportFile}
      onImportSession={onImportSession}
    />
  )
}

export function BuilderActionButtons({
  sourceTab,
  buildPending,
  onBuildSession,
  onResetBuilder,
}: {
  sourceTab: FlightRecorderSearchState["sourceTab"]
  buildPending: boolean
  onBuildSession: () => void
  onResetBuilder: () => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sourceTab === "import" ? null : (
        <Button type="button" onClick={onBuildSession} disabled={buildPending}>
          {buildPending ? "Building..." : "Build Session"}
        </Button>
      )}
      <Button type="button" variant="outline" onClick={onResetBuilder}>
        Reset Builder
      </Button>
    </div>
  )
}
