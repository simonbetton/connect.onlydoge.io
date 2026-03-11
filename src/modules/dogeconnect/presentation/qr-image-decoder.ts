import jsQR from "jsqr"

type RgbaImageData = {
  data: Uint8ClampedArray
  width: number
  height: number
}

const MAX_DECODE_DIMENSION = 2048

export const decodeQrTextFromRgba = ({ data, width, height }: RgbaImageData): string | null => {
  const result = jsQR(data, width, height, {
    inversionAttempts: "attemptBoth",
  })

  return result?.data ?? null
}

export const decodeQrTextFromImageFile = async (file: File): Promise<string> => {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("Local QR decoding is only available in the browser.")
  }

  const { image, revokeObjectUrl } = await loadLocalImage(file)

  try {
    const size = fitWithinBounds(image.naturalWidth, image.naturalHeight, MAX_DECODE_DIMENSION)
    const canvas = document.createElement("canvas")
    canvas.width = size.width
    canvas.height = size.height

    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) {
      throw new Error("This browser could not open a local canvas for QR decoding.")
    }

    context.drawImage(image, 0, 0, size.width, size.height)

    const decoded = decodeQrTextFromRgba(context.getImageData(0, 0, size.width, size.height))
    if (!decoded) {
      throw new Error("No QR code was found in the selected image.")
    }

    return decoded
  } finally {
    revokeObjectUrl()
  }
}

const loadLocalImage = async (
  file: File
): Promise<{ image: HTMLImageElement; revokeObjectUrl: () => void }> => {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()

      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error("The selected file could not be read as an image."))
      element.src = objectUrl
    })

    return {
      image,
      revokeObjectUrl: () => {
        URL.revokeObjectURL(objectUrl)
      },
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

const fitWithinBounds = (width: number, height: number, maxDimension: number) => {
  const longestSide = Math.max(width, height)

  if (longestSide <= maxDimension) {
    return { width, height }
  }

  const scale = maxDimension / longestSide

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
