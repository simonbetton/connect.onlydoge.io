import { describe, expect, test } from "vitest"
import { defaultToolsSearch, resolveToolsSearch, validateToolsSearch } from "./tools-search"

describe("tools search parsing", () => {
  test("drops undefined values before merging with defaults", () => {
    const search = validateToolsSearch({
      uri: undefined,
      fetchEnvelope: undefined,
      registerScenario: undefined,
    })

    expect(search).toEqual({})
    expect(resolveToolsSearch(search)).toEqual(defaultToolsSearch)
  })
})
