import { describe, expect, it } from "vitest"
import { stripInvalidPureAnnotations } from "./strip-invalid-pure-annotations"

describe("stripInvalidPureAnnotations", () => {
  it("removes pure annotations before array literals", () => {
    const input =
      'const ArrowRight01Icon = /*#__PURE__*/ [\n  ["path", { d: "M9 6" }]\n];'
    expect(stripInvalidPureAnnotations(input)).toBe(
      'const ArrowRight01Icon = [\n  ["path", { d: "M9 6" }]\n];',
    )
  })

  it("preserves valid pure annotations before calls", () => {
    const input = "const button = /*#__PURE__*/ createButton();"
    expect(stripInvalidPureAnnotations(input)).toBe(input)
  })

  it("preserves valid pure annotations before new expressions", () => {
    const input = "const widget = /*#__PURE__*/ new Widget();"
    expect(stripInvalidPureAnnotations(input)).toBe(input)
  })
})
