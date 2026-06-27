# NoiseTrackerDev

FHD 2D 精準平台跳躍遊戲（**Precision Platformer**，Celeste-like）的開發專案。

以 **Phaser + Vite + TypeScript** 製作，FHD 1920×1080 邏輯解析度，
透過 **GitHub Actions** 自動部署到 GitHub Pages。

> 目前狀態：規格階段。完整規格見
> [`ClaudeCode_FHD_Precision_Platformer_SPEC.md`](./ClaudeCode_FHD_Precision_Platformer_SPEC.md)，
> 程式碼將依該文件的 Phase 0–21 依序實作。

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
| 單位制 | 1 unit = 畫面高 10% = 108 px |
| 世界（MVP） | 80 × 20 units |
| Tile size | 0.5 unit = 54 px |
| 移動能力 | 二段跳、空中 Dash、牆滑、牆跳 |
| 死亡 | 無 HP，碰陷阱 / 掉落即重生到最近 checkpoint |
| 通關 | 抵達 goal |

## 開發指令（待專案底座建立後）

```bash
npm install
npm run dev      # 開發伺服器
npm run build    # 產出 dist/
npm run preview  # 預覽 build 結果
```

## 文件

- [專案 SPEC](./ClaudeCode_FHD_Precision_Platformer_SPEC.md) — 完整規格與 Phase 0–21 執行計畫
