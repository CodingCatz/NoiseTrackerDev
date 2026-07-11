/**
 * Neon cut-out 表演層的 rig 資料。
 * 部件由 neon_idle.png 幀 0 離線切出（public/assets/char/parts/，帶羽化重疊藏縫），
 * 座標以「腳底中心」為 anchor (0,0)、y 向上為負，數值來自切件腳本量測。
 * 尺度由 RIG_SCALE 常數固定——不交給 AI，確定性零飄移。
 */

/** 表演層縮放（源像素 → 世界像素）；源角色高 216px × 0.72 ≈ 156px，與舊 strip 視覺一致 */
export const RIG_SCALE = 0.72;

/** 單一部件定義：貼圖、左上相對 anchor 的偏移、旋轉/縮放原點（0~1，相對部件圖） */
export interface RigPart {
  key: string;
  file: string;
  /** 部件圖左上角相對 anchor（腳底中心）的偏移（源像素） */
  dx: number;
  dy: number;
  /** sprite origin（旋轉/縮放軸心）：頭=頸、軀幹=下緣、腿=髖 */
  originX: number;
  originY: number;
  /** 繪製深度（小的先畫、被壓在下面） */
  depth: number;
}

/** 部件表（度量來自切件腳本輸出） */
export const NEON_PARTS: Record<"head" | "torso" | "legL" | "legR", RigPart> = {
  // 腿：origin 在髖（頂端中心），rotation 擺腿
  legL: { key: "rig-neon-legL", file: "neon_legL.png", dx: -34, dy: -57, originX: 0.5, originY: 0.08, depth: 1 },
  legR: { key: "rig-neon-legR", file: "neon_legR.png", dx: 6, dy: -57, originX: 0.5, originY: 0.08, depth: 2 },
  // 軀幹（衣/裙）：origin 在下緣中心，scaleY 呼吸
  torso: { key: "rig-neon-torso", file: "neon_torso.png", dx: -59, dy: -126, originX: 0.5, originY: 1.0, depth: 3 },
  // 頭（含髮）：origin 在頸（約 92% 高處），微轉帶出髮絲跟隨感
  head: { key: "rig-neon-head", file: "neon_head.png", dx: -59, dy: -217, originX: 0.5, originY: 0.92, depth: 4 },
};

/** BootScene 載入清單 */
export const RIG_PRELOAD = Object.values(NEON_PARTS).map((p) => ({ key: p.key, file: `char/parts/${p.file}` }));
