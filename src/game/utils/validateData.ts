import {
  PLAYER_PHYSICS,
  DOUBLE_JUMP_CONFIG,
  DASH_CONFIG,
  WALL_CONFIG,
} from "../data/playerPhysics";
import { LEVELS } from "../data/levels";

/**
 * 檢查資料檔數值是否合理，回傳警告訊息清單（空陣列代表全部通過）。
 * 供 BootScene 於啟動時呼叫，及早在 console 發現手感數值填錯。
 */
export function validateGameData(): string[] {
  const warnings: string[] = [];

  const p = PLAYER_PHYSICS;

  // 基本正值檢查
  const mustBePositive: Array<[string, number]> = [
    ["maxRunSpeedUnit", p.maxRunSpeedUnit],
    ["gravityUnit", p.gravityUnit],
    ["maxFallSpeedUnit", p.maxFallSpeedUnit],
    ["jumpHeightUnit", p.jumpHeightUnit],
    ["jumpVelocityUnit", p.jumpVelocityUnit],
  ];
  for (const [name, value] of mustBePositive) {
    if (!(value > 0)) warnings.push(`PLAYER_PHYSICS.${name} 應為正數，目前為 ${value}`);
  }

  // 跳躍速度應與 sqrt(2·g·h) 相符（容許 10% 誤差）
  const expectedJumpV = Math.sqrt(2 * p.gravityUnit * p.jumpHeightUnit);
  if (Math.abs(p.jumpVelocityUnit - expectedJumpV) / expectedJumpV > 0.1) {
    warnings.push(
      `jumpVelocityUnit=${p.jumpVelocityUnit} 與 sqrt(2·g·h)≈${expectedJumpV.toFixed(2)} 落差過大`
    );
  }

  // 二段跳速度合理性
  const expectedDoubleV = Math.sqrt(
    2 * p.gravityUnit * DOUBLE_JUMP_CONFIG.doubleJumpHeightUnit
  );
  if (
    Math.abs(DOUBLE_JUMP_CONFIG.doubleJumpVelocityUnit - expectedDoubleV) /
      expectedDoubleV >
    0.1
  ) {
    warnings.push(
      `doubleJumpVelocityUnit=${DOUBLE_JUMP_CONFIG.doubleJumpVelocityUnit} 與 sqrt(2·g·h)≈${expectedDoubleV.toFixed(2)} 落差過大`
    );
  }

  // 容錯時間非負
  if (p.coyoteTimeMs < 0) warnings.push("coyoteTimeMs 不可為負");
  if (p.jumpBufferMs < 0) warnings.push("jumpBufferMs 不可為負");

  // 削減係數應在 (0, 1]
  if (p.jumpCutMultiplier <= 0 || p.jumpCutMultiplier > 1) {
    warnings.push(`jumpCutMultiplier 應介於 (0, 1]，目前為 ${p.jumpCutMultiplier}`);
  }

  // Dash / Wall 正值
  if (!(DASH_CONFIG.dashDistanceUnit > 0)) warnings.push("dashDistanceUnit 應為正數");
  if (!(DASH_CONFIG.dashDurationMs > 0)) warnings.push("dashDurationMs 應為正數");
  if (!(WALL_CONFIG.wallSlideMaxFallSpeedUnit > 0)) {
    warnings.push("wallSlideMaxFallSpeedUnit 應為正數");
  }

  // 牆滑下滑速度不應超過一般最大下落速度
  if (WALL_CONFIG.wallSlideMaxFallSpeedUnit > p.maxFallSpeedUnit) {
    warnings.push("wallSlideMaxFallSpeedUnit 超過 maxFallSpeedUnit，牆滑會比自由落體快");
  }

  // 關卡資料檢查
  for (const level of LEVELS) {
    if (level.worldWidthUnit <= 0 || level.worldHeightUnit <= 0) {
      warnings.push(`關卡 ${level.id} 世界尺寸不合法`);
    }
    const { x, y } = level.spawnUnit;
    if (x < 0 || x > level.worldWidthUnit || y < 0 || y > level.worldHeightUnit) {
      warnings.push(`關卡 ${level.id} 起始位置超出世界範圍`);
    }
  }

  return warnings;
}

/**
 * 執行驗證並輸出到 console。回傳是否全部通過。
 */
export function runDataValidation(): boolean {
  const warnings = validateGameData();
  if (warnings.length === 0) {
    console.info("[validateData] 資料檢查通過");
    return true;
  }
  console.warn(`[validateData] 發現 ${warnings.length} 項問題：`);
  for (const w of warnings) console.warn(`  - ${w}`);
  return false;
}
