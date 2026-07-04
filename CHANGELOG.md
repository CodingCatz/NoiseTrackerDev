# Changelog

本專案所有值得記錄的變更都會寫在此檔。
格式依版本號規則：`v0.X.0` 為功能里程碑，`v0.X.Ya` 為功能迭代，`v0.X.Yb` 為修復／優化。

## [Unreleased]

### Phase 5：Coyote Time 與 Jump Buffer

- PlayerController 加入 Coyote Time（離地後 `coyoteTimeMs` 內仍可起跳）與 Jump Buffer（落地前 `jumpBufferMs` 內預按自動起跳），數值讀自 playerPhysics.ts。
- 起跳條件改為「buffer 有效且 coyote 視窗開啟」，起跳後同時消耗兩者避免二次跳；未動可變跳高。
- 暴露 `coyoteRemainingMs` / `jumpBufferRemainingMs` getter 供後續 Debug overlay。
- GameScene 加入數塊高低錯落的測試平台（臨時測試骨架，Phase 9 由 LevelSystem 取代）。

### Phase 4：跳躍、重力與可變跳高

- PlayerController 加入跳躍（Space / W / ↑），起跳速度讀自 playerPhysics.ts。
- 可變跳高：上升途中放開跳躍鍵以 `jumpCutMultiplier` 削減速度（短按小跳、長按高跳）。
- 依垂直速度套用 `apexGravityMultiplier`（頂點滯空）與 `fallGravityMultiplier`（下落俐落）。
- 新增設定 `apexThresholdUnit`（判定接近頂點的速度門檻）到手感檔。
- main.ts 於開發模式暴露 `window.__game` 供除錯（正式 build 移除）。
- 尚未實作二段跳（Phase 6）與 Coyote/Buffer（Phase 5）。

### Phase 3：Player 與基礎左右移動

- 新增 `entities/Player.ts`（Arcade sprite，碰撞盒 0.45×0.85 unit、重力與最大下落速度）。
- 新增 `systems/PlayerController.ts`，讀取方向鍵／A・D，套用加速／減速／轉身，速度全讀自 playerPhysics.ts。
- 新增 `utils/math.ts`（clamp、moveTowards）。
- GameScene 加入靜態地面碰撞體與玩家，控制邏輯委由 PlayerController，玩家落地不穿地。
- 尚未實作跳躍（留待 Phase 4）；Camera 跟隨與世界邊界留待 Phase 9/10。

### Phase 2：資料驅動的物理參數

- 建立型別 `src/game/types/`：PhysicsTypes、AbilityTypes、PlayerTypes、LevelTypes、GameTypes。
- 建立資料檔 `src/game/data/`：**playerPhysics.ts（手感調參中樞，跑速／跳高／重力集中於此）**、abilities.ts、interactables.ts、tiles.ts、levels.ts。
- 建立 `utils/validateData.ts`，檢查物理／關卡數值合理性（含 jumpVelocity ≈ sqrt(2·g·h) 驗證），由 BootScene 啟動時呼叫。
- 尚未把物理數值接進玩家控制（留待 Phase 3 起）。

### Phase 1：Scene 架構

- 新增 BootScene、MenuScene、GameScene、UIScene、GameOverScene 五個場景（`src/game/scenes/`）。
- BootScene 以 graphics 產生玩家／地面 placeholder 貼圖，避免缺圖錯誤。
- 場景流程：Boot →（自動）Menu →（Enter/Space）Game（平行啟動 UI）→（暫時 G 鍵）GameOver「CLEAR!」→（R）回 Menu。
- `main.ts` 改以 `Phaser.Game` 註冊五場景，移除 Phase 0 佔位場景。
- 仍無移動／物理玩法（留待 Phase 3 起）。

## [v0.1.0] - 2026-07-04

### Phase 0：建好專案底座

- 建立 Vite + TypeScript + Phaser 專案底座，可 `npm run dev` / `build` / `preview`。
- 固定 FHD 1920×1080 邏輯解析度，Phaser Scale 採 `FIT` + `CENTER_BOTH`，PC / Mobile 等比縮放、手機可 letterbox。
- 建立單位制：`GAME_WIDTH` / `GAME_HEIGHT` / `UNIT`（1 unit = 108 px）與 `u()` / `pxToUnit()` 換算工具。
- 加入 Phase 0 佔位場景（僅顯示 FHD 邊框與單位參考，無任何遊戲玩法；Phase 1 將以正式 Scene 取代）。
- 尚未加入遊戲玩法。
