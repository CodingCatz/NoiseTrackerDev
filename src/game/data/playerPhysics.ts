import type {
  PlayerPhysicsConfig,
  DashConfig,
  DoubleJumpConfig,
  WallConfig,
} from "../types/PhysicsTypes";

// =============================================================================
//  ★ 手感調參中樞 ★
//  這是全遊戲唯一集中放「跑多快、跳多高、重力多強」的檔案。
//  要調整玩家手感，只改這裡的數字即可，不要把物理數值寫死在任何 Scene 或系統中。
//  單位：距離 unit、速度 unit/s、加速度 unit/s²、時間 ms（1 unit = 108 px）。
// =============================================================================

/** 玩家核心物理：水平移動、重力、跳躍、容錯 */
export const PLAYER_PHYSICS: PlayerPhysicsConfig = {
  // 水平移動
  maxRunSpeedUnit: 5.5, // 最大水平速度
  groundAccelerationUnit: 35, // 地面加速
  groundDecelerationUnit: 40, // 地面減速
  airAccelerationUnit: 22, // 空中加速
  airDecelerationUnit: 10, // 空中減速
  turnAccelerationUnit: 50, // 反向轉身加速

  // 重力與下落
  gravityUnit: 28, // 基礎重力
  maxFallSpeedUnit: 14, // 最大下落速度
  apexGravityMultiplier: 0.75, // 跳躍頂點降重力，增加滯空
  apexThresholdUnit: 2.5, // |vy| 小於此值視為接近頂點
  fallGravityMultiplier: 1.25, // 下落時增重力，更俐落

  // 跳躍
  jumpHeightUnit: 2.2, // 標準跳躍高度
  jumpVelocityUnit: 11.1, // 起跳速度 ≈ sqrt(2 · 28 · 2.2)
  jumpCutMultiplier: 0.45, // 提早放開跳躍鍵的削減

  // 容錯
  coyoteTimeMs: 100, // 離地後仍可跳
  jumpBufferMs: 120, // 落地前預按跳躍
};

/** 二段跳 */
export const DOUBLE_JUMP_CONFIG: DoubleJumpConfig = {
  doubleJumpHeightUnit: 1.8,
  doubleJumpVelocityUnit: 10.0, // ≈ sqrt(2 · 28 · 1.8)
  maxAirJumps: 1,
};

/** 空中衝刺 Dash */
export const DASH_CONFIG: DashConfig = {
  dashDistanceUnit: 3,
  dashDurationMs: 180,
  dashCooldownMs: 400,
  maxAirDashes: 1,
};

/** 牆滑與牆跳 */
export const WALL_CONFIG: WallConfig = {
  wallSlideMaxFallSpeedUnit: 3.5,
  wallStickMs: 80,
  wallJumpXVelocityUnit: 6.5,
  wallJumpYVelocityUnit: 10.5,
  wallJumpLockMs: 120,
};
