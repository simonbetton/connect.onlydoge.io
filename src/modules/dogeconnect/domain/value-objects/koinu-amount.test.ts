import { describe, expect, test } from "vitest"
import { KoinuAmount } from "./koinu-amount"

describe("KoinuAmount", () => {
  test("parses a normal decimal value", () => {
    const result = KoinuAmount.tryCreate("12.25", "amount")
    expect(result.issues).toHaveLength(0)
    expect(result.value?.koinu).toBe(1_225_000_000n)
  })

  test("supports negative values for discount-like fields", () => {
    const result = KoinuAmount.tryCreate("-5.5", "unit")
    expect(result.issues).toHaveLength(0)
    expect(result.value?.koinu).toBe(-550_000_000n)
  })

  test("fails on invalid characters", () => {
    const result = KoinuAmount.tryCreate("12.3abc", "amount")
    expect(result.value).toBeNull()
    expect(result.issues[0]?.message).toContain("invalid koinu value")
  })

  test("fails when above max-money limit", () => {
    const result = KoinuAmount.tryCreate("10000000001", "amount")
    expect(result.value).toBeNull()
    expect(result.issues[0]?.message).toContain("greater than max-money")
  })
})
