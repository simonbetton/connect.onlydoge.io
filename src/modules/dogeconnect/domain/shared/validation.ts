export type ValidationSeverity = "error" | "warning"

export interface ValidationIssue {
  field: string
  message: string
  severity: ValidationSeverity
  code?: string
}

export const validationError = (
  field: string,
  message: string,
  code?: string
): ValidationIssue => ({
  field,
  message,
  severity: "error",
  code,
})

export const validationWarning = (
  field: string,
  message: string,
  code?: string
): ValidationIssue => ({
  field,
  message,
  severity: "warning",
  code,
})

export const hasValidationErrors = (issues: ValidationIssue[]): boolean =>
  issues.some((issue) => issue.severity === "error")
