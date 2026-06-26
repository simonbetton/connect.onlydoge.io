import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

const MAX_REDIRECTS = 3
const DEFAULT_TIMEOUT_MS = 4_000
const DEFAULT_MAX_BYTES = 262_144

export interface SafeJsonFetchInput {
  url: string
  method: "GET" | "POST"
  body?: unknown
  timeoutMs?: number
  maxBytes?: number
}

export interface SafeJsonFetchResult {
  url: string
  statusCode: number
  body: unknown
}

export const normalizeExternalUrl = (value: string): URL => {
  const trimmed = value.trim()
  const normalized =
    trimmed.startsWith("https://") || trimmed.startsWith("http://") ? trimmed : `https://${trimmed}`

  return new URL(normalized)
}

export const assertPublicTargetUrl = async (input: string | URL): Promise<URL> => {
  const url = typeof input === "string" ? normalizeExternalUrl(input) : new URL(input.toString())

  if (url.protocol !== "https:") {
    throw new Error("Outbound target must use https")
  }

  if (isUnsafeHostName(url.hostname)) {
    throw new Error("Outbound target must be a public hostname")
  }

  if (isIP(url.hostname) !== 0) {
    if (isUnsafeIpAddress(url.hostname)) {
      throw new Error("Outbound target resolves to a private or reserved IP address")
    }
    return url
  }

  const records = await lookup(url.hostname, { all: true })
  if (records.length === 0) {
    throw new Error("Outbound target did not resolve to a public IP address")
  }

  if (records.some((record) => isUnsafeIpAddress(record.address))) {
    throw new Error("Outbound target resolves to a private or reserved IP address")
  }

  return url
}

export const safeFetchJson = async (input: SafeJsonFetchInput): Promise<SafeJsonFetchResult> => {
  let current = await assertPublicTargetUrl(input.url)
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetchWithTimeout(current, input)

    if (isRedirect(response.status)) {
      current = await followRedirect(current, response)
      continue
    }

    const body = await readJsonResponseBody(response, maxBytes)
    return {
      url: current.toString(),
      statusCode: response.status,
      body,
    }
  }

  throw new Error("Too many redirects while fetching outbound target")
}

export const resolveRedirectTarget = async (current: URL, location: string): Promise<URL> => {
  const redirected = new URL(location, current)
  if (redirected.protocol !== "https:") {
    throw new Error("Redirect target must remain on https")
  }

  return assertPublicTargetUrl(redirected)
}

const followRedirect = async (current: URL, response: Response): Promise<URL> => {
  const location = response.headers.get("location")
  if (!location) {
    throw new Error("Redirect response is missing a location header")
  }

  return resolveRedirectTarget(current, location)
}

const readJsonResponseBody = async (response: Response, maxBytes: number): Promise<unknown> => {
  assertContentLengthWithinLimit(response, maxBytes)
  const raw = await response.text()
  assertRawBodyWithinLimit(raw, maxBytes)
  return parseJsonText(raw)
}

const assertContentLengthWithinLimit = (response: Response, maxBytes: number): void => {
  const contentLength = response.headers.get("content-length")
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error(`Response exceeded ${maxBytes} bytes`)
  }
}

const assertRawBodyWithinLimit = (raw: string, maxBytes: number): void => {
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new Error(`Response exceeded ${maxBytes} bytes`)
  }
}

const parseJsonText = (raw: string): unknown => {
  try {
    return raw.length > 0 ? JSON.parse(raw) : null
  } catch {
    throw new Error("Response was not valid JSON")
  }
}

const isUnsafeHostName = (hostname: string): boolean => {
  const normalized = hostname.trim().toLowerCase()
  return (
    normalized === "localhost" || normalized.endsWith(".localhost") || normalized.endsWith(".local")
  )
}

export const isUnsafeIpAddress = (value: string): boolean => {
  const version = isIP(value)
  if (version === 4) {
    return isUnsafeIpv4Address(value)
  }

  if (version === 6) {
    return isUnsafeIpv6Address(value)
  }

  return true
}

const isUnsafeIpv6Address = (value: string): boolean => {
  const normalized = value.toLowerCase()
  const mappedIpv4Address = getMappedIpv4Address(normalized)
  if (mappedIpv4Address) {
    return isUnsafeIpv4Address(mappedIpv4Address)
  }

  return isPrivateIpv6Prefix(normalized)
}

const isPrivateIpv6Prefix = (normalized: string): boolean =>
  normalized === "::1" ||
  normalized.startsWith("fc") ||
  normalized.startsWith("fd") ||
  normalized.startsWith("fe8") ||
  normalized.startsWith("fe9") ||
  normalized.startsWith("fea") ||
  normalized.startsWith("feb")

const getMappedIpv4Address = (value: string): string | null => {
  const prefix = "::ffff:"
  if (!value.startsWith(prefix)) {
    return null
  }

  const embedded = value.slice(prefix.length)
  return isIP(embedded) === 4 ? embedded : null
}

const parseIpv4LeadingOctets = (value: string): [number, number] | null => {
  const octets = value.split(".").map((part) => Number(part))
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return null
  }

  return [octets[0], octets[1]]
}

const UNSAFE_IPV4_RULES: Array<(a: number, b: number) => boolean> = [
  (a) => a === 0,
  (a) => a === 10,
  (a) => a === 127,
  (a, b) => a === 169 && b === 254,
  (a, b) => a === 172 && b >= 16 && b <= 31,
  (a, b) => a === 192 && b === 168,
  (a, b) => a === 100 && b >= 64 && b <= 127,
]

const isUnsafeIpv4OctetPair = (a: number, b: number): boolean =>
  UNSAFE_IPV4_RULES.some((rule) => rule(a, b))

const isUnsafeIpv4Address = (value: string): boolean => {
  const octets = parseIpv4LeadingOctets(value)
  if (!octets) {
    return true
  }

  return isUnsafeIpv4OctetPair(octets[0], octets[1])
}

const fetchWithTimeout = async (current: URL, input: SafeJsonFetchInput): Promise<Response> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    return await fetch(current, {
      method: input.method,
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      headers: {
        Accept: "application/json",
        ...(input.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      credentials: "omit",
      redirect: "manual",
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Outbound request timed out")
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

const isRedirect = (status: number): boolean => status >= 300 && status < 400
