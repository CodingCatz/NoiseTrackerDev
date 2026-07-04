import type { AbilityId } from "./AbilityTypes";

/** Tile 行為類型 */
export type TileType =
  | "ground"
  | "one_way"
  | "spike"
  | "water"
  | "ladder"
  | "wall"
  | "breakable"
  | "goal";

/** Tile 定義 */
export interface TileDef {
  type: TileType;
  /** 是否可站立碰撞 */
  solid: boolean;
  /** 接觸是否致死 */
  deadly: boolean;
  /** placeholder 顯示色（0xRRGGBB） */
  color: number;
}

/** 互動物件類型 */
export type InteractableType =
  | "key"
  | "locked_door"
  | "switch"
  | "switch_door"
  | "checkpoint"
  | "ability_pickup"
  | "goal";

/** 關卡中單一物件的設定（座標以 unit 表示） */
export interface LevelObjectConfig {
  id: string;
  type: InteractableType;
  xUnit: number;
  yUnit: number;
  widthUnit?: number;
  heightUnit?: number;
  /** locked_door 需要的鑰匙 id */
  requiredKeyId?: string;
  /** ability_pickup 授予的能力 id */
  grantsAbilityId?: AbilityId;
  /** switch 對應的目標物件 id */
  targetId?: string;
}

/** 實心地形方塊（以左上角為基準，單位 unit） */
export interface SolidConfig {
  xUnit: number;
  yUnit: number;
  wUnit: number;
  hUnit: number;
}

/** 陷阱設定（接觸即死亡，單位 unit，以左下角為基準） */
export interface HazardConfig {
  type: "spike" | "saw";
  xUnit: number;
  yUnit: number;
  wUnit: number;
  hUnit: number;
}

/** 移動平台設定（於 (xUnit,yUnit) 與 (toXUnit,toYUnit) 兩點來回，座標為中心） */
export interface MovingPlatformConfig {
  xUnit: number;
  yUnit: number;
  wUnit: number;
  hUnit: number;
  toXUnit: number;
  toYUnit: number;
  /** 速度 unit/s（預設 1.5） */
  speedUnit?: number;
  /** 端點停留毫秒（預設 500） */
  waitMs?: number;
}

/** 單一關卡設定 */
export interface LevelConfig {
  id: string;
  name: string;
  /** 世界寬度 unit */
  worldWidthUnit: number;
  /** 世界高度 unit */
  worldHeightUnit: number;
  /** 玩家起始位置 unit */
  spawnUnit: { x: number; y: number };
  /** 實心地形（地面、平台、牆） */
  solids: SolidConfig[];
  /** 關卡互動物件 */
  objects: LevelObjectConfig[];
  /** 陷阱（選配） */
  hazards?: HazardConfig[];
  /** 移動平台（選配） */
  platforms?: MovingPlatformConfig[];
}
