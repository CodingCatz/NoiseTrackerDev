/** 相機參數（跟隨平滑、死區、震動）。要調鏡頭手感只改這裡。 */
export const CAMERA_CONFIG = {
  /** 水平跟隨平滑係數（越小越慢） */
  followLerpX: 0.08,
  /** 垂直跟隨平滑係數 */
  followLerpY: 0.08,
  /** 死區寬度 unit（玩家在死區內移動不動鏡頭） */
  deadZoneWidthUnit: 4,
  /** 死區高度 unit */
  deadZoneHeightUnit: 2.5,
  /** 小震動：時長 ms / 強度 */
  smallShakeMs: 100,
  smallShakeIntensity: 0.003,
  /** 大震動：時長 ms / 強度 */
  largeShakeMs: 250,
  largeShakeIntensity: 0.008,
  /** 落地重擊震動的觸發門檻：落地前下落速度 unit/s */
  hardLandingVyUnit: 10,
} as const;
