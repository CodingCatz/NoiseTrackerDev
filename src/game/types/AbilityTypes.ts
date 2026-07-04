/** 可解鎖移動能力的識別碼 */
export type AbilityId =
  | "double_jump"
  | "dash"
  | "wall_slide"
  | "wall_jump"
  | "ground_pound";

/** 能力說明（給 UI 與能力拾取使用） */
export interface AbilityInfo {
  id: AbilityId;
  name: string;
  description: string;
}

/** 執行期能力狀態 */
export interface AbilityState {
  /** 各能力是否已解鎖 */
  unlocked: Record<AbilityId, boolean>;
  /** 本次滯空已用的額外跳躍次數 */
  airJumpsUsed: number;
  /** 本次滯空已用的衝刺次數 */
  airDashesUsed: number;
}
