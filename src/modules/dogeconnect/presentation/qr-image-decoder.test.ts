import * as QRCode from "qrcode"
import { describe, expect, test } from "vitest"
import { decodeQrTextFromRgba } from "./qr-image-decoder"

describe("decodeQrTextFromRgba", () => {
  test("reads QR payloads from RGBA image data", () => {
    const payload =
      "dogecoin:DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY?amount=12.25&dc=www.onlydoge.io/dc/pay-123&h=abc123"

    const decoded = decodeQrTextFromRgba(renderQrCode(payload))

    expect(decoded).toBe(payload)
  })
})

const renderQrCode = (
  text: string,
  { moduleSize = 8, margin = 4 }: { moduleSize?: number; margin?: number } = {}
) => {
  const qr = QRCode.create(text, {
    errorCorrectionLevel: "H",
  })
  const qrSize = qr.modules.size
  const imageSize = (qrSize + margin * 2) * moduleSize
  const data = new Uint8ClampedArray(imageSize * imageSize * 4)

  data.fill(255)

  for (let row = 0; row < qrSize; row += 1) {
    for (let column = 0; column < qrSize; column += 1) {
      const isDark = qr.modules.data[row * qrSize + column] === 1
      const color = isDark ? 0 : 255
      const startX = (column + margin) * moduleSize
      const startY = (row + margin) * moduleSize

      for (let y = 0; y < moduleSize; y += 1) {
        for (let x = 0; x < moduleSize; x += 1) {
          const pixelIndex = ((startY + y) * imageSize + (startX + x)) * 4
          data[pixelIndex] = color
          data[pixelIndex + 1] = color
          data[pixelIndex + 2] = color
          data[pixelIndex + 3] = 255
        }
      }
    }
  }

  return {
    data,
    width: imageSize,
    height: imageSize,
  }
}
