import type { Plugin } from "vite"

/**
 * Pure annotations are only valid immediately before call or `new` expressions.
 * Some dependencies annotate literals instead (e.g. icon data arrays), which
 * Rolldown rejects as INVALID_ANNOTATION.
 *
 * @see https://rolldown.rs/in-depth/dead-code-elimination#pure
 */
const PURE_ANNOTATION = /\/\*[#@]?\s*__PURE__\s*\*\//

/** Annotation before a non-call expression (array, object, literal, etc.). */
const INVALID_PURE_BEFORE_EXPRESSION =
  /\/\*[#@]?\s*__PURE__\s*\*\/\s*(?=[[{]|null\b|undefined\b|'|"|`|\d)/g

/** Annotation between a binding and `=` in a declarator. */
const INVALID_PURE_IN_DECLARATOR = /(\b(?:const|let|var)\s+[\w$]+)\s*\/\*[#@]?\s*__PURE__\s*\*\//g

export function stripInvalidPureAnnotations(code: string): string {
  return code.replace(INVALID_PURE_BEFORE_EXPRESSION, "").replace(INVALID_PURE_IN_DECLARATOR, "$1")
}

export type StripInvalidPureAnnotationsOptions = {
  /** node_modules package names to transform */
  packages?: string[]
}

const DEFAULT_PACKAGES = ["@hugeicons/core-free-icons"]

export default function stripInvalidPureAnnotationsPlugin(
  options: StripInvalidPureAnnotationsOptions = {}
): Plugin {
  const packages = options.packages ?? DEFAULT_PACKAGES
  const idPattern = new RegExp(
    `[\\\\/]node_modules[\\\\/](${packages.map((pkg) => pkg.replace("/", "[\\\\/]")).join("|")})[\\\\/]`
  )

  return {
    name: "strip-invalid-pure-annotations",
    transform: {
      filter: { id: idPattern },
      handler(code: string) {
        if (!PURE_ANNOTATION.test(code)) return
        const stripped = stripInvalidPureAnnotations(code)
        if (stripped === code) return
        return stripped
      },
    },
  }
}
