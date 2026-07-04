/** 玩家核心物理參數（水平移動、重力、跳躍、容錯）。所有距離／速度以 unit 為單位。 */
export interface PlayerPhysicsConfig {
  /** 最大水平速度 unit/s */
  maxRunSpeedUnit: number;
  /** 地面加速度 unit/s² */
  groundAccelerationUnit: number;
  /** 地面減速度 unit/s² */
  groundDecelerationUnit: number;
  /** 空中加速度 unit/s² */
  airAccelerationUnit: number;
  /** 空中減速度 unit/s² */
  airDecelerationUnit: number;
  /** 反向轉身加速度 unit/s² */
  turnAccelerationUnit: number;
  /** 基礎重力 unit/s² */
  gravityUnit: number;
  /** 最大下落速度 unit/s */
  maxFallSpeedUnit: number;
  /** 標準跳躍高度 unit */
  jumpHeightUnit: number;
  /** 起跳速度 unit/s（可由 sqrt(2·g·h) 推導） */
  jumpVelocityUnit: number;
  /** 提早放開跳躍鍵時的上升速度削減係數 */
  jumpCutMultiplier: number;
  /** Coyote Time：離地後仍可跳的緩衝毫秒 */
  coyoteTimeMs: number;
  /** Jump Buffer：落地前預按跳躍的保留毫秒 */
  jumpBufferMs: number;
  /** 跳躍頂點附近的重力倍率（<1 增加滯空感） */
  apexGravityMultiplier: number;
  /** 判定「接近頂點」的垂直速度門檻 unit/s（|vy| 小於此值時套用 apex 重力） */
  apexThresholdUnit: number;
  /** 下落時的重力倍率（>1 更俐落） */
  fallGravityMultiplier: number;
}

/** 空中衝刺 Dash 參數 */
export interface DashConfig {
  /** 衝刺距離 unit */
  dashDistanceUnit: number;
  /** 衝刺持續毫秒 */
  dashDurationMs: number;
  /** 衝刺冷卻毫秒 */
  dashCooldownMs: number;
  /** 空中可衝刺次數 */
  maxAirDashes: number;
}

/** 二段跳參數 */
export interface DoubleJumpConfig {
  /** 二段跳高度 unit */
  doubleJumpHeightUnit: number;
  /** 二段跳速度 unit/s */
  doubleJumpVelocityUnit: number;
  /** 空中可額外跳躍次數 */
  maxAirJumps: number;
}

/** 牆滑與牆跳參數 */
export interface WallConfig {
  /** 牆滑時最大下落速度 unit/s */
  wallSlideMaxFallSpeedUnit: number;
  /** 貼牆停滯毫秒 */
  wallStickMs: number;
  /** 牆跳水平速度 unit/s */
  wallJumpXVelocityUnit: number;
  /** 牆跳垂直速度 unit/s */
  wallJumpYVelocityUnit: number;
  /** 牆跳後鎖定水平輸入毫秒 */
  wallJumpLockMs: number;
}
