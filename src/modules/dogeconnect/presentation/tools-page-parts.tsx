import { Link } from "@tanstack/react-router"
import * as QRCode from "qrcode"
import * as React from "react"
import { JsonCodeBlock } from "@/components/json-code-block"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Paragraph } from "@/components/ui/paragraph"
import { ValidationDiagnosisPanel } from "@/components/validation-diagnosis-panel"
import { VerdictBadgeEmbed } from "@/components/verdict-badge-embed"
import type {
  EnvelopeValidationPayload,
  QrValidationPayload,
  RelayDebugRecordView,
} from "@/modules/dogeconnect/application/contracts"
import { flightRecorderQrSearch } from "./deep-link-builders"
import { validationVerdictTextClass } from "./flight-recorder-page-utils"

export function QrPreviewPanel({ uri }: { uri?: string }) {
  const normalizedUri = (uri ?? "").trim()
  return <QrPreviewPanelContent key={normalizedUri} uri={normalizedUri} />
}

function QrPreviewPanelContent({ uri }: { uri: string }) {
  const [qrPreview, dispatch] = React.useReducer(
    (
      _state: { dataUrl: string; error: string },
      action: { type: "success"; dataUrl: string } | { type: "error"; error: string }
    ) => {
      if (action.type === "success") {
        return { dataUrl: action.dataUrl, error: "" }
      }

      return { dataUrl: "", error: action.error }
    },
    { dataUrl: "", error: "" }
  )
  const [downloadState, setDownloadState] = React.useState<"idle" | "running" | "failed">("idle")
  const { dataUrl: qrDataUrl, error: qrError } = qrPreview

  React.useEffect(() => {
    if (!uri) {
      return
    }

    let canceled = false

    void QRCode.toDataURL(uri, {
      width: 380,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#2b1b00",
        light: "#00000000",
      },
    })
      .then((dataUrl) => {
        if (!canceled) {
          dispatch({ type: "success", dataUrl })
        }
      })
      .catch((error) => {
        if (!canceled) {
          const message = error instanceof Error ? error.message : "Unable to generate QR code."
          dispatch({ type: "error", error: message })
        }
      })

    return () => {
      canceled = true
    }
  }, [uri])

  const downloadQrCard = async () => {
    if (!uri || !qrDataUrl) {
      return
    }

    setDownloadState("running")

    try {
      const brandedDataUrl = await createBrandedQrDownloadImage(uri)
      const link = document.createElement("a")
      link.href = brandedDataUrl
      link.download = `onlydoge-qr-${Date.now().toString(36)}.png`
      link.click()
      setDownloadState("idle")
    } catch {
      setDownloadState("failed")
    }
  }

  if (!uri) {
    return (
      <div className="rounded-2xl border border-border/70 border-dashed bg-muted/25 p-4">
        <Paragraph size="xs">
          Generate or paste a DogeConnect URI to preview its QR code here.
        </Paragraph>
      </div>
    )
  }

  if (qrError) {
    return (
      <div className="rounded-2xl border border-danger-border bg-danger-muted p-4">
        <Paragraph size="xs" color="danger">
          {qrError}
        </Paragraph>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Paragraph size="xs-medium" className="uppercase tracking-(--tracking-label)">
          Live QR Preview
        </Paragraph>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void downloadQrCard()
          }}
          disabled={!qrDataUrl || downloadState === "running"}
        >
          <Button.Text>
            {downloadState === "running" ? "Rendering..." : "Download Branded QR"}
          </Button.Text>
        </Button>
      </div>
      <div className="flex justify-center rounded-2xl border border-border/70 bg-background/80 p-4 shadow-[0_1px_0_oklch(1_0_0/0.55)_inset]">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR code preview for current URI"
            width={256}
            height={256}
            className="aspect-square w-full max-w-56 rounded-2xl bg-white object-contain p-2 outline-1 outline-black/10 -outline-offset-1"
          />
        ) : null}
      </div>
      {downloadState === "failed" ? (
        <Paragraph size="xs" color="danger">
          Could not create download image in this environment.
        </Paragraph>
      ) : null}
    </div>
  )
}

export function ValidationResultView({
  result,
  error,
  traceUri,
  showEnvelopeToolsLink = false,
}: {
  result: QrValidationPayload | EnvelopeValidationPayload | undefined
  error?: string
  traceUri?: string
  showEnvelopeToolsLink?: boolean
}) {
  if (error) {
    return (
      <Paragraph size="sm" color="danger">
        {error}
      </Paragraph>
    )
  }

  if (!result) {
    return null
  }

  const verdict = result.verdict

  return (
    <div className="min-w-0 space-y-3 rounded-2xl border border-border/70 bg-muted/25 p-4">
      <Paragraph size="sm" color="foreground">
        Result:{" "}
        <Paragraph
          as="span"
          size="inherit"
          color="inherit"
          className={validationVerdictTextClass(verdict)}
        >
          {verdict}
        </Paragraph>
      </Paragraph>
      <ValidationDiagnosisPanel result={result} />
      <ValidationResultVerdictBadge verdict={verdict} />
      <ValidationResultChecks checks={result.checks ?? []} />
      <ValidationResultErrors errors={result.errors ?? []} />
      {"parsed" in result && result.parsed ? (
        <JsonCodeBlock filename="result.json" value={JSON.stringify(result.parsed, null, 2)} />
      ) : null}
      <ValidationResultLinks traceUri={traceUri} showEnvelopeToolsLink={showEnvelopeToolsLink} />
    </div>
  )
}

function ValidationResultVerdictBadge({
  verdict,
}: {
  verdict: QrValidationPayload["verdict"] | EnvelopeValidationPayload["verdict"]
}) {
  if (verdict !== "valid" && verdict !== "invalid" && verdict !== "inconclusive") {
    return null
  }
  return <VerdictBadgeEmbed verdict={verdict} />
}

function ValidationResultChecks({ checks }: { checks: QrValidationPayload["checks"] }) {
  if (checks.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      {checks.map((check) => (
        <Paragraph key={check.name} size="xs">
          <Paragraph
            as="span"
            size="inherit"
            color="inherit"
            className={check.passed ? "text-success-foreground" : "text-danger-foreground"}
          >
            {check.passed ? "PASS" : "FAIL"}
          </Paragraph>{" "}
          {check.name}: {check.details}
        </Paragraph>
      ))}
    </div>
  )
}

function ValidationResultErrors({
  errors,
}: {
  errors: NonNullable<QrValidationPayload["errors"]>
}) {
  if (errors.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-danger-border bg-danger-muted p-3">
      {errors.map((issue) => (
        <Paragraph key={`${issue.field}:${issue.message}`} size="xs" color="danger">
          {issue.field}: {issue.message}
        </Paragraph>
      ))}
    </div>
  )
}

function ValidationResultLinks({
  traceUri,
  showEnvelopeToolsLink,
}: {
  traceUri?: string
  showEnvelopeToolsLink: boolean
}) {
  const trimmedTraceUri = traceUri?.trim()
  if (!trimmedTraceUri && !showEnvelopeToolsLink) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {trimmedTraceUri ? (
        <Link
          to="/flight-recorder"
          search={flightRecorderQrSearch(trimmedTraceUri)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Paragraph as="span" size="sm-medium" color="inherit">
            Trace in Flight Recorder
          </Paragraph>
        </Link>
      ) : null}
      {showEnvelopeToolsLink ? (
        <Link
          to="/tools"
          hash="envelope-validator"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Paragraph as="span" size="sm-medium" color="inherit">
            Open Envelope Validator
          </Paragraph>
        </Link>
      ) : null}
    </div>
  )
}

const createBrandedQrDownloadImage = async (uri: string): Promise<string> => {
  const width = 1200
  const height = 1560
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Canvas context unavailable")
  }

  context.fillStyle = "#F4D93C"
  context.fillRect(0, 0, width, height)

  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready
  }

  const brandIcon = await loadImage("/favicon.svg")
  context.drawImage(brandIcon, 86, 70, 150, 150)

  const titleText = "OnlyDoge DogeConnect Debugger"
  const titleX = 260
  const titleMaxWidth = width - titleX - 70
  const titleFontFamily = "'DogeSans', 'Figtree', sans-serif"
  const titleFontSize = fitFontSizeToWidth(
    context,
    titleText,
    titleMaxWidth,
    70,
    46,
    "700",
    titleFontFamily
  )

  context.fillStyle = "#101010"
  context.font = `700 ${titleFontSize}px ${titleFontFamily}`
  context.fillText(titleText, titleX, 150)
  context.fillStyle = "#5A5F6D"
  context.font = "600 58px 'Figtree', 'Segoe UI', sans-serif"
  context.fillText("by EasyDoge", 260, 226)

  const qrContainerX = 96
  const qrContainerY = 300
  const qrContainerSize = width - qrContainerX * 2
  drawRoundedRectPath(context, qrContainerX, qrContainerY, qrContainerSize, qrContainerSize, 30)
  context.fillStyle = "rgba(0, 0, 0, 0.14)"
  context.fill()
  drawRoundedRectPath(
    context,
    qrContainerX,
    qrContainerY - 14,
    qrContainerSize,
    qrContainerSize,
    30
  )
  context.fillStyle = "#FFFFFF"
  context.fill()

  drawRoundedRectPath(
    context,
    qrContainerX + 28,
    qrContainerY + 14,
    qrContainerSize - 56,
    qrContainerSize - 56,
    22
  )
  context.fillStyle = "#FFFFFF"
  context.fill()

  const qrDataUrl = await QRCode.toDataURL(uri, {
    width: 1500,
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#050505",
      light: "#ffffffff",
    },
  })

  const qrImage = await loadImage(qrDataUrl)
  const qrPadding = 44
  const qrSize = qrContainerSize - qrPadding * 2
  context.imageSmoothingEnabled = false
  context.drawImage(qrImage, qrContainerX + qrPadding, qrContainerY + qrPadding, qrSize, qrSize)
  context.imageSmoothingEnabled = true

  return canvas.toDataURL("image/png")
}

const fitFontSizeToWidth = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight: string,
  family: string
): number => {
  let size = startSize
  while (size > minSize) {
    context.font = `${weight} ${size}px ${family}`
    if (context.measureText(text).width <= maxWidth) {
      return size
    }
    size -= 1
  }

  return minSize
}

const drawRoundedRectPath = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

const loadImage = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${source}`))
    image.src = source
  })

export function RelayRecordsTable({ records }: { records: RelayDebugRecordView[] }) {
  if (!records.length) {
    return (
      <Paragraph size="sm" className="rounded-lg border border-border bg-muted/25 p-4">
        No relay scenarios registered yet.
      </Paragraph>
    )
  }

  return (
    <div className="-mx-4 -my-2 overflow-x-auto whitespace-nowrap sm:-mx-6">
      <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6">
        <table className="w-full min-w-full text-left">
          <caption className="sr-only">Registered relay scenarios</caption>
          <thead>
            <tr>
              <th scope="col" className="whitespace-nowrap px-3 py-2">
                <Paragraph as="span" size="xs-medium">
                  ID
                </Paragraph>
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2">
                <Paragraph as="span" size="xs-medium">
                  Scenario
                </Paragraph>
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2">
                <Paragraph as="span" size="xs-medium">
                  Status
                </Paragraph>
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2">
                <Paragraph as="span" size="xs-medium">
                  Txid
                </Paragraph>
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2">
                <Paragraph as="span" size="xs-medium">
                  Updated
                </Paragraph>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-border/60 border-t">
                <td className="px-3 py-2">
                  <Paragraph as="span" size="xs" color="foreground">
                    {record.id}
                  </Paragraph>
                </td>
                <td className="px-3 py-2">
                  <Paragraph as="span" size="xs" color="foreground">
                    {record.scenario}
                  </Paragraph>
                </td>
                <td className="px-3 py-2">
                  <Paragraph as="span" size="xs" color="foreground">
                    {record.status}
                  </Paragraph>
                </td>
                <td className="max-w-40 truncate px-3 py-2">
                  <Paragraph as="span" size="xs" color="foreground">
                    {record.txid || "—"}
                  </Paragraph>
                </td>
                <td className="px-3 py-2">
                  <Paragraph as="span" size="xs" color="foreground">
                    {record.updatedAt}
                  </Paragraph>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ApiResponseView({
  label,
  response,
}: {
  label: string
  response:
    | {
        ok: boolean
        status: number
        body: unknown
      }
    | undefined
}) {
  if (!response) {
    return null
  }

  return (
    <div className="min-w-0 space-y-1.5">
      <Paragraph size="xs-medium" className="uppercase tracking-(--tracking-label)">
        {label} ({response.status})
      </Paragraph>
      <JsonCodeBlock
        filename={`${label.toLowerCase().replaceAll(" ", "-")}.json`}
        value={JSON.stringify(response.body, null, 2)}
      />
    </div>
  )
}
