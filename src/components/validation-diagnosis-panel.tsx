import { Paragraph } from "@/components/ui/paragraph"

type ValidationResult = {
  checks?: Array<{ name: string; passed: boolean; details: string }>
  errors?: Array<{ field: string; message: string }>
}

export function ValidationDiagnosisPanel({ result }: { result: ValidationResult }) {
  const failedChecks = result.checks?.filter((check) => !check.passed) ?? []
  const errorCount = result.errors?.length ?? 0

  if (failedChecks.length === 0 && errorCount === 0) {
    return (
      <div className="rounded-2xl border border-success-border bg-success-muted p-3">
        <Paragraph size="sm-medium" color="success">
          All visible checks passed.
        </Paragraph>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-warning-border bg-warning-muted p-3">
      <Paragraph size="sm-medium" color="warning">
        Review required
      </Paragraph>
      <Paragraph size="xs" className="mt-1">
        {failedChecks.length} failed check{failedChecks.length === 1 ? "" : "s"} and {errorCount}{" "}
        parser issue{errorCount === 1 ? "" : "s"} were detected.
      </Paragraph>
    </div>
  )
}
