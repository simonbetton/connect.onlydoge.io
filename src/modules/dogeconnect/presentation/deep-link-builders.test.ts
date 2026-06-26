import { describe, expect, test } from "vitest"
import {
  flightRecorderMockSearch,
  flightRecorderQrSearch,
  toolsMockSearch,
  toolsQrValidatorSearch,
} from "./deep-link-builders"

describe("deep link builders", () => {
  test("tools QR validator search uses uri param", () => {
    expect(toolsQrValidatorSearch("dogecoin:abc")).toEqual({
      uri: "dogecoin:abc",
    })
  })

  test("tools mock search uses mock param", () => {
    expect(toolsMockSearch("demo-001")).toEqual({
      mock: "demo-001",
    })
  })

  test("flight recorder QR search uses qr param", () => {
    expect(flightRecorderQrSearch("dogecoin:abc")).toEqual({
      qr: "dogecoin:abc",
    })
  })

  test("flight recorder mock search uses mock param and source tab", () => {
    expect(flightRecorderMockSearch("demo-001")).toEqual({
      mock: "demo-001",
      sourceTab: "mock",
    })
  })
})
