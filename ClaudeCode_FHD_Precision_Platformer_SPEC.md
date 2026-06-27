# Claude Code 專案 SPEC：FHD 2D 精準平台跳躍遊戲（Precision Platformer · 到達終點通關）

> 文件用途：這份 SPEC 是給 **Claude Code** 依序執行的專案規格文件。  
> 目標是建立一款以 **Phaser + Vite + TypeScript** 製作的 **FHD 1920×1080 2D 精準平台跳躍網頁遊戲（Precision Platformer，Celeste-like，無敵人、無戰鬥）**，並透過 **GitHub Actions 自動部署到 GitHub Pages**。

---

## 0. 專案總覽

### 0.1 遊戲類型

```txt
2D Precision Platformer（精準平台跳躍，Celeste-like）
FHD 平台跳躍 × 關卡探索 × 物理手感 × Tilemap 機關 × 到達終點通關（無敵人、無戰鬥）
```

本專案不是橫向卷軸射擊，也不是俯視角倖存者。  
本專案重點是：

```txt
玩家手感、跳躍物理、碰撞容錯、Tilemap 關卡、探索機關、多檔案重構與除錯。
```

### 0.2 對應 AI 工具

```txt
Claude Code
```

Claude Code 這座專案的教學價值是讓學生練習：

1. 把複雜 PlayerController 拆成可維護模組
2. 用 AI 協助調整跳躍手感
3. 用 AI 檢查碰撞、Tilemap、Camera 問題
4. 用 AI 重構 GameScene，避免所有邏輯塞在同一檔案
5. 用 AI 反覆執行 build / test / debug
6. 用 Git 留下階段性修改紀錄

---

## 1. 共同解析度與單位制

三座遊戲專案共同使用相同標準。

```ts
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;
export const UNIT = GAME_HEIGHT * 0.1; // 108 px
```

定義：

```txt
1 距離單位 = 畫面高度 10% = 108 px
```

因此：

```txt
畫面寬度 = 17.78 units
畫面高度 = 10 units
```

### 1.1 單位換算

```ts
export function u(value: number): number {
  return value * UNIT;
}

export function pxToUnit(value: number): number {
  return value / UNIT;
}
```

### 1.2 速度單位

所有速度必須優先使用：

```txt
unit / second
```

例如：

| 設定 | unit/s | px/s |
|---|---:|---:|
| 慢走 | 2.5 | 270 |
| 一般奔跑 | 5.5 | 594 |
| 衝刺 | 16.7 | 1803.6 |
| 最大下落 | 14 | 1512 |

### 1.3 自適應顯示

遊戲邏輯解析度固定為 1920×1080。  
實際顯示以 Phaser Scale Manager 等比例縮放。

建議：

```ts
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
}
```

要求：

- PC / Mobile 皆可等比例顯示
- 手機可以 letterbox
- 遊戲邏輯座標不可因螢幕比例改變
- UI 使用 FHD 邏輯座標定位
- Mobile 觸控按鈕為選配，不能破壞鍵盤操作

---

## 2. 最終完成目標

完成一款可公開部署的 FHD 2D 精準平台跳躍遊戲（Precision Platformer），具備：

1. 1920×1080 FHD 邏輯解析度
2. 1 unit = 108 px 的標準化單位制
3. 可左右移動、跳躍、可變跳高
4. Coyote Time 與 Jump Buffer
5. 二段跳
6. 空中衝刺 Dash
7. 牆滑與牆跳
8. Tilemap 地形碰撞
9. Camera 跟隨與關卡邊界
10. 鑰匙、門、開關、移動平台、陷阱
11. Checkpoint 與死亡重生
12. Debug overlay 顯示物理狀態
13. 可 `npm run build`
14. 可 push 到 GitHub 後自動部署到 GitHub Pages

---

## 3. 遊戲設計概念

### 3.1 核心玩法

```txt
玩家在橫向平台關卡中探索
→ 透過跳躍、二段跳、牆跳、衝刺通過地形
→ 啟動開關、取得鑰匙、打開門
→ 避開陷阱（spike / saw / pit）
→ 抵達終點即通關
```

### 3.2 關卡長度

MVP 建議：

```txt
單一關卡：約 3–5 分鐘可完成
```

正式版可擴充：

```txt
3 個區域：教學區、探索區、挑戰區
```

### 3.3 遊戲視角

```txt
2D side-view
橫向平台視角
```

不是 Top-down，也不是 STG。

---

## 4. 世界與 Tilemap 規格

### 4.1 世界尺寸

MVP 世界建議：

```txt
World Width：80 units = 8640 px
World Height：20 units = 2160 px
```

進階版本：

```txt
World Width：120 units = 12960 px
World Height：30 units = 3240 px
```

### 4.2 Tile 尺寸

建議 tile size：

```txt
0.5 unit = 54 px
```

因此 FHD 畫面：

```txt
1920 / 54 ≈ 35.56 tiles
1080 / 54 = 20 tiles
```

這個尺寸適合平台遊戲：

- 角色高度可接近 1 unit
- 平台厚度 0.5 unit
- 地形可讀性高
- Tilemap 不會過於細碎

### 4.3 Tile 類型

| tile id | 名稱 | 行為 |
|---|---|---|
| ground | 地面 | 可站立，可碰撞 |
| one_way | 單向平台 | 可從下方穿過，上方站立 |
| spike | 尖刺 | 接觸即死亡並重生到 checkpoint |
| water | 水 / 毒池 | 減速或持續傷害，選配 |
| ladder | 梯子 | 可攀爬，選配 |
| wall | 牆面 | 可牆滑 / 牆跳 |
| breakable | 可破壞牆 | 進階 |
| goal | 終點 | 通關 |

MVP 必做：

```txt
ground、one_way、spike、wall、goal
```

---

## 5. 玩家尺寸與碰撞盒

### 5.1 玩家視覺尺寸

```txt
Visual Width：0.7 unit = 75.6 px
Visual Height：1.0 unit = 108 px
```

### 5.2 玩家碰撞盒

```txt
Collider Width：0.45 unit = 48.6 px
Collider Height：0.85 unit = 91.8 px
```

原因：

- 視覺比碰撞盒稍大，降低平台遊戲挫折感
- 腳底碰撞需穩定
- 左右碰撞不要太寬，避免擦邊卡住

### 5.3 玩家起始位置

```txt
x = 2 units
y = 14 units
```

實際位置需依關卡地形微調。

---

## 6. 玩家移動物理規格

本專案的核心是平台跳躍手感。  
所有數值都以 unit/s 或 unit/s² 設計。

### 6.1 基礎水平移動

| 參數 | 數值 | 說明 |
|---|---:|---|
| maxRunSpeed | 5.5 unit/s | 最大水平速度 |
| groundAcceleration | 35 unit/s² | 地面加速度 |
| groundDeceleration | 40 unit/s² | 地面減速度 |
| airAcceleration | 22 unit/s² | 空中加速度 |
| airDeceleration | 10 unit/s² | 空中減速度 |
| turnAcceleration | 50 unit/s² | 反向轉身加速度 |

### 6.2 重力與下落

| 參數 | 數值 | 說明 |
|---|---:|---|
| gravity | 28 unit/s² | 基礎重力 |
| maxFallSpeed | 14 unit/s | 最大下落速度 |
| fastFallSpeed | 18 unit/s | 按下方向鍵時快速下落，選配 |
| apexGravityMultiplier | 0.75 | 跳躍頂點附近降低重力，增加滯空感 |
| fallGravityMultiplier | 1.25 | 下落時略增重力，增加俐落感 |

### 6.3 跳躍

| 參數 | 數值 | 說明 |
|---|---:|---|
| jumpHeight | 2.2 units | 標準跳躍高度 |
| jumpVelocity | 約 11.1 unit/s | 可由 gravity 與高度推導 |
| minJumpHeight | 0.9 unit | 放開跳躍鍵後的最低跳高 |
| jumpCutMultiplier | 0.45 | 提早放開跳躍鍵時削減 y velocity |

跳躍速度可用公式推導：

```txt
jumpVelocity = sqrt(2 × gravity × jumpHeight)
```

以 gravity = 28，jumpHeight = 2.2 計算：

```txt
sqrt(2 × 28 × 2.2) ≈ 11.1 unit/s
```

### 6.4 Coyote Time

```txt
coyoteTimeMs = 100
```

玩家離開平台後 100ms 內仍可跳躍。  
用來降低邊緣跳躍挫折。

### 6.5 Jump Buffer

```txt
jumpBufferMs = 120
```

玩家在落地前 120ms 按下跳躍，落地瞬間自動跳起。  
用來改善操作容錯。

### 6.6 可變跳高

當玩家提前放開跳躍鍵：

```txt
if velocityY < 0:
  velocityY *= jumpCutMultiplier
```

目的：

- 短按 = 小跳
- 長按 = 高跳

---

## 7. 可解鎖移動能力

本專案是精準平台跳躍探索遊戲，因此移動能力可作為關卡推進門檻。

### 7.1 能力總表

| 能力 | 初始可用 | 用途 |
|---|---|---|
| 基礎跳躍 | 是 | 核心移動 |
| 二段跳 | 否 | 抵達較高平台 |
| 空中衝刺 | 否 | 穿越水平缺口 |
| 牆滑 | 否 | 靠牆下降 |
| 牆跳 | 否 | 垂直區域探索 |
| 下砸 | 否 | 破壞地板，選配 |

MVP 解鎖順序：

```txt
基礎跳躍 → 二段跳 → 空中衝刺 → 牆滑 / 牆跳 → 終點挑戰
```

### 7.2 二段跳 Double Jump

| 參數 | 數值 |
|---|---:|
| doubleJumpHeight | 1.8 units |
| doubleJumpVelocity | 約 10.0 unit/s |
| maxAirJumps | 1 |
| resetOnGround | true |

規則：

- 玩家離地後可再跳一次
- 落地後重置
- 牆跳後也可重置或不重置，MVP 建議重置一次

### 7.3 空中衝刺 Dash

| 參數 | 數值 |
|---|---:|
| dashDistance | 3 units |
| dashDuration | 0.18 s |
| dashSpeed | 16.7 unit/s |
| dashCooldown | 0.4 s |
| maxAirDashes | 1 |

規則：

- Dash 方向依輸入方向決定
- 若沒有方向輸入，預設往面向方向衝刺
- Dash 期間可暫時降低重力或關閉重力
- Dash 結束後恢復正常物理
- 落地後重置空中 Dash

### 7.4 牆滑 Wall Slide

| 參數 | 數值 |
|---|---:|
| wallSlideMaxFallSpeed | 3.5 unit/s |
| wallStickMs | 80 ms |

規則：

- 玩家貼牆且下落時進入 wall slide
- 限制最大下落速度
- 不可在地面觸發

### 7.5 牆跳 Wall Jump

| 參數 | 數值 |
|---|---:|
| wallJumpXVelocity | 6.5 unit/s |
| wallJumpYVelocity | 10.5 unit/s |
| wallJumpLockMs | 120 ms |

規則：

- 牆跳會將玩家推離牆面
- 短時間內鎖定水平輸入，避免立刻貼回牆面
- 牆跳後可恢復空中控制

### 7.6 下砸 Ground Pound，選配

| 參數 | 數值 |
|---|---:|
| groundPoundSpeed | 20 unit/s |
| shockRadius | 1.2 units |

MVP 不必做。  
可作為進階課程或作業加分項目。

---

## 8. 操作對照（無戰鬥）

本專案為純平台跳躍探索遊戲，**無敵人、無戰鬥、無攻擊**。  
玩家透過移動與跳躍能力通過地形、避開陷阱，抵達終點即通關（Celeste-like）。

### 8.1 操作

| 操作 | 功能 |
|---|---|
| ← → / A D | 左右移動 |
| Space / W / ↑ | 跳躍 / 二段跳 |
| Shift / L / C | Dash |
| E | 互動（開關、門） |
| F3 | Debug overlay 開關 |

### 8.2 死亡來源

本專案沒有 HP 概念，死亡為即時判定（與 Celeste 一致）：

| 來源 | 行為 |
|---|---|
| spike | 碰到即死亡，立即回到最近 checkpoint |
| saw | 碰到即死亡，立即回到最近 checkpoint |
| pit | 掉落深淵即死亡，立即回到最近 checkpoint |

死亡不扣血、不淘汰，只是重生到最近 checkpoint，鼓勵反覆挑戰高難度地形。

---

## 9. 探索機關

### 9.1 鑰匙 Key

規則：

- 玩家取得 key 後，UI 顯示 key count
- key 可打開 locked door
- key 可為單一消耗品

### 9.2 門 Door

門類型：

| 類型 | 條件 |
|---|---|
| locked_door | 需要 key |
| switch_door | 需要開關啟動 |
| ability_gate | 需要特定能力才能通過 |

### 9.3 開關 Switch

類型：

| 類型 | 行為 |
|---|---|
| toggle | 按一次切換狀態 |
| timed | 啟動後一段時間內有效 |
| pressure | 站上去時有效 |

MVP：

```txt
toggle switch
```

### 9.4 移動平台 Moving Platform

| 參數 | 數值 |
|---|---:|
| speed | 1.5 unit/s |
| waitAtEnd | 0.5 s |

移動方式：

- 水平移動
- 垂直移動
- 兩點來回

玩家站在移動平台上時，需穩定跟隨平台移動。

### 9.5 陷阱 Hazard

類型：

| 類型 | 行為 |
|---|---|
| spike | 碰到即死亡並重生到 checkpoint |
| saw | 來回移動的鋸刃，碰到即死亡並重生到 checkpoint |
| pit | 掉落後死亡並重生到 checkpoint |

MVP：

```txt
spike、pit
```

---

## 10. Checkpoint 與重生

### 10.1 Checkpoint 規則

- 玩家碰到 checkpoint 後啟用
- 碰到陷阱死亡或掉落深淵時回到最近 checkpoint
- checkpoint 啟用後有視覺變化

### 10.2 死亡判定

```txt
// 掉落深淵
if player.y > worldHeight + 3 units:
  respawnAtCheckpoint()

// 碰到陷阱（spike / saw）
onHazardOverlap:
  respawnAtCheckpoint()
```

### 10.3 重生規則

重生時：

- 回到 checkpoint 座標
- 速度歸零、PlayerState 重置為 idle
- 保留已取得能力與 key 狀態，或依設計清除 temporary key

MVP 建議：

```txt
保留已取得能力
key 是否保留由門設計決定
```

---

## 11. Camera 規格

### 11.1 Camera 跟隨

- Camera 跟隨玩家
- 需設定 world bounds
- 需加入平滑跟隨

建議：

```txt
followLerpX = 0.08
followLerpY = 0.08
```

### 11.2 Camera Dead Zone，選配

可設定 dead zone 降低鏡頭晃動。

```txt
deadZoneWidth = 4 units
deadZoneHeight = 2.5 units
```

### 11.3 Camera Shake

玩家死亡、落地重擊可觸發輕微震動。

```txt
smallShake = 100 ms, intensity 0.003
largeShake = 250 ms, intensity 0.008
```

---

## 12. UI 規格

### 12.1 HUD

需顯示：

- Key count
- 已取得能力 icons
- 目前 checkpoint / 區域名稱
- 死亡次數（選配，Celeste 式統計）
- Debug 狀態，開啟時才顯示

### 12.2 Debug Overlay

按 F3 開關。

Debug 顯示：

```txt
x, y position in unit
velocityX, velocityY in unit/s
isGrounded
isTouchingWall
isWallSliding
canCoyoteJump
jumpBufferRemaining
airJumpCount
canDash
currentState
FPS / frame time
```

這是 Claude Code 專案非常重要的教學點。  
平台遊戲手感除錯必須可視化狀態。

---

## 13. 狀態機設計

### 13.1 PlayerState

```ts
export type PlayerState =
  | "idle"
  | "run"
  | "jump"
  | "fall"
  | "double_jump"
  | "dash"
  | "wall_slide"
  | "wall_jump"
  | "dead";
```

### 13.2 狀態切換重點

- dash 優先級高於一般移動
- dead 最高優先級
- wall_slide 只在空中且貼牆時成立
- coyote jump 只在離地短時間內成立
- jump buffer 只保存短時間輸入

---

## 14. 建議專案架構

```txt
claude-platform-act-game/
├─ public/
│  └─ assets/
│     ├─ sprites/
│     ├─ tilesets/
│     ├─ maps/
│     └─ audio/
├─ src/
│  ├─ main.ts
│  ├─ styles.css
│  └─ game/
│     ├─ config/
│     │  └─ gameConfig.ts
│     ├─ scenes/
│     │  ├─ BootScene.ts
│     │  ├─ MenuScene.ts
│     │  ├─ GameScene.ts
│     │  ├─ UIScene.ts
│     │  └─ GameOverScene.ts
│     ├─ entities/
│     │  ├─ Player.ts
│     │  ├─ Door.ts
│     │  ├─ Switch.ts
│     │  ├─ MovingPlatform.ts
│     │  ├─ Checkpoint.ts
│     │  └─ Hazard.ts
│     ├─ systems/
│     │  ├─ PlayerController.ts
│     │  ├─ PlayerPhysics.ts
│     │  ├─ AbilitySystem.ts
│     │  ├─ CollisionSystem.ts
│     │  ├─ LevelSystem.ts
│     │  ├─ InteractionSystem.ts
│     │  ├─ CheckpointSystem.ts
│     │  ├─ CameraSystem.ts
│     │  ├─ DebugOverlay.ts
│     │  └─ GameState.ts
│     ├─ data/
│     │  ├─ playerPhysics.ts
│     │  ├─ abilities.ts
│     │  ├─ interactables.ts
│     │  ├─ levels.ts
│     │  └─ tiles.ts
│     ├─ types/
│     │  ├─ PlayerTypes.ts
│     │  ├─ PhysicsTypes.ts
│     │  ├─ AbilityTypes.ts
│     │  ├─ LevelTypes.ts
│     │  └─ GameTypes.ts
│     └─ utils/
│        ├─ units.ts
│        ├─ math.ts
│        ├─ debug.ts
│        └─ validateData.ts
├─ docs/
│  ├─ ai-prompts-log.md
│  ├─ playtest-report.md
│  └─ tuning-notes.md
├─ .github/
│  └─ workflows/
│     └─ deploy.yml
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

---

## 15. TypeScript 型別草案

### 15.1 PhysicsTypes.ts

```ts
export interface PlayerPhysicsConfig {
  maxRunSpeedUnit: number;
  groundAccelerationUnit: number;
  groundDecelerationUnit: number;
  airAccelerationUnit: number;
  airDecelerationUnit: number;
  turnAccelerationUnit: number;
  gravityUnit: number;
  maxFallSpeedUnit: number;
  jumpHeightUnit: number;
  jumpVelocityUnit: number;
  jumpCutMultiplier: number;
  coyoteTimeMs: number;
  jumpBufferMs: number;
  apexGravityMultiplier: number;
  fallGravityMultiplier: number;
}
```

### 15.2 AbilityTypes.ts

```ts
export type AbilityId =
  | "double_jump"
  | "dash"
  | "wall_slide"
  | "wall_jump"
  | "ground_pound";

export interface AbilityState {
  unlocked: Record<AbilityId, boolean>;
  airJumpsUsed: number;
  airDashesUsed: number;
}
```

### 15.3 PlayerTypes.ts

```ts
export type PlayerState =
  | "idle"
  | "run"
  | "jump"
  | "fall"
  | "double_jump"
  | "dash"
  | "wall_slide"
  | "wall_jump"
  | "dead";

export interface PlayerStats {
  // 無戰鬥版本：玩家無 HP，碰陷阱 / 掉落即死亡重生
  // 僅保留統計用欄位（選配）
  deaths: number;
}
```

### 15.4 LevelTypes.ts

```ts
export type InteractableType =
  | "key"
  | "locked_door"
  | "switch"
  | "switch_door"
  | "checkpoint"
  | "ability_pickup"
  | "goal";

export interface LevelObjectConfig {
  id: string;
  type: InteractableType;
  xUnit: number;
  yUnit: number;
  widthUnit?: number;
  heightUnit?: number;
  requiredKeyId?: string;
  grantsAbilityId?: string;
  targetId?: string;
}
```

---

## 16. 資料檔草案

### 16.1 playerPhysics.ts

```ts
import type { PlayerPhysicsConfig } from "../types/PhysicsTypes";

export const PLAYER_PHYSICS: PlayerPhysicsConfig = {
  maxRunSpeedUnit: 5.5,
  groundAccelerationUnit: 35,
  groundDecelerationUnit: 40,
  airAccelerationUnit: 22,
  airDecelerationUnit: 10,
  turnAccelerationUnit: 50,
  gravityUnit: 28,
  maxFallSpeedUnit: 14,
  jumpHeightUnit: 2.2,
  jumpVelocityUnit: 11.1,
  jumpCutMultiplier: 0.45,
  coyoteTimeMs: 100,
  jumpBufferMs: 120,
  apexGravityMultiplier: 0.75,
  fallGravityMultiplier: 1.25,
};

export const DASH_CONFIG = {
  dashDistanceUnit: 3,
  dashDurationMs: 180,
  dashCooldownMs: 400,
  maxAirDashes: 1,
} as const;

export const WALL_CONFIG = {
  wallSlideMaxFallSpeedUnit: 3.5,
  wallStickMs: 80,
  wallJumpXVelocityUnit: 6.5,
  wallJumpYVelocityUnit: 10.5,
  wallJumpLockMs: 120,
} as const;
```

### 16.2 abilities.ts

```ts
export const ABILITIES = [
  {
    id: "double_jump",
    name: "Double Jump",
    description: "Allows one additional jump while airborne.",
  },
  {
    id: "dash",
    name: "Air Dash",
    description: "Dash horizontally or diagonally in midair.",
  },
  {
    id: "wall_slide",
    name: "Wall Slide",
    description: "Slide down walls at reduced fall speed.",
  },
  {
    id: "wall_jump",
    name: "Wall Jump",
    description: "Jump away from walls to climb vertical shafts.",
  },
] as const;
```

---

# 17. Claude Code 執行總規則

Claude Code 每次執行任務時必須遵守以下規則。

## 17.1 不可一次重寫整個專案

每次只處理 SPEC 中指定 Phase。  
不要在未被要求時重構無關檔案。

## 17.2 每一階段都要先讀現有檔案

執行前先檢查：

```bash
ls
find src -maxdepth 4 -type f
cat package.json
```

必要時再讀相關檔案。

## 17.3 每一階段結束前都要執行驗收

優先執行：

```bash
npm run build
```

若有 lint 或 test script，也要執行：

```bash
npm run lint
npm run test
```

若 script 不存在，回報 package.json 中實際可用 scripts。

## 17.4 每一階段都要產出修改摘要

回覆格式：

```txt
完成階段：Phase X - 階段名稱

修改檔案：
- path/to/fileA.ts：修改原因
- path/to/fileB.ts：修改原因

驗收結果：
- npm run build：通過 / 未通過
- 其他指令：通過 / 未執行，原因

注意事項：
- 尚未處理的問題
- 下一階段建議
```

## 17.5 Git commit 原則

每個 phase 完成後建議 commit 一次。

Commit message 格式：

```txt
feat(platform): phase X - short description
```

或：

```txt
fix(platform): short bug fix description
```

---

# 18. Claude Code 依序執行任務

以下每一個 Phase 都可以單獨貼給 Claude Code 執行。

---

## Phase 0：建立或檢查 FHD Phaser 專案底座

### AI TASK 00

```txt
你是本專案的 AI coding agent。請先檢查目前 repository 狀態。

目標：
1. 確認這是一個 Phaser + Vite + TypeScript 專案。
2. 若專案尚未建立，請建立最小可運行的 Vite + TypeScript + Phaser 專案。
3. 遊戲邏輯解析度固定為 1920×1080。
4. 建立 src/game/config/gameConfig.ts，包含 GAME_WIDTH、GAME_HEIGHT、UNIT。
5. 建立 src/game/utils/units.ts，提供 u(value) 與 pxToUnit(value)。
6. Phaser scale 使用 FIT 與 CENTER_BOTH，以支援 PC / Mobile 自適應。
7. 確保 package.json 至少有 dev、build、preview scripts。
8. 確保 npm run build 可以成功。

限制：
- 不要加入平台遊戲功能，這一步只處理專案底座與解析度設定。
- 不要使用 960×540，必須使用 1920×1080。
- 後續所有速度與距離都應以 unit 設計。

預期修改：
- package.json
- tsconfig.json
- vite.config.ts
- index.html
- src/main.ts
- src/styles.css
- src/game/config/gameConfig.ts
- src/game/utils/units.ts

驗收：
- npm install 或 npm ci 可執行
- npm run build 成功
- npm run dev 可啟動開發伺服器
- Phaser game config 使用 1920×1080
```

建議 commit：

```bash
git add .
git commit -m "chore(platform): phase 0 setup fhd phaser project"
```

---

## Phase 1：建立 Scene 架構

### AI TASK 01

```txt
請建立精準平台跳躍遊戲的基本 Scene 架構。

目標：
1. 新增 BootScene、MenuScene、GameScene、UIScene、GameOverScene。
2. BootScene 負責產生 placeholder texture。
3. MenuScene 顯示標題與開始提示。
4. GameScene 暫時顯示 FHD 背景、地面 placeholder、玩家 placeholder。
5. UIScene 顯示 key count、能力狀態、死亡次數（選配）。
6. GameOverScene 顯示通關結果（Clear）。
7. main.ts 使用 Phaser.Game 啟動這些 scenes。

限制：
- 不要把所有邏輯塞在 main.ts。
- Scene 應放在 src/game/scenes。
- 遊戲尺寸使用 src/game/config/gameConfig.ts 統一管理。
- 若沒有美術素材，請用 Phaser graphics 產生 placeholder texture。

驗收：
- npm run build 成功
- npm run dev 時能看到 MenuScene
- 按 Enter 或 Space 可進入 GameScene
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 1 add scene architecture"
```

---

## Phase 2：建立資料、型別與物理參數

### AI TASK 02

```txt
請建立精準平台跳躍專案的資料驅動架構。

目標：
1. 建立 PlayerTypes、PhysicsTypes、AbilityTypes、LevelTypes、GameTypes。
2. 建立 playerPhysics.ts、abilities.ts、interactables.ts、levels.ts、tiles.ts。
3. playerPhysics.ts 必須包含：
   - maxRunSpeedUnit = 5.5
   - groundAccelerationUnit = 35
   - groundDecelerationUnit = 40
   - airAccelerationUnit = 22
   - gravityUnit = 28
   - maxFallSpeedUnit = 14
   - jumpHeightUnit = 2.2
   - jumpVelocityUnit = 11.1
   - coyoteTimeMs = 100
   - jumpBufferMs = 120
4. 建立 validateData.ts，檢查重要數值是否合理。

限制：
- 資料檔使用 TypeScript export const，不使用外部 JSON。
- 型別集中在 src/game/types。
- data 集中在 src/game/data。
- 不要在 GameScene 寫死物理數值。

驗收：
- npm run build 成功
- data 檔沒有 TypeScript 型別錯誤
- validateData 可被 BootScene 或 GameScene 呼叫
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 2 add physics data configs"
```

---

## Phase 3：實作 Player 與基礎左右移動

### AI TASK 03

```txt
請實作 Player entity 與基礎左右移動。

目標：
1. 建立 Player class。
2. 建立 PlayerController class。
3. 支援方向鍵與 A / D 左右移動。
4. 速度使用 unit/s，再轉成 px/s。
5. 支援加速度與減速度，不要瞬間切換速度。
6. 玩家不可穿過地面。
7. GameScene 使用 Player 與 PlayerController，不要直接在 GameScene 寫控制邏輯。

限制：
- Player 放在 src/game/entities/Player.ts。
- PlayerController 放在 src/game/systems/PlayerController.ts。
- 不要實作跳躍，跳躍留到 Phase 4。
- 不要把 UI 邏輯放進 Player。

驗收：
- npm run build 成功
- 玩家可左右移動
- 玩家有加減速感
- GameScene 沒有大量控制邏輯
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 3 add player horizontal movement"
```

---

## Phase 4：實作跳躍、重力與可變跳高

### AI TASK 04

```txt
請實作平台跳躍基礎手感。

目標：
1. 玩家可按 Space / W / 上方向鍵跳躍。
2. 使用 gravityUnit = 28。
3. 標準跳躍高度約 2.2 units。
4. jumpVelocityUnit 約 11.1。
5. 支援可變跳高：提早放開跳躍鍵會降低上升速度。
6. 支援最大下落速度 maxFallSpeedUnit = 14。
7. 下落時可使用 fallGravityMultiplier = 1.25。
8. 跳躍頂點附近可使用 apexGravityMultiplier = 0.75。

限制：
- 物理數值從 playerPhysics.ts 讀取。
- 不要把跳躍數值寫死在 PlayerController。
- 不要實作二段跳，二段跳留到 Phase 6。

驗收：
- npm run build 成功
- 玩家可跳躍
- 短按與長按跳躍高度不同
- 下落速度不會無限增加
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 4 add jump physics"
```

---

## Phase 5：實作 Coyote Time 與 Jump Buffer

### AI TASK 05

```txt
請改善跳躍容錯，加入 Coyote Time 與 Jump Buffer。

目標：
1. Coyote Time = 100ms。
2. 玩家離開平台後 100ms 內仍可跳躍。
3. Jump Buffer = 120ms。
4. 玩家在落地前 120ms 按下跳躍，落地瞬間自動跳起。
5. Debug overlay 或暫時 console 可檢查 coyote timer 與 jump buffer timer。

限制：
- 數值從 playerPhysics.ts 讀取。
- 不要破壞 Phase 4 的可變跳高。
- 不要實作二段跳。

驗收：
- npm run build 成功
- 平台邊緣晚按跳躍仍能跳
- 落地前預先按跳躍能接續跳
- 短按 / 長按跳躍仍有效
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 5 add coyote time and jump buffer"
```

---

## Phase 6：實作二段跳

### AI TASK 06

```txt
請實作二段跳能力。

目標：
1. 建立 AbilitySystem。
2. ability id 使用 double_jump。
3. 玩家預設可以先開啟 double_jump，方便測試。
4. 空中可再跳一次。
5. 落地後重置 airJumpsUsed。
6. UI 顯示 Double Jump 是否已解鎖。
7. 之後要能透過 ability pickup 解鎖。

限制：
- AbilitySystem 放在 src/game/systems/AbilitySystem.ts。
- 不要把 ability 狀態寫死在 Player。
- 不要實作 Dash，Dash 留到 Phase 7。

驗收：
- npm run build 成功
- 玩家可二段跳
- 落地後可再次二段跳
- UI 能顯示能力狀態
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 6 add double jump ability"
```

---

## Phase 7：實作空中衝刺 Dash

### AI TASK 07

```txt
請實作空中衝刺 Dash。

目標：
1. ability id 使用 dash。
2. 玩家按 Shift / L / C 可 Dash。
3. dashDistance = 3 units。
4. dashDuration = 0.18s。
5. dashSpeed 約 16.7 unit/s。
6. Dash 方向依輸入方向決定。
7. 沒有方向輸入時，依玩家面向方向 Dash。
8. Dash 期間可暫時關閉或降低重力。
9. 落地後重置 air dash。
10. UI 顯示 Dash 是否可用。

限制：
- Dash 數值從 playerPhysics.ts 或 dash config 讀取。
- Dash 不可讓玩家穿牆。
- Dash 狀態應與 PlayerState 整合。

驗收：
- npm run build 成功
- 玩家可 Dash
- 空中 Dash 次數有限制
- 落地後 Dash 重置
- Dash 不會破壞跳躍與二段跳
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 7 add air dash ability"
```

---

## Phase 8：實作牆滑與牆跳

### AI TASK 08

```txt
請實作牆滑與牆跳。

目標：
1. ability id 使用 wall_slide 與 wall_jump。
2. 玩家空中貼牆並下落時進入 wall_slide。
3. wallSlideMaxFallSpeed = 3.5 unit/s。
4. 玩家在 wall_slide 時按跳躍可 wall_jump。
5. wallJumpXVelocity = 6.5 unit/s。
6. wallJumpYVelocity = 10.5 unit/s。
7. wallJumpLockMs = 120ms，避免立刻貼回牆面。
8. UI 顯示 Wall Slide / Wall Jump 是否解鎖。

限制：
- 牆面判定需穩定，不要把地面誤判為牆。
- 不要讓玩家無限貼牆上升。
- 不要破壞二段跳與 Dash。

驗收：
- npm run build 成功
- 玩家可沿牆下滑
- 玩家可從牆跳開
- 牆跳方向正確
- 一般跳躍仍正常
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 8 add wall slide and wall jump"
```

---

## Phase 9：建立 Tilemap / 關卡資料架構

### AI TASK 09

```txt
請建立 Tilemap 與關卡資料架構。

目標：
1. 建立 LevelSystem。
2. 建立 tiles.ts 與 levels.ts。
3. 使用 0.5 unit = 54 px 作為 tile size。
4. 建立一個 MVP 關卡，至少包含：
   - 起點
   - 地面平台
   - 高低平台
   - 一段需要二段跳的區域
   - 一段需要 Dash 的缺口
   - 一段需要牆跳的垂直區域
   - 終點
5. 若沒有 Tiled JSON，可先用 TypeScript array 生成簡易平台。

限制：
- 不要把平台座標全部寫死在 GameScene。
- 關卡物件資料放在 levels.ts。
- LevelSystem 負責建立地形與物件。

驗收：
- npm run build 成功
- 關卡可遊玩
- Camera bounds 正確
- 玩家可站在平台上
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 9 add tilemap level system"
```

---

## Phase 10：實作 CameraSystem

### AI TASK 10

```txt
請實作 CameraSystem。

目標：
1. Camera 跟隨玩家。
2. Camera 使用 world bounds。
3. Camera 有平滑跟隨。
4. 可設定 dead zone，若實作成本高可先保留 TODO。
5. 玩家死亡或落地重擊時可呼叫 camera shake。

限制：
- CameraSystem 放在 src/game/systems/CameraSystem.ts。
- 不要把 camera 設定散落在 GameScene 各處。
- 不要讓鏡頭超出關卡邊界。

驗收：
- npm run build 成功
- 鏡頭會跟隨玩家
- 鏡頭不會超出世界邊界
- 玩家死亡時可觸發輕微 shake
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 10 add camera system"
```

---

## Phase 11：實作互動物件：鑰匙、門、開關

### AI TASK 11

```txt
請實作基本探索互動物件。

目標：
1. 建立 InteractionSystem。
2. 建立 Key、Door、Switch 或共用 Interactable entity。
3. 玩家碰到 key 後取得 key count。
4. locked door 需要 key 才能打開。
5. switch 可切換 switch_door 狀態。
6. UI 顯示 key count。
7. 關卡中至少有一個 key door 與一個 switch door。

限制：
- 互動物件資料從 levels.ts 或 interactables.ts 讀取。
- 不要在 GameScene 寫死 key / door 行為。
- E 鍵可作為互動鍵；碰撞即拾取 key。

驗收：
- npm run build 成功
- 玩家可取得 key
- key door 可被打開
- switch 可控制門或平台
- UI key count 正確
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 11 add keys doors and switches"
```

---

## Phase 12：實作 Checkpoint 與重生

### AI TASK 12

```txt
請實作 Checkpoint 與死亡重生。

目標：
1. 建立 Checkpoint entity。
2. 建立 CheckpointSystem。
3. 玩家碰到 checkpoint 後啟用。
4. 玩家掉落深淵或碰到 spike / saw 時回到最近 checkpoint。
5. 重生後速度歸零、PlayerState 重置為 idle。
6. checkpoint 啟用後有視覺變化。

限制：
- CheckpointSystem 放在 src/game/systems/CheckpointSystem.ts。
- 不要讓 Player 自己管理所有重生邏輯。
- 掉落判定使用 worldHeight + 3 units。

驗收：
- npm run build 成功
- 玩家碰到 checkpoint 後可記錄位置
- 掉落後回到 checkpoint
- 重生後不會立即再死
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 12 add checkpoints and respawn"
```

---

## Phase 13：實作陷阱與移動平台

### AI TASK 13

```txt
請實作陷阱與移動平台。

目標：
1. 建立 Hazard entity。
2. 支援 spike 與 pit。
3. spike 接觸玩家造成傷害或重生。
4. 建立 MovingPlatform entity。
5. 移動平台支援兩點來回。
6. 玩家站在移動平台上時需穩定跟隨平台移動。
7. 關卡中加入至少一個 spike 區與一個 moving platform。

限制：
- MovingPlatform 放在 src/game/entities/MovingPlatform.ts。
- Hazard 放在 src/game/entities/Hazard.ts。
- 不要讓移動平台造成玩家抖動或穿透。

驗收：
- npm run build 成功
- spike 可傷害玩家
- pit 可讓玩家重生
- 玩家可穩定站在 moving platform 上
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 13 add hazards and moving platforms"
```

---

## Phase 14：抽出 CollisionSystem

### AI TASK 14

```txt
請將碰撞邏輯抽出為 CollisionSystem。

目標：
1. 建立 CollisionSystem class。
2. 集中處理：
   - player vs ground
   - player vs one-way platform
   - player vs hazards（spike / saw → 死亡重生）
   - player vs pit / 掉落深淵 → 死亡重生
   - player vs pickups
   - player vs doors / switches
3. GameScene 只負責呼叫 CollisionSystem.update()。
4. 碰撞事件發送：
   - player:died
   - player:respawn
   - ability:unlocked
   - key:changed
   - door:opened

限制：
- CollisionSystem 放在 src/game/systems/CollisionSystem.ts。
- 不要讓 UI 直接依賴 CollisionSystem。
- 保持現有功能不退化。

驗收：
- npm run build 成功
- 玩家移動與跳躍不退化
- 互動物件正常
- 碰陷阱 / 掉落會重生
- GameScene 明顯變乾淨
```

建議 commit：

```bash
git add .
git commit -m "refactor(platform): phase 14 extract collision system"
```

---

## Phase 15：實作能力拾取與探索門檻

### AI TASK 15

```txt
請實作 ability pickup 與探索門檻。

目標：
1. 關卡中加入 ability pickup。
2. 玩家取得 double_jump pickup 後才可二段跳。
3. 玩家取得 dash pickup 後才可 Dash。
4. 玩家取得 wall_slide / wall_jump pickup 後才可牆滑牆跳。
5. 關卡路線設計需讓能力有實際用途：
   - double_jump 區域
   - dash 缺口
   - wall_jump 垂直通道
6. UI 顯示已解鎖能力。

限制：
- 不要預設全部能力都開啟，除了測試模式可用 debug flag。
- AbilitySystem 管理能力狀態。
- 關卡資料應能指定 grantsAbilityId。

驗收：
- npm run build 成功
- 沒拿到能力前不能使用該能力
- 拿到能力後立即可用
- 關卡可用能力推進
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 15 add ability pickups and gates"
```

---

## Phase 16：GameState 與通關流程

### AI TASK 16

```txt
請整理 GameState 與完整遊戲流程。

目標：
1. 建立 GameState class 或 module。
2. 管理：
   - deaths（死亡次數，選配統計）
   - keyCount
   - unlockedAbilities
   - checkpointId
   - currentArea
   - isVictory
3. 玩家抵達 goal 後進入 GameOverScene 並顯示 Clear（可一併顯示死亡次數與耗時）。
4. 本專案無 Game Over：玩家死亡一律重生到最近 checkpoint，不會淘汰。
5. GameOverScene（通關畫面）可按 R 重新開始。
6. 重新開始時清除舊事件 listener 與舊狀態。

限制：
- GameState 放在 src/game/systems/GameState.ts。
- UI 不應直接修改 GameState，只接收事件或讀取 getter。
- 不要破壞現有 Scene 流程。

驗收：
- npm run build 成功
- 抵達終點會通關
- 可重新開始遊戲
- 重新開始後狀態正確
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 16 add game state flow"
```

---

## Phase 17：Debug Overlay 與物理調參工具

### AI TASK 17

```txt
請加入 Debug Overlay 與物理調參輔助。

目標：
1. 建立 DebugOverlay。
2. 按 F3 開關。
3. 顯示：
   - player x/y unit
   - velocityX / velocityY unit/s
   - isGrounded
   - isTouchingWall
   - isWallSliding
   - coyoteTimer
   - jumpBufferTimer
   - airJumpsUsed
   - airDashesUsed
   - current PlayerState
   - FPS 或 frame time
4. 可選：顯示 player collider、ground check、wall check、hazard 重疊判定。

限制：
- Debug overlay 預設關閉。
- 不要引入重型 debug library。
- 不要影響正式遊玩。

驗收：
- npm run build 成功
- F3 可切換 debug overlay
- Debug 資訊能幫助調整跳躍手感
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 17 add physics debug overlay"
```

---

## Phase 18：視覺效果、動畫 placeholder、操作回饋

### AI TASK 18

```txt
請加入最小視覺回饋與動畫 placeholder。

目標：
1. 玩家 idle / run / jump / fall / dash / wall_slide 有簡單視覺差異。
2. 死亡時玩家有閃爍或碎裂效果，重生時有淡入。
3. checkpoint 啟用時有亮起效果。
4. ability pickup 有明顯圖示或光效。
5. door 開啟、switch 觸發有視覺回饋。
6. 若沒有音效檔，保留 audio hooks，但不要硬塞無效路徑造成錯誤。
7. BootScene 產生必要 placeholder texture，避免缺圖錯誤。

限制：
- 不要引入大型外部素材。
- 視覺效果應集中在 entity 或 effects helper。
- 不要讓特效破壞核心 gameplay。

驗收：
- npm run build 成功
- 主要狀態可用視覺區分
- 沒有 missing texture error
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 18 add visual feedback"
```

---

## Phase 19：Mobile 觸控操作選配

### AI TASK 19

```txt
請加入簡易觸控操作作為選配功能。

目標：
1. 手機或平板可用虛擬左右按鈕移動。
2. 可用觸控按鈕跳躍。
3. 可用觸控按鈕 Dash。
4. 可用觸控按鈕互動（E）。
5. 桌機鍵盤操作維持不變。
6. 觸控 UI 僅在 pointer/touch 環境或小螢幕顯示。
7. 觸控 UI 不可遮擋主要遊戲畫面過多。

限制：
- 不要引入外部 UI framework。
- 觸控控制可用 Phaser graphics 建立。
- 不要破壞鍵盤操作。
- 遊戲邏輯座標仍維持 FHD 1920×1080。

驗收：
- npm run build 成功
- 桌機鍵盤可用
- 觸控裝置可移動、跳躍、Dash、互動
```

建議 commit：

```bash
git add .
git commit -m "feat(platform): phase 19 add mobile touch controls"
```

---

## Phase 20：GitHub Pages 自動部署

### AI TASK 20

```txt
請加入 GitHub Pages 自動部署設定。

目標：
1. 新增 .github/workflows/deploy.yml。
2. push 到 main 時自動執行 build。
3. build 後部署 dist 到 GitHub Pages。
4. vite.config.ts 設定正確 base path，支援 GitHub Pages repo path。
5. README.md 補上部署說明。

限制：
- 不要使用需要額外 token 的第三方 deploy action。
- 使用 GitHub 官方 Pages actions：
  - actions/configure-pages
  - actions/upload-pages-artifact
  - actions/deploy-pages
- workflow 要有正確 permissions：
  - contents: read
  - pages: write
  - id-token: write

預期修改：
- .github/workflows/deploy.yml
- vite.config.ts
- README.md

驗收：
- npm run build 成功
- workflow yaml 語法合理
- dist 為部署目錄
```

### deploy.yml 建議內容

```yml
name: Deploy Game to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build game
        run: npm run build

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload GitHub Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### vite.config.ts 建議設定

```ts
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_REPOSITORY
    ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
    : "/",
});
```

建議 commit：

```bash
git add .
git commit -m "ci(platform): phase 20 deploy to github pages"
```

---

## Phase 21：課程交付文件整理

### AI TASK 21

```txt
請整理本專案的課程交付文件。

目標：
1. 更新 README.md。
2. 新增 docs/ai-prompts-log.md。
3. 新增 docs/playtest-report.md。
4. 新增 docs/tuning-notes.md。
5. README 需包含：
   - 專案簡介
   - FHD 1920×1080 與 unit 制說明
   - 操作方式
   - 玩家能力說明
   - 開發指令
   - 部署方式
   - 遊戲系統摘要
   - 已知問題
6. ai-prompts-log.md 需提供學生可填寫的 prompt 紀錄表格。
7. playtest-report.md 需提供測試紀錄格式。
8. tuning-notes.md 需提供跳躍手感調整紀錄格式。

限制：
- 不要把課程文件寫成廣告文。
- 文件要適合學生交作業。
- 不要假裝已經完成尚未完成的功能。
- 內容需根據目前實際程式狀態撰寫。

驗收：
- npm run build 成功
- README 可讓新使用者知道如何執行專案
- docs 文件可作為課程交付物
```

建議 commit：

```bash
git add .
git commit -m "docs(platform): phase 21 add course deliverables"
```

---

# 19. 最終驗收清單

## 19.1 Resolution / Unit

- [ ] 遊戲邏輯解析度為 1920×1080
- [ ] 1 unit = 108 px
- [ ] 所有速度以 unit/s 設計
- [ ] PC / Mobile 顯示可自適應
- [ ] UI 在 FHD 與縮放後仍可讀

## 19.2 Player Movement

- [ ] 玩家可左右移動
- [ ] 移動有加速度與減速度
- [ ] 玩家可跳躍
- [ ] 短按 / 長按跳躍高度不同
- [ ] 最大下落速度有效
- [ ] Coyote Time 有效
- [ ] Jump Buffer 有效
- [ ] 二段跳有效
- [ ] Dash 有效
- [ ] 牆滑有效
- [ ] 牆跳有效

## 19.3 Level / Exploration

- [ ] 有 Tilemap 或資料驅動平台關卡
- [ ] 有起點與終點
- [ ] 有高低平台
- [ ] 有二段跳區域
- [ ] 有 Dash 缺口
- [ ] 有牆跳垂直區域
- [ ] 有 key door
- [ ] 有 switch door
- [ ] 有 checkpoint
- [ ] 有 spike / pit
- [ ] 有 moving platform
- [ ] 碰到 spike / saw 會死亡重生
- [ ] 掉落深淵會死亡重生
- [ ] 抵達終點即通關

## 19.4 Debug / Engineering

- [ ] `npm run build` 成功
- [ ] GameScene 沒有過度肥大
- [ ] PlayerController、PlayerPhysics、AbilitySystem、CollisionSystem 分工清楚
- [ ] Debug overlay 可顯示關鍵物理狀態
- [ ] 無 missing texture error
- [ ] 重啟遊戲不會殘留舊 listener

## 19.5 Git / Deploy

- [ ] Git commit 至少 10 次以上
- [ ] GitHub repository 可公開檢視
- [ ] GitHub Pages 已啟用
- [ ] GitHub Actions 可成功部署
- [ ] README 有遊戲網址
- [ ] docs 文件完整

---

# 20. 給學生的 Claude Code 使用建議

## 20.1 每次任務要小

不建議說：

```txt
幫我做一款完整平台跳躍遊戲。
```

建議說：

```txt
請只完成 Phase 5：Coyote Time 與 Jump Buffer。
不要修改關卡、UI。
完成後執行 npm run build，並列出修改檔案。
```

## 20.2 每次修改後檢查 diff

建議指令：

```bash
git diff
npm run build
npm run dev
```

## 20.3 Build 失敗修正 Prompt

```txt
npm run build 失敗，錯誤如下：

[貼上錯誤訊息]

請只修正這個 build error。
不要重構無關檔案。
修正後再次執行 npm run build。
```

## 20.4 跳躍手感錯誤修正 Prompt

```txt
目前跳躍手感不正確。

問題：
1. 短按跳躍和長按跳躍高度差異不明顯。
2. 玩家下落時太慢。
3. 平台邊緣跳躍太嚴格。

請只檢查 PlayerController、PlayerPhysics 與 playerPhysics.ts。
保留以下規格：
- jumpHeightUnit 約 2.2
- gravityUnit = 28
- coyoteTimeMs = 100
- jumpBufferMs = 120

請不要修改關卡與 UI。
```

## 20.5 牆跳錯誤修正 Prompt

```txt
目前牆跳容易立刻貼回牆面，請修正。

正確規則：
1. wallJump 後水平速度應推離牆面。
2. wallJumpLockMs = 120ms 內不要讓水平輸入立刻抵消推力。
3. wall_slide 只能在空中且貼牆時發生。
4. 不要讓玩家在地面時觸發 wall_slide。

請只修改 PlayerController / AbilitySystem / collision checks。
```

---

# 21. 教師錄播建議切點

| 影片 | 對應 Phase | 主題 | 建議片長 |
|---|---|---|---:|
| 1 | Phase 0–2 | FHD 專案底座、單位制、物理資料 | 30–45 分鐘 |
| 2 | Phase 3–5 | 左右移動、跳躍、Coyote / Buffer | 60–75 分鐘 |
| 3 | Phase 6–8 | 二段跳、Dash、牆滑牆跳 | 60–75 分鐘 |
| 4 | Phase 9–10 | Tilemap / 關卡、Camera | 45–60 分鐘 |
| 5 | Phase 11–13 | 鑰匙、門、開關、Checkpoint、陷阱 | 60–75 分鐘 |
| 6 | Phase 14–16 | CollisionSystem、能力拾取門檻、GameState 通關流程 | 45–60 分鐘 |
| 7 | Phase 17–19 | Debug overlay、視覺回饋、Mobile 控制 | 45–60 分鐘 |
| 8 | Phase 20–21 | GitHub Pages 部署與交付文件 | 30–45 分鐘 |

總錄播時數：約 7–9 小時。  
學生實作時間：約 12–24 小時。

---

# 22. 規則摘要

```txt
解析度：
- 1920×1080
- 1 unit = 10% 畫面高 = 108 px

世界：
- MVP World = 80 × 20 units
- Tile size = 0.5 unit = 54 px

玩家：
- Visual = 0.7 × 1.0 units
- Collider = 0.45 × 0.85 units
- maxRunSpeed = 5.5 unit/s
- gravity = 28 unit/s²
- maxFallSpeed = 14 unit/s
- jumpHeight = 2.2 units
- jumpVelocity ≈ 11.1 unit/s
- coyoteTime = 100ms
- jumpBuffer = 120ms

能力：
- Double Jump：空中再跳一次
- Dash：3 units / 0.18s
- Wall Slide：最大下滑 3.5 unit/s
- Wall Jump：x 6.5 unit/s, y 10.5 unit/s

互動：
- Key
- Locked Door
- Switch
- Switch Door
- Checkpoint
- Spike
- Pit
- Moving Platform

死亡與通關（無戰鬥）：
- 無 HP、無敵人、無攻擊
- 碰到 spike / saw 即死亡重生
- 掉落深淵即死亡重生
- 抵達 goal 即通關

驗收：
- npm run build 成功
- 可部署 GitHub Pages
- Debug overlay 可檢查物理狀態
```
