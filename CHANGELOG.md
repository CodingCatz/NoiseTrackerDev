# Changelog

本專案所有值得記錄的變更都會寫在此檔。
格式依版本號規則：`v0.X.0` 為功能里程碑，`v0.X.Ya` 為功能迭代，`v0.X.Yb` 為修復／優化。

## [Unreleased]

### Phase 13：陷阱與移動平台

- 新增 `entities/Hazard.ts`（spike／saw）：接觸玩家即死亡重生。
- 新增 `entities/MovingPlatform.ts`：兩點來回、端點停留；玩家站上去由 Arcade immovable body 內建摩擦自動穩定跟隨（不抖動、不穿透）。
- `LevelTypes` 加入 `HazardConfig` / `MovingPlatformConfig`；TEST_LEVEL 補上一排尖刺與一台水平移動平台。
- GameScene 建立陷阱 overlap（致死）與移動平台碰撞，並每幀更新平台位移。

### Phase 11–12：互動物件與 Checkpoint／重生（以簡易測試關卡驗證）

- 新增 `data/levels.ts` 的 `TEST_LEVEL`（40×14，含坑）並讓 GameScene 暫用它驗證互動與重生；MVP_LEVEL 保留待整合後切回。
- 新增共用實體 `entities/Interactable.ts`（key／door／switch／checkpoint／goal）。
- 新增 `systems/InteractionSystem.ts`：key 碰到即拾取、locked_door 靠近按 E 且有 key 才開、switch 按 E 切換連動 switch_door、checkpoint 碰到即啟用。
- 新增 `systems/GameState.ts`（keyCount／deaths，寫入 registry；Phase 16 會擴充）與 `systems/CheckpointSystem.ts`（記錄重生點並重生）。
- GameScene 加入掉落深淵死亡判定（y > 世界高 + 3 units）→ deaths +1、大震動、重生到最近 checkpoint。
- UIScene 顯示 Keys／Deaths／能力，全部讀 registry 即時刷新。
- LevelSystem 物件標記改為只畫 goal，其餘互動物件交由 InteractionSystem。

### Phase 10：CameraSystem

- 新增 `systems/CameraSystem.ts`：平滑跟隨（lerp 0.08）、死區（4×2.5 units）、`smallShake` / `largeShake`。
- 新增 `data/cameraConfig.ts` 集中相機參數；相機自動夾在世界邊界內，不超出關卡。
- GameScene 改用 CameraSystem 取代基本 startFollow，並在落地重擊（下落 > 10 unit/s）時觸發輕微震動。

### Phase 9：Tilemap／關卡資料架構

- 新增 `systems/LevelSystem.ts`：依 `levels.ts` 生成地形、物件標記，並設定世界與相機邊界。
- `LevelTypes` 加入 `SolidConfig` 與 `LevelConfig.solids`；`levels.ts` 補上完整 MVP 關卡（80×20 units）：起點 → 二段跳階梯 → Dash 缺口 → 牆跳垂直區 → 高處走道 → 終點。
- GameScene 改用 LevelSystem 生成地形，移除臨時測試平台；玩家由關卡 spawn 生成，相機基本跟隨（完整 CameraSystem 留待 Phase 10）。
- Tile size 0.5 unit = 54 px；世界／相機邊界 8640×2160 px。

### Phase 8：牆滑與牆跳

- PlayerController 重整跳躍／牆壁邏輯：`readWallSide` 以 `blocked.left/right` 判定貼牆，天生不把地板誤判成牆。
- 牆滑：空中貼牆下落時將下落速度限制為 `wallSlideMaxFallSpeedUnit`（3.5 unit/s）。
- 牆跳：往牆的反方向斜上跳開（`wallJumpXVelocityUnit` / `wallJumpYVelocityUnit`），並以 `wallJumpLockMs` 鎖定水平輸入避免黏回牆面。
- 牆跳優先於一般跳躍並消耗該次輸入，未破壞二段跳與 Dash。
- GameScene 第三塊平台往下延伸為測試牆；預設解鎖 `wall_slide` / `wall_jump`，UI 顯示。
- 暴露 `isWallSliding` / `isTouchingWall` getter 供 Debug overlay。

### Phase 7：空中衝刺 Dash

- PlayerController 加入 Dash（Shift / L / C）：方向依輸入（可斜向），無輸入則依面向；速度由 `dashDistanceUnit / dashDurationMs` 推導。
- 衝刺期間關閉重力並解除下落上限維持全速，結束後收尾恢復；碰撞仍生效不穿牆。
- 衝刺次數 `maxAirDashes` 與冷卻 `dashCooldownMs` 生效，落地重置；暴露 `dashing` / `dashReady` getter。
- GameScene 預設解鎖 `dash`；UI 顯示 `Air Dash`。
- Dash 優先於一般移動，未破壞跳躍／二段跳。

### Phase 6：二段跳（AbilitySystem）

- 新增 `systems/AbilitySystem.ts`：集中管理能力解鎖與滯空次數，解鎖狀態寫入 registry 供 UI 讀取。
- PlayerController 加入二段跳：超出 coyote 視窗後於空中再按跳 → 以 `doubleJumpVelocityUnit` 起跳，落地重置。
- GameScene 建立 AbilitySystem 並預設解鎖 `double_jump`（方便測試，正式解鎖留待 Phase 15）。
- UIScene 讀 registry 顯示已解鎖能力（如 `Double Jump`），能力變動即時刷新。
- 能力狀態不寫死在 Player；尚未實作 Dash（Phase 7）。

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
