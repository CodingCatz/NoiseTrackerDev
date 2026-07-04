import type { AbilityId } from "./AbilityTypes";

/** 全域遊戲狀態（由 GameState 系統管理，Phase 16 接上） */
export interface GameStateData {
  /** 死亡次數 */
  deaths: number;
  /** 目前持有鑰匙數 */
  keyCount: number;
  /** 已解鎖能力 */
  unlockedAbilities: AbilityId[];
  /** 目前啟用的 checkpoint id（null 表示尚未啟用） */
  checkpointId: string | null;
  /** 目前區域名稱 */
  currentArea: string;
  /** 是否已通關 */
  isVictory: boolean;
}
