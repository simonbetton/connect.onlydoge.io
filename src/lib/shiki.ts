import {
  createBundledHighlighter,
  createSingletonShorthands,
} from "@shikijs/core"
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript"

export type CodeBlockLanguage = "json"

const createHighlighter = createBundledHighlighter({
  langs: {
    json: () => import("@shikijs/langs/json"),
  },
  themes: {
    "github-light": () => import("@shikijs/themes/github-light"),
    "github-dark-default": () => import("@shikijs/themes/github-dark-default"),
  },
  engine: () => createJavaScriptRegexEngine(),
})

const { codeToHtml } = createSingletonShorthands(createHighlighter)

export { codeToHtml }
