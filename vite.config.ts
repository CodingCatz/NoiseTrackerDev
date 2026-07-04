import { defineConfig } from "vite";

// GitHub Pages 的 base path 會在 Phase 20 部署階段補上，這裡先維持根路徑。
export default defineConfig({
  base: "/",
  build: {
    target: "es2020",
    outDir: "dist",
  },
});
