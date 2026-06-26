import { Link } from "@tanstack/react-router"
import * as QRCode from "qrcode"
import * as React from "react"
import { JsonCodeBlock } from "@/components/json-code-block"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import type {
  EnvelopeValidationPayload,
  QrValidationPayload,
  RelayDebugRecordView,
} from "@/modules/dogeconnect/application/contracts"
import { flightRecorderQrSearch } from "./deep-link-builders"

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
      <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
        <p className="text-muted-foreground text-xs">
          Enter a DogeConnect URI above to generate a live QR preview.
        </p>
      </div>
    )
  }

  if (qrError) {
    return (
      <div className="rounded-2xl border border-danger-border bg-danger-muted p-4">
        <p className="text-danger-foreground text-xs">{qrError}</p>
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-muted-foreground text-xs uppercase">Live QR Preview</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void downloadQrCard()
          }}
          disabled={!qrDataUrl || downloadState === "running"}
        >
          {downloadState === "running" ? "Rendering..." : "Download Branded QR"}
        </Button>
      </div>
      <div className="rounded-xl border border-border/60 bg-linear-to-br from-amber-100/40 to-orange-100/30 p-4">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR code preview for current URI"
            className="mx-auto size-56 rounded-xl border border-border/60 bg-white p-2 sm:size-64"
          />
        ) : null}
      </div>
      {downloadState === "failed" ? (
        <p className="text-danger-foreground text-xs">
          Could not create download image in this environment.
        </p>
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
    return <p className="text-danger-foreground text-sm">{error}</p>
  }

  if (!result) {
    return null
  }

  const verdict = result.verdict
  const badgeVariant =
    verdict === "valid" ? "success" : verdict === "inconclusive" ? "warning" : "danger"

  return (
    <div className="min-w-0 space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">Result</span>
        <Badge variant={badgeVariant}>{verdict}</Badge>
      </div>
      <div className="space-y-1">
        {(result.checks ?? []).map((check) => (
          <p key={check.name} className="text-muted-foreground text-xs">
            <span className={check.passed ? "text-success-foreground" : "text-danger-foreground"}>
              {check.passed ? "PASS" : "FAIL"}
            </span>{" "}
            {check.name}: {check.details}
          </p>
        ))}
      </div>
      {(result.errors ?? []).length > 0 ? (
        <div className="rounded-xl border border-danger-border bg-danger-muted p-3">
          {(result.errors ?? []).map((issue) => (
            <p key={`${issue.field}:${issue.message}`} className="text-danger-foreground text-xs">
              {issue.field}: {issue.message}
            </p>
          ))}
        </div>
      ) : null}
      {"parsed" in result && result.parsed ? (
        <JsonCodeBlock filename="result.json" value={JSON.stringify(result.parsed, null, 2)} />
      ) : null}
      {traceUri?.trim() || showEnvelopeToolsLink ? (
        <div className="flex flex-wrap gap-2">
          {traceUri?.trim() ? (
            <Link
              to="/flight-recorder"
              search={flightRecorderQrSearch(traceUri.trim())}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Trace in Flight Recorder
            </Link>
          ) : null}
          {showEnvelopeToolsLink ? (
            <Link
              to="/tools"
              hash="envelope-validator"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open Envelope Validator
            </Link>
          ) : null}
        </div>
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
      <p className="rounded-2xl border border-border/60 bg-background/50 p-3 text-muted-foreground text-sm">
        No relay scenarios registered yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60">
      <table className="min-w-full text-left text-xs">
        <caption className="sr-only">Registered relay scenarios</caption>
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              ID
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Scenario
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Status
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Txid
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-border/60 border-t">
              <td className="px-3 py-2">{record.id}</td>
              <td className="px-3 py-2">{record.scenario}</td>
              <td className="px-3 py-2">{record.status}</td>
              <td className="max-w-40 truncate px-3 py-2">{record.txid || "—"}</td>
              <td className="px-3 py-2">{record.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <p className="font-medium text-muted-foreground text-xs uppercase">
        {label} ({response.status})
      </p>
      <JsonCodeBlock
        filename={`${label.toLowerCase().replaceAll(" ", "-")}.json`}
        value={JSON.stringify(response.body, null, 2)}
      />
    </div>
  )
}
