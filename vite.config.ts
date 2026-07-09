import { defineConfig } from "vite";

// GitHub Pages 部署於 https://<user>.github.io/<repo>/，需設定對應 base path。
// 在 GitHub Actions 中 GITHUB_REPOSITORY = "owner/repo"，取 repo 當 base；本機開發用根路徑。
export default defineConfig({
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
    : "/",
  build: {
    target: "es2020",
    outDir: "dist",
  },
});
