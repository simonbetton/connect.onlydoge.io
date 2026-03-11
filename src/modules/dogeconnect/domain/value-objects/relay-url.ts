import { type ValidationIssue, validationError } from "../shared/validation"

export class RelayUrl {
  private constructor(
    public readonly raw: string,
    public readonly url: URL
  ) {}

  static tryCreate(
    value: unknown,
    field: string
  ): { value: RelayUrl | null; issues: ValidationIssue[] } {
    if (typeof value !== "string" || value.length === 0) {
      return {
        value: null,
        issues: [validationError(field, "required")],
      }
    }

    let parsed: URL
    try {
      parsed = new URL(value)
    } catch {
      return {
        value: null,
        issues: [validationError(field, "invalid URL")],
      }
    }

    if (parsed.protocol !== "https:") {
      return {
        value: null,
        issues: [validationError(field, "must use https")],
      }
    }

    return {
      value: new RelayUrl(value, parsed),
      issues: [],
    }
  }
}
