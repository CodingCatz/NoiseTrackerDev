# Changelog

本專案所有值得記錄的變更都會寫在此檔。
格式依版本號規則：`v0.X.0` 為功能里程碑，`v0.X.Ya` 為功能迭代，`v0.X.Yb` 為修復／優化。

## [Unreleased]

### 觸控動作鈕依狀態即時反應

- 觸控動作鈕（跳／衝／E）改為每幀依能力與使用情況刷新（`TouchControls.update`，由 GameScene 驅動；桌機無鈕時 no-op）：
  - **未取得的行為 → 隱藏並停用**：衝刺未解鎖、E 未持有鑰匙時，該鈕消失且不可點。
  - **跳鈕動態換圖**：空中且尚可二段跳時，跳鈕圖示換成二段跳圖示（提示可再跳一次）。
  - **已用完／不可用 → 染紅**：衝刺冷卻或空中衝刺用完、空中已無跳可用時，圓框與圖示染紅。
- `PlayerController` 新增 `grounded` getter 供表演層外系統查詢。

### 角色動畫控制層（表演層／控制器分離）

- 新增 `data/characterAnim.ts`：Neon 逐幀動畫的幀表契約（8 個 clip：idle/turn/run/dash/jump_rise/jump_fall/land/wall_slide，含幀數/fps/loop、cell 256、腳底基線 232），與共享 skill `sprite-animation-sheets` 及美術產圖規格一致。
- 新增 `systems/PlayerAnimator.ts`：玩家「表演層」，與碰撞體/控制器分離（同 3D：控制器＋模型子物件）。碰撞體維持不動；獨立 sprite 每幀同步玩家位置、腳底對齊碰撞體底部、依面向 flipX、依 `PlayerController.currentState` 切 clip（含落地/轉向轉場態）。
- GameScene 接線 animator。
- **目前休眠**：動畫 strip 素材尚未交付（跨 AI 派工由 Codex 產製中）；strip 就緒後於 BootScene 加一行 `PlayerAnimator.preload(this)` 即自動啟用，屆時再校正 `PRESENTATION_SCALE`。以佔位 strip 驗證過表演層同步/播放/翻面/落地對齊皆正常。

### HUD／觸控全面圖示化（人形剪影 + 半透光暈）

- **動作技能人形剪影素材**：`public/assets/ui/skills/` 新增純白透明剪影 PNG（jump／double_jump／dash／wall_jump／wall_slide／ground_pound／key），全白便於 runtime `setTint` 染色、`setAlpha` 調透明。素材經跨 AI 派工（SBM 工單）由 Codex 以「內建作圖綠幕 → 本機去背」產出。
- **HUD 能力列**：由彩色圓點改為「白細圓框 + 人形剪影」，並靠攏置中於畫面中上方；顯示 double_jump／dash／wall_slide，取得後亮燈（白框全亮）、未取得變暗（染灰半透）。
- **全面去文字化**：移除「能力」「鑰匙」區塊標題與各圖示文字標籤，一律以圖示表達（死亡次數保留於右上）。
- **鑰匙**：以鑰匙圖示（染金黃 `#ffd34e`）點亮表示，收集幾把亮幾顆；觸控 E 鈕即為鑰匙圖示。
- **觸控動作鈕**：跳／衝／E 由文字改為半透光暈人形剪影（跳=jump、衝=dash、E=key），與方向箭頭同一視覺語言；按下提亮。
- **場上道具圖示化**：能力道具改以對應能力的人形剪影呈現並染上能力色（藍／黃／綠）；場上鑰匙改以金黃鑰匙剪影呈現（隱形矩形保留 overlap 物理身體）。
- **技術**：新增 `utils/glowTexture.ts`（以 canvas shadowBlur 將純白剪影烤成含柔光暈的貼圖，繞過 Phaser 3.90 失效的 postFX）；`data/abilities.ts` 新增剪影圖示登錄表（貼圖鍵 + 內容最長邊，用於一致縮放）。

### 通關畫面：可點「重來」鈕

- `GameOverScene` 原本僅靠鍵盤 `R` 重來，觸控裝置無 R 鍵形同失效；改為可點的「重來」鈕（觸控／滑鼠皆可），`R` 保留為桌機快捷。

### Phase 20：GitHub Pages 自動部署

- 新增 `.github/workflows/deploy.yml`：push 到 `main` 自動 build 並以官方 Pages actions 部署 `dist/`（`configure-pages` / `upload-pages-artifact` / `deploy-pages`，permissions：contents read、pages write、id-token write）。
- `vite.config.ts` 依 `GITHUB_REPOSITORY` 自動設定 base path（GitHub Actions 環境為 `/NoiseTrackerDev/`，本機為 `/`）。
- README 補上部署說明與遊戲網址（首次需在 repo Settings → Pages → Source 選 GitHub Actions）。

### Phase 19：Mobile 觸控操作（選配）

- 新增 `utils/platform.ts`（`isTouchLikely`：觸控裝置或視窗寬 < 900 才判定為手機／小螢幕）。
- 新增 `systems/VirtualInput.ts`（虛擬輸入狀態）與 `systems/TouchControls.ts`（左右／跳／衝刺／互動半透明圓形按鈕，置於畫面下方兩側、不遮擋中央）。
- PlayerController／CollisionSystem 讀輸入時合併鍵盤與 VirtualInput；桌機虛擬輸入恆為 false，鍵盤操作完全不變。
- 觸控按鈕僅在手機／觸控／小螢幕出現；桌機不建立。支援多點觸控（方向 + 動作同時）。
- UIScene 能力標籤在桌機附上鍵盤提示（二段跳 [Space]／衝刺 [Shift]／牆跳 [Space+牆]），觸控模式則隱藏。

### HUD／關卡調整

- 能力改以圖示呈現（二段跳／衝刺／牆跳），未取得時變暗、取得後亮燈（白框全亮）。
- 鑰匙改以白點顯示（數量 = keyCount）。
- 移除玩家依狀態變色（`applyStateVisual`），玩家維持單一顏色。
- 教學關卡二段跳高台由 3.5u 降為 3u（降一階 0.5u），略降嚴苛度；對應道具與 checkpoint 一併下移。
- 備註：一格 tile = 0.5 unit = 54 px。

### Phase 18：視覺回饋與動畫 placeholder

- 新增 `utils/effects.ts`（fadeIn／burst／pulseLoop／popOnce）與 `utils/sfx.ts`（音效掛勾，無音檔時安靜跳過、不硬塞無效路徑）。
- 玩家依 PlayerState 套用顏色（idle／run／jump／fall／dash／wall_slide 各不同）。
- 死亡：原地碎裂噴發；重生：淡入。
- 能力道具持續脈動；checkpoint 亮起與開關切換有彈跳回饋；門開啟改為淡出。
- 死亡／通關保留音效呼叫點（目前無音檔，不產生載入錯誤）。

### Phase 17：Debug Overlay

- 新增 `systems/DebugOverlay.ts`：按 F3 開關（預設關閉），顯示 state、座標、速度（unit／unit-s）、grounded、touchingWall、wallSliding、coyote／buffer 計時、airJumpsUsed／airDashesUsed、dashReady、FPS。
- PlayerController 新增 `currentState` getter，由物理狀態推導 PlayerState（idle／run／jump／fall／dash／wall_slide）。
- 純 Phaser 文字、無外部 library；關閉時 update 直接跳出，不影響正式遊玩；面板置於 HUD 下方避免重疊。

### Phase 16：GameState 與通關流程

- `GameState` 擴充為中央進度記錄：死亡次數、鑰匙數、已解鎖能力、目前存檔點 id、目前區域、是否通關，提供 `snapshot()` 一次查詢。
- 終點改為實體 sensor（由 InteractionSystem 建立，LevelSystem 不再另畫標記）；抵達終點 → CollisionSystem 觸發 `onGoalReached` → 進入通關畫面。
- GameOverScene 顯示 CLEAR + 死亡次數 + 耗時；按 R 重新開始直接重啟 GameScene。
- 本專案無 Game Over：死亡只重生不淘汰（killPlayer 行為不變）。
- 重來清乾淨：新 GameState／AbilitySystem 重置 registry，UIScene 於 SHUTDOWN 解除 registry 監聽（實測監聽數 0→1 不累積）。
- checkpoint 啟用時一併記錄 `gameState.checkpointId`；G 鍵除錯導線改走與抵達終點相同的通關流程。

### Phase 15：能力拾取與教學關卡

- 能力改為「撿到道具才解鎖」：移除 GameScene 的預設全開；二段跳／衝刺／牆跳皆由場上道具解鎖（牆跳一併給牆滑）。
- 新增 `entities/AbilityPickup.ts`：道具一律以圓形呈現，不同能力不同顏色（`ABILITY_PICKUP_COLORS`：二段跳藍／衝刺黃／牆跳綠）。
- InteractionSystem 建立 ability_pickup；CollisionSystem 加入拾取 overlap → 解鎖並發送 `ability:unlocked`。
- 新增 `TUTORIAL_LEVEL`（50×20）並改由 GameScene 使用：路線依能力設計——
  - 起點撿【二段跳】→ 3.5u 高台（單跳 2.2u 上不去）撿【衝刺】
  - → 6u 缺口（一般跳跨不過）撿【牆跳】→ 11u 垂直通道（需牆跳爬升）→ 終點。
- 地面與牆一律用相同格狀地板圖；HUD 顯示已解鎖能力（讀 registry 即時刷新）。

### Phase 14：抽出 CollisionSystem（純整理，行為不變）

- 新增 `systems/CollisionSystem.ts`：集中所有碰撞判斷——玩家 vs 地面／移動平台／門（阻擋）、vs 陷阱／掉落深淵（致死）、vs 鑰匙（拾取）／checkpoint（啟用）、以及靠近按 E 開門／切換開關。
- CollisionSystem 發送事件 `player:died` / `key:changed` / `door:opened` / `checkpoint:activated`；死亡的實際重生仍交回 GameScene 的 `killPlayer`，維持原行為。
- `InteractionSystem` 精簡為「只建立互動物件」，移除碰撞／overlap／E 判斷與 update()。
- GameScene 移除散落的 collider/overlap 與掉落判定，改由 CollisionSystem 統一處理，明顯變乾淨。
- 回歸驗證：踩地、key、E 開門、開關、spike／pit 死亡重生、移動平台載人皆與整理前一致。

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
