import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import transformImports from "@rolldown/plugin-transform-imports"
import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import stripInvalidPureAnnotations from "./vite/strip-invalid-pure-annotations"

const rootDir = dirname(fileURLToPath(import.meta.url))

const config = defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": resolve(rootDir, "src"),
    },
    tsconfigPaths: true,
  },
  plugins: [
    stripInvalidPureAnnotations(),
    transformImports({
      "@hugeicons/core-free-icons": {
        transform: "@hugeicons/core-free-icons/{{member}}",
      },
    }),
    mode === "development" ? devtools() : null,
    nitro(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))

export default config
