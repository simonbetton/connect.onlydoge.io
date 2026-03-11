import { type ValidationIssue, validationError } from "../shared/validation"

const RFC3339_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

export class Rfc3339Timestamp {
  private constructor(
    public readonly raw: string,
    public readonly date: Date
  ) {}

  static tryCreate(
    value: unknown,
    field: string
  ): { value: Rfc3339Timestamp | null; issues: ValidationIssue[] } {
    if (typeof value !== "string" || value.length === 0) {
      return {
        value: null,
        issues: [validationError(field, "required")],
      }
    }

    if (!RFC3339_REGEX.test(value)) {
      return {
        value: null,
        issues: [validationError(field, "invalid RFC 3339 timestamp")],
      }
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return {
        value: null,
        issues: [validationError(field, "invalid RFC 3339 timestamp")],
      }
    }

    return {
      value: new Rfc3339Timestamp(value, parsed),
      issues: [],
    }
  }
}
