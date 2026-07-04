import type { AbilityInfo, AbilityId } from "../types/AbilityTypes";

/** 能力道具（圓形）顯示顏色：不同能力不同色 */
export const ABILITY_PICKUP_COLORS: Record<AbilityId, number> = {
  double_jump: 0x4fa3ff, // 藍
  dash: 0xffd34e, // 黃
  wall_jump: 0x8affc0, // 綠
  wall_slide: 0x8affc0, // 綠（與牆跳同系）
  ground_pound: 0xff8a3a, // 橘
};

/** 能力清單（給 UI 顯示與 ability pickup 授予使用） */
export const ABILITIES: readonly AbilityInfo[] = [
  {
    id: "double_jump",
    name: "Double Jump",
    description: "滯空時可再跳一次。",
  },
  {
    id: "dash",
    name: "Air Dash",
    description: "空中水平或斜向衝刺。",
  },
  {
    id: "wall_slide",
    name: "Wall Slide",
    description: "貼牆時以較慢速度下滑。",
  },
  {
    id: "wall_jump",
    name: "Wall Jump",
    description: "從牆面彈跳以攀登垂直通道。",
  },
] as const;
