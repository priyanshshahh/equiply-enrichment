import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Same-origin proxy — browser calls /openai-api, Vite forwards to OpenAI (avoids CORS). */
const openAiProxy = {
  "/openai-api": {
    target: "https://api.openai.com",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/openai-api/, ""),
  },
} as const;

export default defineConfig({
  plugins: [react()],
  server: { proxy: { ...openAiProxy } },
  preview: { proxy: { ...openAiProxy } },
});
