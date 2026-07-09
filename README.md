# NoiseTrackerDev

FHD 2D 精準平台跳躍遊戲（**Precision Platformer**，Celeste-like）的開發專案。

以 **Phaser + Vite + TypeScript**（Arcade 物理）製作，FHD 1920×1080 邏輯解析度，
透過 **GitHub Actions** 自動部署到 GitHub Pages。

> **遊戲網址：** https://codingcatz.github.io/NoiseTrackerDev/
>
> 目前狀態：核心玩法完成（移動／可變跳／二段跳／衝刺／牆滑牆跳、資料驅動關卡、
> 鑰匙門開關、Checkpoint 重生、陷阱、移動平台、能力拾取教學關、通關流程、Debug overlay、
> 手機觸控、GitHub Pages 自動部署）。完整規格見
> [`ClaudeCode_FHD_Precision_Platformer_SPEC.md`](./ClaudeCode_FHD_Precision_Platformer_SPEC.md)。

## 遊戲類型

```txt
2D Precision Platformer（精準平台跳躍，Celeste-like）
平台跳躍 × 關卡探索 × 物理手感 × Tilemap 機關 × 到達終點通關
無敵人、無戰鬥
```

核心玩法：移動 → 跳躍 / 二段跳 / Dash / 牆跳通過地形 → 取鑰匙開門、觸發開關
→ 避開陷阱（spike / saw / pit，碰到即死亡重生）→ 抵達終點即通關。

## 規格重點

| 項目 | 值 |
|---|---|
| 解析度 | 1920×1080（FHD） |
| 單位制 | 1 unit = 畫面高 10% = 108 px（速度/加速度共用同一換算） |
| 世界 | 每關自訂大小（資料驅動，例：32 × 12 units） |
| 關卡資料 | JSON，矩形 `{x,y,w,h}` 左上角錨點、Y 向下 |
| 移動能力 | 跑/可變跳/二段跳/牆滑牆跳/衝刺（衝刺排 v0.5.0） |
| 死亡 | 無 HP，碰陷阱 / 掉落深淵即重生到最近紀錄點（世界進度保留） |
| 通關 | 抵達 goal |

## 開發指令

```bash
npm install
npm run dev      # 開發伺服器
npm run build    # 產出 dist/
npm run preview  # 預覽 build 結果
```

## 部署（GitHub Pages）

推送到 `main` 時，[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 會自動 build 並部署 `dist/` 到 GitHub Pages。

- `vite.config.ts` 會在 GitHub Actions 環境依 `GITHUB_REPOSITORY` 自動設定 base path（`/NoiseTrackerDev/`），本機開發用根路徑。
- 使用 GitHub 官方 Pages actions（`configure-pages` / `upload-pages-artifact` / `deploy-pages`），不需額外 token。
- **首次啟用**：到 GitHub repo **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**，之後每次 push `main` 即自動更新。
- 部署完成後可於 **Actions** 分頁查看進度，網址：https://codingcatz.github.io/NoiseTrackerDev/

## 文件

- [專案 SPEC](./ClaudeCode_FHD_Precision_Platformer_SPEC.md) — v0.1.0 定稿製作規格（設計 + 單位/物理數值表 + 關卡 schema + 部署 + 里程碑），**權威來源**
- [課程講稿](./course/01_課程講稿.md) — 以本專案為題材的「AI 協作開發 → 上架 GHP」10 堂課教學講稿
- [課程網頁簡報](./course/slides-web/index.html) — 學員視角網頁簡報（總覽 hub + 第 0–9 課全 10 課，暗夜霓虹風格，單檔零依賴）
