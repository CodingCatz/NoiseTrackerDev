import { UNIT } from "../config/gameConfig";

// #region 單位換算

/**
 * 將 unit 轉為像素。
 * @param value 以 unit 為單位的距離
 * @returns 對應的像素值（1 unit = 108 px）
 */
export function u(value: number): number {
  return value * UNIT;
}

/**
 * 將像素轉回 unit。
 * @param value 像素值
 * @returns 對應的 unit 值
 */
export function pxToUnit(value: number): number {
  return value / UNIT;
}

// #endregion 單位換算
