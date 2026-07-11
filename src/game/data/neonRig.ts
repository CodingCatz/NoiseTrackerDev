/**
 * Neon cut-out 表演層的 rig 資料（v2 部件）。
 * 部件由 Codex 以「單張部件表」一次生成（部件間比例互鎖）→ 保色去背 → 切件，
 * 度量來自 public/assets/char/parts/v2/metrics.json：以「腳底中心」為 anchor (0,0)、y 向下為正（dy 為負=在腳上方）。
 * 尺度由 RIG_SCALE 常數固定——不交給 AI，確定性零飄移。
 */

/** 組裝後角色源高約 1050px；顯示高與 v1 視覺一致（≈156px、1.44u）→ 156/1050 */
export const RIG_SCALE = 0.1486;

/** 單一部件定義：貼圖、左上相對 anchor 的偏移、旋轉/縮放原點（0~1，相對部件圖） */
export interface RigPart {
  key: string;
  file: string;
  /** 部件圖左上角相對 anchor（腳底中心）的偏移（源像素） */
  dx: number;
  dy: number;
  /** sprite origin（旋轉/縮放軸心）：頭=頸、軀幹=下緣、臂=肩、腿=髖 */
  originX: number;
  originY: number;
  /** 繪製深度（小的先畫、被壓在下面）：後臂→腿→軀幹→前臂→頭 */
  depth: number;
}

export type RigPartName = "armL" | "legL" | "legR" | "torso" | "armR" | "head";

/** 部件表（v2 metrics；面向右：armL=後臂壓最底、armR=前臂蓋在軀幹上） */
export const NEON_PARTS: Record<RigPartName, RigPart> = {
  armL: { key: "rig2-armL", file: "neon_armL.png", dx: -218, dy: -590, originX: 0.5, originY: 0.06, depth: 0 },
  legL: { key: "rig2-legL", file: "neon_legL.png", dx: -155, dy: -264, originX: 0.5, originY: 0.06, depth: 1 },
  legR: { key: "rig2-legR", file: "neon_legR.png", dx: 4, dy: -263, originX: 0.5, originY: 0.06, depth: 2 },
  torso: { key: "rig2-torso", file: "neon_torso.png", dx: -176, dy: -630, originX: 0.5, originY: 1.0, depth: 3 },
  armR: { key: "rig2-armR", file: "neon_armR.png", dx: 118, dy: -590, originX: 0.5, originY: 0.06, depth: 4 },
  head: { key: "rig2-head", file: "neon_head.png", dx: -210, dy: -1050, originX: 0.55, originY: 0.95, depth: 5 },
};

/** BootScene 載入清單 */
export const RIG_PRELOAD = Object.values(NEON_PARTS).map((p) => ({ key: p.key, file: `char/parts/v2/${p.file}` }));
