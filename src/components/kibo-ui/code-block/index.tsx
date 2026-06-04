"use client"

import { useControllableState } from "@radix-ui/react-use-controllable-state"
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers"
import { CheckIcon, CopyIcon } from "lucide-react"
import * as React from "react"
import type { BundledLanguage, CodeOptionsMultipleThemes } from "shiki"
import { codeToHtml } from "shiki"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CodeBlockData = {
  language: string
  filename: string
  code: string
}

type CodeBlockContextValue = {
  data: CodeBlockData[]
  value: string | undefined
}

const CodeBlockContext = React.createContext<CodeBlockContextValue>({
  data: [],
  value: undefined,
})

const lineNumberClassNames = cn(
  "[&_code]:[counter-reset:line]",
  "[&_.line]:before:inline-block",
  "[&_.line]:before:mr-4",
  "[&_.line]:before:w-8",
  "[&_.line]:before:select-none",
  "[&_.line]:before:text-right",
  "[&_.line]:before:font-mono",
  "[&_.line]:before:text-[11px]",
  "[&_.line]:before:text-muted-foreground/50",
  "[&_.line]:before:content-[counter(line)]",
  "[&_.line]:before:[counter-increment:line]"
)

const codeBlockClassName = cn(
  "min-w-0 bg-background text-sm",
  "[&_.shiki]:!m-0",
  "[&_.shiki]:!bg-transparent",
  "[&_pre]:overflow-x-auto",
  "[&_pre]:py-4",
  "[&_pre]:text-xs sm:[&_pre]:text-sm",
  "[&_code]:grid",
  "[&_code]:min-w-0",
  "[&_.line]:relative",
  "[&_.line]:w-full",
  "[&_.line]:px-4"
)

const darkModeClassNames = cn(
  "dark:[&_.shiki]:!text-[var(--shiki-dark)]",
  "dark:[&_.shiki]:![font-style:var(--shiki-dark-font-style)]",
  "dark:[&_.shiki]:![font-weight:var(--shiki-dark-font-weight)]",
  "dark:[&_.shiki]:![text-decoration:var(--shiki-dark-text-decoration)]",
  "dark:[&_.shiki_span]:!text-[var(--shiki-dark)]",
  "dark:[&_.shiki_span]:![font-style:var(--shiki-dark-font-style)]",
  "dark:[&_.shiki_span]:![font-weight:var(--shiki-dark-font-weight)]",
  "dark:[&_.shiki_span]:![text-decoration:var(--shiki-dark-text-decoration)]"
)

const lineHighlightClassNames = cn(
  "[&_.line.highlighted]:bg-blue-50/70",
  "[&_.line.highlighted]:after:absolute",
  "[&_.line.highlighted]:after:inset-y-0",
  "[&_.line.highlighted]:after:left-0",
  "[&_.line.highlighted]:after:w-0.5",
  "[&_.line.highlighted]:after:bg-blue-500",
  "dark:[&_.line.highlighted]:!bg-blue-500/10"
)

const lineDiffClassNames = cn(
  "[&_.line.diff]:after:absolute",
  "[&_.line.diff]:after:inset-y-0",
  "[&_.line.diff]:after:left-0",
  "[&_.line.diff]:after:w-0.5",
  "[&_.line.diff.add]:bg-emerald-50/80",
  "[&_.line.diff.add]:after:bg-emerald-500",
  "[&_.line.diff.remove]:bg-rose-50/80",
  "[&_.line.diff.remove]:after:bg-rose-500",
  "dark:[&_.line.diff.add]:!bg-emerald-500/10",
  "dark:[&_.line.diff.remove]:!bg-rose-500/10"
)

const lineFocusedClassNames = cn(
  "[&_code:has(.focused)_.line]:blur-[2px]",
  "[&_code:has(.focused)_.line.focused]:blur-none"
)

const wordHighlightClassNames = cn(
  "[&_.highlighted-word]:bg-blue-50/70",
  "dark:[&_.highlighted-word]:!bg-blue-500/10"
)

const highlightCode = (
  code: string,
  language?: BundledLanguage,
  themes?: CodeOptionsMultipleThemes["themes"]
) =>
  codeToHtml(code, {
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

export type CodeBlockProps = React.HTMLAttributes<HTMLDivElement> & {
  data: CodeBlockData[]
  defaultValue?: string
  value?: string
}

export const CodeBlock = ({
  data,
  defaultValue,
  value: controlledValue,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const [value] = useControllableState({
    defaultProp: defaultValue ?? data[0]?.language ?? "",
    prop: controlledValue,
  })

  return (
    <CodeBlockContext.Provider value={{ data, value }}>
      <div
        className={cn(
          "min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-background/70",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CodeBlockContext.Provider>
  )
}

export const CodeBlockHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex min-w-0 items-center justify-between gap-3 border-b border-border/70 bg-muted/50 px-3 py-2",
      className
    )}
    {...props}
  />
)

export const CodeBlockFilename = ({
  className,
  value,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: string }) => {
  const context = React.useContext(CodeBlockContext)

  if (value && context.value !== value) {
    return null
  }

  return (
    <div
      className={cn("min-w-0 truncate font-mono text-xs text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const CodeBlockCopyButton = ({
  className,
  timeout = 2000,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick"> & { timeout?: number }) => {
  const [isCopied, setIsCopied] = React.useState(false)
  const { data, value } = React.useContext(CodeBlockContext)
  const code = data.find((item) => item.language === value)?.code ?? ""

  const onCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard.writeText || !code) {
      return
    }

    await navigator.clipboard.writeText(code)
    setIsCopied(true)

    window.setTimeout(() => {
      setIsCopied(false)
    }, timeout)
  }

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      className={cn("shrink-0", className)}
      onClick={() => {
        void onCopy()
      }}
      {...props}
    >
      {isCopied ? (
        <CheckIcon className="size-3.5 text-emerald-600" />
      ) : (
        <CopyIcon className="size-3.5 text-muted-foreground" />
      )}
    </Button>
  )
}

export const CodeBlockBody = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props}>{children}</div>
)

export const CodeBlockItem = ({
  children,
  value,
  lineNumbers = true,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string
  lineNumbers?: boolean
}) => {
  const context = React.useContext(CodeBlockContext)

  if (context.value !== value) {
    return null
  }

  return (
    <div
      className={cn(
        codeBlockClassName,
        darkModeClassNames,
        lineHighlightClassNames,
        lineDiffClassNames,
        lineFocusedClassNames,
        wordHighlightClassNames,
        lineNumbers && lineNumberClassNames,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

const CodeBlockFallback = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props}>
    <pre className="overflow-x-auto py-4 text-xs sm:text-sm">
      <code className="grid min-w-0">
        {(() => {
          let cursor = 0
          return children
            ?.toString()
            .split("\n")
            .map((line) => {
              const key = `${cursor}:${line}`
              cursor += line.length + 1

              return (
                <span key={key} className="line px-4">
                  {line}
                </span>
              )
            })
        })()}
      </code>
    </pre>
  </div>
)

export const CodeBlockContent = ({
  children,
  themes,
  language,
  syntaxHighlighting = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  themes?: CodeOptionsMultipleThemes["themes"]
  language?: BundledLanguage
  syntaxHighlighting?: boolean
  children: string
}) => {
  const [html, setHtml] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!syntaxHighlighting) {
      return
    }

    let cancelled = false

    void highlightCode(children, language, themes)
      .then((value) => {
        if (!cancelled) {
          setHtml(value)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHtml(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [children, language, syntaxHighlighting, themes])

  if (!(syntaxHighlighting && html)) {
    return <CodeBlockFallback>{children}</CodeBlockFallback>
  }

  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki returns trusted markup for code highlighting.
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  )
}
