const HEX_REGEX = /^[\da-f]+$/i
const BASE64_REGEX = /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{2}==|[A-Za-z\d+/]{3}=)?$/
const BASE64URL_REGEX = /^[A-Za-z\d_-]+$/

const textDecoder = new TextDecoder("utf-8", { fatal: true })
const textEncoder = new TextEncoder()

export const hexToBytesStrict = (value: string): Uint8Array | null => {
  if (value.length === 0 || value.length % 2 !== 0 || !HEX_REGEX.test(value)) {
    return null
  }

  const bytes = new Uint8Array(value.length / 2)
  for (let index = 0; index < value.length; index += 2) {
    const hexPair = value.slice(index, index + 2)
    const parsed = Number.parseInt(hexPair, 16)
    if (Number.isNaN(parsed)) {
      return null
    }
    bytes[index / 2] = parsed
  }

  return bytes
}

export const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")

const bytesFromBinary = (binary: string): Uint8Array => {
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

const binaryFromBytes = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")

export const base64ToBytesStrict = (value: string): Uint8Array | null => {
  if (value.length === 0 || value.length % 4 !== 0 || !BASE64_REGEX.test(value)) {
    return null
  }

  try {
    if (typeof atob === "function") {
      return bytesFromBinary(atob(value))
    }

    if (typeof Buffer !== "undefined") {
      const normalized = Buffer.from(value, "base64").toString("base64")
      if (normalized !== value) {
        return null
      }
      return Uint8Array.from(Buffer.from(value, "base64"))
    }
  } catch {
    return null
  }

  return null
}

export const base64UrlToBytesStrict = (value: string): Uint8Array | null => {
  if (value.length === 0 || !BASE64URL_REGEX.test(value)) {
    return null
  }

  const paddedLength = Math.ceil(value.length / 4) * 4
  const padded = value.padEnd(paddedLength, "=")
  const standard = padded.replaceAll("-", "+").replaceAll("_", "/")
  return base64ToBytesStrict(standard)
}

export const bytesToBase64Url = (value: Uint8Array): string => {
  if (typeof btoa === "function") {
    return btoa(binaryFromBytes(value))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "")
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value).toString("base64url")
  }

  throw new Error("No base64url encoder available in this runtime")
}

export const utf8ToBytes = (value: string): Uint8Array => textEncoder.encode(value)

export const bytesToUtf8 = (value: Uint8Array): string | null => {
  try {
    return textDecoder.decode(value)
  } catch {
    return null
  }
}
