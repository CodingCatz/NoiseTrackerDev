# Changelog

本專案所有值得記錄的變更都會寫在此檔。
格式依版本號規則：`v0.X.0` 為功能里程碑，`v0.X.Ya` 為功能迭代，`v0.X.Yb` 為修復／優化。

## [v0.1.0] - 2026-07-04

### Phase 0：建好專案底座

- 建立 Vite + TypeScript + Phaser 專案底座，可 `npm run dev` / `build` / `preview`。
- 固定 FHD 1920×1080 邏輯解析度，Phaser Scale 採 `FIT` + `CENTER_BOTH`，PC / Mobile 等比縮放、手機可 letterbox。
- 建立單位制：`GAME_WIDTH` / `GAME_HEIGHT` / `UNIT`（1 unit = 108 px）與 `u()` / `pxToUnit()` 換算工具。
- 加入 Phase 0 佔位場景（僅顯示 FHD 邊框與單位參考，無任何遊戲玩法；Phase 1 將以正式 Scene 取代）。
- 尚未加入遊戲玩法。
