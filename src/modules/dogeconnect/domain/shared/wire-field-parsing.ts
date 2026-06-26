import { type ValidationIssue, validationError } from "./validation"

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const readFieldName = (field: string): string => field.split(".").pop() ?? field

export const readRequiredString = (
  value: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[]
): string => {
  const candidate = value[readFieldName(field)]

  if (typeof candidate !== "string") {
    if (candidate === undefined || candidate === null) {
      issues.push(validationError(field, "required"))
    } else {
      issues.push(validationError(field, "must be a string"))
    }
    return ""
  }

  if (candidate.length === 0) {
    issues.push(validationError(field, "required"))
  }

  return candidate
}

export const readOptionalString = (
  value: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[]
): string => {
  const candidate = value[readFieldName(field)]

  if (candidate === undefined || candidate === null) {
    return ""
  }

  if (typeof candidate !== "string") {
    issues.push(validationError(field, "must be a string"))
    return ""
  }

  return candidate
}

export const readInteger = (
  value: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[]
): number => {
  const candidate = value[readFieldName(field)]

  if (candidate === undefined || candidate === null) {
    return 0
  }

  if (typeof candidate !== "number" || !Number.isInteger(candidate)) {
    issues.push(validationError(field, "must be an integer"))
    return 0
  }

  return candidate
}
