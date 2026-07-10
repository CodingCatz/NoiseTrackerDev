import type { AbilityInfo, AbilityId } from "../types/AbilityTypes";

/** 能力道具（圓形）顯示顏色：不同能力不同色 */
export const ABILITY_PICKUP_COLORS: Record<AbilityId, number> = {
  double_jump: 0x4fa3ff, // 藍
  dash: 0xffd34e, // 黃
  wall_jump: 0x8affc0, // 綠
  wall_slide: 0x8affc0, // 綠（與牆跳同系）
  ground_pound: 0xff8a3a, // 橘
};

/**
 * 一張剪影圖示的貼圖鍵與內容最長邊（px，量測自素材）。
 * 純白 512×512 透明 PNG（public/assets/ui/skills/），全白便於 runtime 以 setTint 染色、setAlpha 調透明。
 * contentLongest 用來把不同姿勢／造型正規化到一致視覺大小。
 */
export interface IconMeta {
  key: string;
  contentLongest: number;
}

/** 動作技能人形剪影：ability id → 圖示（檔名為 {id}.png） */
export const SKILL_ICONS: Record<AbilityId, IconMeta> = {
  double_jump: { key: "icon-double-jump", contentLongest: 337 },
  dash: { key: "icon-dash", contentLongest: 379 },
  wall_jump: { key: "icon-wall-jump", contentLongest: 345 },
  wall_slide: { key: "icon-wall-slide", contentLongest: 424 },
  ground_pound: { key: "icon-ground-pound", contentLongest: 378 },
};

/** 基本跳圖示（觸控跳鈕用；非 AbilityId，檔名 jump.png） */
export const JUMP_ICON: IconMeta = { key: "icon-jump", contentLongest: 328 };

/** 鑰匙圖示（HUD／觸控 E 鈕／場上鑰匙道具共用，染金黃；contentLongest 量測自 key.png=385 寬向） */
export const KEY_ICON: IconMeta = { key: "icon-key", contentLongest: 385 };

/** 鑰匙染色（金黃） */
export const KEY_TINT = 0xffd34e;

/** HUD 上方置中顯示的能力（依取得順序） */
export const HUD_ABILITY_IDS: AbilityId[] = ["double_jump", "dash", "wall_slide"];

/** BootScene 要載入的剪影圖 */
export const ICON_PRELOAD: { key: string; file: string }[] = [
  { key: JUMP_ICON.key, file: "jump.png" },
  { key: SKILL_ICONS.double_jump.key, file: "double_jump.png" },
  { key: SKILL_ICONS.dash.key, file: "dash.png" },
  { key: SKILL_ICONS.wall_jump.key, file: "wall_jump.png" },
  { key: SKILL_ICONS.wall_slide.key, file: "wall_slide.png" },
  { key: KEY_ICON.key, file: "key.png" },
];

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
