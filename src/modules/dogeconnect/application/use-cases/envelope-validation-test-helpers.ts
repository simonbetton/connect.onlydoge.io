import { expect } from "vitest"

export const expectPublicKeyHashMismatch = (
  expectedHash: string,
  actualHash: string,
  result: {
    verdict: string
    checks: Array<{ name: string; passed: boolean }>
    errors: Array<{ field: string }>
  },
  checkName = "Public key hash match"
) => {
  expect(expectedHash).not.toBe(actualHash)
  expect(result.verdict).toBe("invalid")
  expect(result.checks.some((check) => check.name === checkName && !check.passed)).toBe(true)
  expect(result.errors.some((issue) => issue.field === "pubkey")).toBe(true)
}
