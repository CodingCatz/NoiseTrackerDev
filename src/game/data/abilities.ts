import type { AbilityInfo } from "../types/AbilityTypes";

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
