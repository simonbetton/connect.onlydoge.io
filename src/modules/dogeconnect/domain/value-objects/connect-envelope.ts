import { base64ToBytesStrict, hexToBytesStrict } from "../shared/encoding"
import { type ValidationIssue, validationError } from "../shared/validation"

const ENVELOPE_VERSION = "1.0"

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

    const payloadBytes = decodeRequiredFieldBytes({
      value: payload,
      field: "payload",
      decoder: base64ToBytesStrict,
      invalidMessage: "invalid base64",
      expectedLength: null,
      issues,
    })

    const pubKeyBytes = decodeRequiredFieldBytes({
      value: pubkey,
      field: "pubkey",
      decoder: hexToBytesStrict,
      invalidMessage: "invalid hex",
      expectedLength: 32,
      issues,
    })

    const signatureBytes = decodeRequiredFieldBytes({
      value: signature,
      field: "sig",
      decoder: hexToBytesStrict,
      invalidMessage: "invalid hex",
      expectedLength: 64,
      issues,
    })

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

const decodeRequiredFieldBytes = (input: {
  value: string
  field: string
  decoder: (value: string) => Uint8Array | null
  invalidMessage: string
  expectedLength: number | null
  issues: ValidationIssue[]
}): Uint8Array | null => {
  if (!input.value) {
    input.issues.push(validationError(input.field, "required"))
    return null
  }

  const bytes = input.decoder(input.value)
  if (!bytes) {
    input.issues.push(validationError(input.field, input.invalidMessage))
    return null
  }

  if (input.expectedLength !== null && bytes.length !== input.expectedLength) {
    input.issues.push(
      validationError(input.field, `must be ${input.expectedLength} bytes, got ${bytes.length}`)
    )
  }

  return bytes
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
