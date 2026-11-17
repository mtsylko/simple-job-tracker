import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const apiProxyTarget = process.env.VITE_API_URL || "http://localhost:3000"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5174,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/auth": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      // CV attachments are served off the API's disk; nginx proxies them in prod
      "/uploads": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `shared` ships a CommonJS build for the API's plain-node runtime, and
      // Rollup cannot trace named exports out of a linked CJS package. Vite
      // compiles the TypeScript source directly instead.
      "@job-tracker/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  }
});
