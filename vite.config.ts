import tailwindcss from "@tailwindcss/vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import transformImports from "@rolldown/plugin-transform-imports"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"

const config = defineConfig(({ mode }) => ({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
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
