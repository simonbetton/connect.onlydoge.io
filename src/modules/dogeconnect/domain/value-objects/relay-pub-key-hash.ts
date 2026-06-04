import { base64UrlToBytesStrict, bytesToBase64Url } from "../shared/encoding"
import { type ValidationIssue, validationError } from "../shared/validation"

const PUBKEY_HASH_LENGTH = 15

export class RelayPubKeyHash {
  private constructor(public readonly bytes: Uint8Array) {}

  static tryCreate(
    value: unknown,
    field = "h"
  ): { value: RelayPubKeyHash | null; issues: ValidationIssue[] } {
    if (typeof value !== "string" || value.length === 0) {
      return {
        value: null,
        issues: [validationError(field, "required")],
      }
    }

    const decoded = base64UrlToBytesStrict(value)
    if (!decoded) {
      return {
        value: null,
        issues: [validationError(field, "invalid base64url")],
      }
    }

    if (decoded.length !== PUBKEY_HASH_LENGTH) {
      return {
        value: null,
        issues: [
          validationError(field, `must be ${PUBKEY_HASH_LENGTH} bytes, got ${decoded.length}`),
        ],
      }
    }

    return {
      value: new RelayPubKeyHash(decoded),
      issues: [],
    }
  }

  static fromBytes(bytes: Uint8Array): RelayPubKeyHash | null {
    if (bytes.length !== PUBKEY_HASH_LENGTH) {
      return null
    }
    return new RelayPubKeyHash(bytes)
  }

  toBase64Url(): string {
    return bytesToBase64Url(this.bytes)
  }

  equals(other: RelayPubKeyHash): boolean {
    if (this.bytes.length !== other.bytes.length) {
      return false
    }

    for (let index = 0; index < this.bytes.length; index += 1) {
      if (this.bytes[index] !== other.bytes[index]) {
        return false
      }
    }

    return true
  }
}
