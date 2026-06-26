import {
  createBundledHighlighter,
  createSingletonShorthands,
} from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

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
