import type { LevelConfig } from "../types/LevelTypes";

/**
 * MVP 關卡資料（80 × 20 units）。
 * 由左到右串起各能力的練習區：起點 → 二段跳階梯 → Dash 缺口 → 牆跳垂直區 → 高處走道 → 終點。
 * 地形以資料描述，實際生成由 LevelSystem 負責，GameScene 不寫死座標。
 */
export const MVP_LEVEL: LevelConfig = {
  id: "mvp-01",
  name: "教學區",
  worldWidthUnit: 80, // 8640 px
  worldHeightUnit: 20, // 2160 px
  spawnUnit: { x: 3, y: 15 },
  solids: [
    // 起點地面（x0..22）
    { xUnit: 0, yUnit: 18, wUnit: 22, hUnit: 2 },

    // 二段跳階梯（需二段跳往上）
    { xUnit: 23, yUnit: 16, wUnit: 3, hUnit: 0.5 },
    { xUnit: 27, yUnit: 14, wUnit: 3, hUnit: 0.5 },
    { xUnit: 31, yUnit: 12, wUnit: 3, hUnit: 0.5 },

    // 二段跳後落地（x34..40）
    { xUnit: 34, yUnit: 18, wUnit: 6, hUnit: 2 },

    // Dash 缺口（x40..44，寬 4 units）後的地面（x44..59）
    { xUnit: 44, yUnit: 18, wUnit: 15, hUnit: 2 },

    // 牆跳垂直區：左牆上半（下方留開口供從左側進入）＋右牆全高
    { xUnit: 54, yUnit: 4, wUnit: 1, hUnit: 9 }, // 左牆 y4..13
    { xUnit: 58, yUnit: 4, wUnit: 1, hUnit: 14 }, // 右牆 y4..18

    // 頂端橋（跨兩牆頂，x54..60）
    { xUnit: 54, yUnit: 3.5, wUnit: 6, hUnit: 0.5 },

    // 高處走道到終點（x60..80）
    { xUnit: 60, yUnit: 4, wUnit: 20, hUnit: 2 },
  ],
  objects: [
    { id: "goal-1", type: "goal", xUnit: 77, yUnit: 3 },
  ],
};

/**
 * 簡易測試關卡（40 × 14 units）：平坦地面 + 一個坑，用來測互動物件與 Checkpoint／重生。
 * 路線：起點 → checkpoint → 撿 key → 開 locked door → 跳過坑（掉下去→重生）→ 開關開 switch door → 終點。
 */
export const TEST_LEVEL: LevelConfig = {
  id: "test-01",
  name: "測試區",
  worldWidthUnit: 40,
  worldHeightUnit: 14,
  spawnUnit: { x: 2, y: 9 },
  solids: [
    { xUnit: 0, yUnit: 12, wUnit: 14, hUnit: 2 }, // 地面 A（x0..14）
    { xUnit: 17, yUnit: 12, wUnit: 23, hUnit: 2 }, // 地面 B（x17..40）；坑 x14..17
  ],
  objects: [
    { id: "cp1", type: "checkpoint", xUnit: 6, yUnit: 12 },
    { id: "key1", type: "key", xUnit: 9, yUnit: 11.6 },
    { id: "door1", type: "locked_door", xUnit: 12, yUnit: 12 },
    { id: "sw1", type: "switch", xUnit: 20, yUnit: 12, targetId: "swdoor1" },
    { id: "swdoor1", type: "switch_door", xUnit: 24, yUnit: 12 },
    { id: "goal1", type: "goal", xUnit: 38, yUnit: 11 },
  ],
  hazards: [
    // 地面 B 上的一排尖刺（x30..32）
    { type: "spike", xUnit: 30, yUnit: 12, wUnit: 2, hUnit: 0.5 },
  ],
  platforms: [
    // 水平移動平台，於 x27 與 x33 之間來回（供站上去測試穩定跟隨）
    { xUnit: 27, yUnit: 10.5, wUnit: 2, hUnit: 0.4, toXUnit: 33, toYUnit: 10.5, speedUnit: 1.5, waitMs: 500 },
  ],
};

/**
 * 教學關卡（50 × 20 units）：以「撿到能力才過得去」的順序串接。
 * 路線：起點撿【二段跳】→ 二段跳上高台撿【衝刺】→ 衝刺跨缺口撿【牆跳】→ 牆跳爬垂直通道 → 終點。
 * 地面與牆一律用格狀地板圖；能力道具一律圓形、不同能力不同色。
 * 地形高度／缺口寬度／通道皆對應能力設計：缺對應能力就過不去。
 */
export const TUTORIAL_LEVEL: LevelConfig = {
  id: "tutorial-01",
  name: "教學區",
  worldWidthUnit: 50,
  worldHeightUnit: 20,
  spawnUnit: { x: 3, y: 13 },
  solids: [
    // S1 起點地面（x0..20，地面高 y16）
    { xUnit: 0, yUnit: 16, wUnit: 20, hUnit: 4 },

    // S2 二段跳關卡：懸空高台（頂端 y13，比地面高 3u；單跳到不了、需二段跳。已由 3.5u 降一階）
    { xUnit: 14, yUnit: 13, wUnit: 6, hUnit: 0.5 }, // x14..20

    // S3 衝刺關卡：缺口 x20..26（6u，超出一般跳躍距離）後的落地平台
    { xUnit: 26, yUnit: 12.5, wUnit: 10, hUnit: 0.5 }, // x26..36

    // S4 牆跳關卡：垂直通道
    { xUnit: 36, yUnit: 16, wUnit: 10, hUnit: 4 }, // 通道底部地面 x36..46
    { xUnit: 38, yUnit: 5, wUnit: 1, hUnit: 8 }, // 左牆 y5..13（底部 y13..16 開口供進入）
    { xUnit: 42, yUnit: 5, wUnit: 1, hUnit: 11 }, // 右牆 y5..16
    { xUnit: 38, yUnit: 4.5, wUnit: 5, hUnit: 0.5 }, // 通道頂端橋 x38..43
    { xUnit: 43, yUnit: 4.5, wUnit: 7, hUnit: 0.5 }, // 高處走道到終點 x43..50
  ],
  objects: [
    // checkpoints（失敗時就近重生）
    { id: "cp1", type: "checkpoint", xUnit: 11, yUnit: 16 },
    { id: "cp2", type: "checkpoint", xUnit: 18, yUnit: 13 },
    { id: "cp3", type: "checkpoint", xUnit: 34, yUnit: 12.5 },
    // 能力道具（圓形，撿到才解鎖）
    { id: "ap_dj", type: "ability_pickup", grantsAbilityId: "double_jump", xUnit: 8, yUnit: 15 },
    { id: "ap_dash", type: "ability_pickup", grantsAbilityId: "dash", xUnit: 16, yUnit: 12 },
    { id: "ap_wj", type: "ability_pickup", grantsAbilityId: "wall_jump", xUnit: 31, yUnit: 11.5 },
    // 終點
    { id: "goal1", type: "goal", xUnit: 47, yUnit: 3.5 },
  ],
};

/** 全部關卡清單 */
export const LEVELS: readonly LevelConfig[] = [MVP_LEVEL, TEST_LEVEL, TUTORIAL_LEVEL] as const;
