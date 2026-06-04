import { base64ToBytesStrict, hexToBytesStrict } from "../shared/encoding"
import { type ValidationIssue, validationError } from "../shared/validation"

export const ENVELOPE_VERSION = "1.0"

export class ConnectEnvelope {
  private constructor(
    public readonly version: string,
    public readonly payload: string,
    public readonly pubkey: string,
    public readonly signature: string,
    public readonly payloadBytes: Uint8Array | null,
    public readonly pubKeyBytes: Uint8Array | null,
    public readonly signatureBytes: Uint8Array | null
  ) {}

  static parse(value: unknown): { value: ConnectEnvelope | null; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = []

    if (!isRecord(value)) {
      return {
        value: null,
        issues: [validationError("envelope", "must be an object")],
      }
    }

    const version = readString(value, "version", issues)
    const payload = readString(value, "payload", issues)
    const pubkey = readString(value, "pubkey", issues)
    const signature = readString(value, "sig", issues)

    if (version !== ENVELOPE_VERSION) {
      issues.push(validationError("version", `must be "${ENVELOPE_VERSION}"`))
    }

    let payloadBytes: Uint8Array | null = null
    if (!payload) {
      issues.push(validationError("payload", "required"))
    } else {
      payloadBytes = base64ToBytesStrict(payload)
      if (!payloadBytes) {
        issues.push(validationError("payload", "invalid base64"))
      }
    }

    let pubKeyBytes: Uint8Array | null = null
    if (!pubkey) {
      issues.push(validationError("pubkey", "required"))
    } else {
      pubKeyBytes = hexToBytesStrict(pubkey)
      if (!pubKeyBytes) {
        issues.push(validationError("pubkey", "invalid hex"))
      } else if (pubKeyBytes.length !== 32) {
        issues.push(validationError("pubkey", `must be 32 bytes, got ${pubKeyBytes.length}`))
      }
    }

    let signatureBytes: Uint8Array | null = null
    if (!signature) {
      issues.push(validationError("sig", "required"))
    } else {
      signatureBytes = hexToBytesStrict(signature)
      if (!signatureBytes) {
        issues.push(validationError("sig", "invalid hex"))
      } else if (signatureBytes.length !== 64) {
        issues.push(validationError("sig", `must be 64 bytes, got ${signatureBytes.length}`))
      }
    }

    return {
      value: new ConnectEnvelope(
        version,
        payload,
        pubkey,
        signature,
        payloadBytes,
        pubKeyBytes,
        signatureBytes
      ),
      issues,
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const readString = (
  value: Record<string, unknown>,
  key: string,
  issues: ValidationIssue[]
): string => {
  const candidate = value[key]
  if (typeof candidate === "string") {
    return candidate
  }

  if (candidate === undefined) {
    return ""
  }

  issues.push(validationError(key, "must be a string"))
  return ""
}
