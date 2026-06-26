import { hexToBytesStrict } from "../shared/encoding"
import { type ValidationIssue, validationError } from "../shared/validation"
import { isRecord, readOptionalString, readRequiredString } from "../shared/wire-field-parsing"

interface PaymentSubmissionWire {
  id: string
  tx: string
  refund: string
  relay_token: string
}

export class PaymentSubmission {
  private constructor(
    public readonly wire: PaymentSubmissionWire,
    public readonly txBytes: Uint8Array | null
  ) {}

  static parse(value: unknown): { value: PaymentSubmission | null; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = []

    if (!isRecord(value)) {
      return {
        value: null,
        issues: [validationError("submission", "must be an object")],
      }
    }

    const wire: PaymentSubmissionWire = {
      id: readRequiredString(value, "id", issues),
      tx: readRequiredString(value, "tx", issues),
      refund: readOptionalString(value, "refund", issues),
      relay_token: readOptionalString(value, "relay_token", issues),
    }

    let txBytes: Uint8Array | null = null
    if (wire.tx !== "") {
      txBytes = hexToBytesStrict(wire.tx)
      if (!txBytes) {
        issues.push(validationError("tx", "invalid hex"))
      }
    }

    return {
      value: new PaymentSubmission(wire, txBytes),
      issues,
    }
  }
}

export class StatusQuery {
  private constructor(public readonly id: string) {}

  static parse(value: unknown): { value: StatusQuery | null; issues: ValidationIssue[] } {
    if (!isRecord(value)) {
      return {
        value: null,
        issues: [validationError("query", "must be an object")],
      }
    }

    const issues: ValidationIssue[] = []
    const id = readRequiredString(value, "id", issues)

    return {
      value: new StatusQuery(id),
      issues,
    }
  }
}
