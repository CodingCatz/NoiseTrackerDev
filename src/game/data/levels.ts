import type { LevelConfig } from "../types/LevelTypes";

/**
 * MVP 關卡資料骨架。
 * Phase 2 只定義世界尺寸、起點與物件清單的「資料」，
 * 實際的地形生成與物件建立留待 Phase 9 的 LevelSystem。
 */
export const MVP_LEVEL: LevelConfig = {
  id: "mvp-01",
  name: "教學區",
  worldWidthUnit: 80, // 80 units = 8640 px
  worldHeightUnit: 20, // 20 units = 2160 px
  spawnUnit: { x: 2, y: 14 },
  objects: [
    { id: "goal-1", type: "goal", xUnit: 78, yUnit: 14 },
  ],
};

/** 全部關卡清單 */
export const LEVELS: readonly LevelConfig[] = [MVP_LEVEL] as const;
