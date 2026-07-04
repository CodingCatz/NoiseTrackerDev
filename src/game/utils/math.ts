/** 將數值限制在 [min, max] 區間 */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * 將 current 朝 target 移動，單次最多變化 maxDelta，不會超過 target。
 * 用於加速／減速時平滑逼近目標速度。
 */
export function moveTowards(current: number, target: number, maxDelta: number): number {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}
