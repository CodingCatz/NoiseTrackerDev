/** 玩家狀態機狀態 */
export type PlayerState =
  | "idle"
  | "run"
  | "jump"
  | "fall"
  | "double_jump"
  | "dash"
  | "wall_slide"
  | "wall_jump"
  | "dead";

/** 玩家統計（無戰鬥版本：無 HP，僅保留統計欄位） */
export interface PlayerStats {
  /** 死亡次數（Celeste 式統計，選配顯示） */
  deaths: number;
}
