import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers"
import type { CodeOptionsMultipleThemes } from "@shikijs/types"
import type { HTMLAttributes } from "react"
import { type CodeBlockLanguage, codeToHtml } from "@/lib/shiki"

export type CodeBlockContentProps = HTMLAttributes<HTMLDivElement> & {
  themes?: CodeOptionsMultipleThemes["themes"]
  language?: CodeBlockLanguage
  syntaxHighlighting?: boolean
  children: string
}

export const CodeBlockContent = async ({
  children,
  themes,
  language,
  syntaxHighlighting = true,
  ...props
}: CodeBlockContentProps) => {
  const html = syntaxHighlighting
    ? await codeToHtml(children, {
        lang: language ?? "json",
        themes: themes ?? {
          light: "github-light",
          dark: "github-dark-default",
        },
        transformers: [
          transformerNotationDiff({ matchAlgorithm: "v3" }),
          transformerNotationHighlight({ matchAlgorithm: "v3" }),
          transformerNotationWordHighlight({ matchAlgorithm: "v3" }),
          transformerNotationFocus({ matchAlgorithm: "v3" }),
          transformerNotationErrorLevel({ matchAlgorithm: "v3" }),
        ],
      })
    : children

  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki returns trusted markup for code highlighting.
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  )
}
