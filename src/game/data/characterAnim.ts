/**
 * 角色 Neon 逐幀動畫的幀表契約。
 * 與共享 skill `sprite-animation-sheets` 及派工工單的規格一致：
 * 每 clip 一條橫向 strip PNG（public/assets/char/），格寬 = CHAR_CELL，幀由左到右。
 */

/** 每幀畫布邊長（strip 以此切格：frameWidth = frameHeight = CHAR_CELL） */
export const CHAR_CELL = 256;

/** 腳底基線在 cell 內的 y；表演層 origin.y = CHAR_BASELINE / CHAR_CELL，使基線對齊碰撞體底部 */
export const CHAR_BASELINE = 232;

/** 表演層縮放（cell → 世界像素）；真素材到位後依實際內容高度校正 */
export const PRESENTATION_SCALE = 0.72;

/** 單一動畫 clip 定義 */
export interface AnimClip {
  /** Phaser 動畫鍵 */
  key: string;
  /** spritesheet 貼圖鍵（= 檔名去副檔名） */
  texture: string;
  /** 檔名（public/assets/char/ 下） */
  file: string;
  /** 幀數 */
  frames: number;
  /** 播放幀率 */
  fps: number;
  /** 是否循環 */
  loop: boolean;
}

/** Neon 各動作 clip（檔名／幀數／循環與 sprite-animation-sheets 契約、派工工單一致） */
export const NEON_CLIPS: Record<
  "idle" | "turn" | "run" | "dash" | "jump_rise" | "jump_fall" | "land" | "wall_slide",
  AnimClip
> = {
  idle: { key: "neon-idle", texture: "neon_idle", file: "neon_idle.png", frames: 2, fps: 4, loop: true },
  turn: { key: "neon-turn", texture: "neon_turn", file: "neon_turn.png", frames: 2, fps: 12, loop: false },
  run: { key: "neon-run", texture: "neon_run", file: "neon_run.png", frames: 4, fps: 12, loop: true },
  dash: { key: "neon-dash", texture: "neon_dash", file: "neon_dash.png", frames: 4, fps: 16, loop: false },
  jump_rise: { key: "neon-jump-rise", texture: "neon_jump_rise", file: "neon_jump_rise.png", frames: 1, fps: 1, loop: true },
  jump_fall: { key: "neon-jump-fall", texture: "neon_jump_fall", file: "neon_jump_fall.png", frames: 1, fps: 1, loop: true },
  land: { key: "neon-land", texture: "neon_land", file: "neon_land.png", frames: 3, fps: 16, loop: false },
  wall_slide: { key: "neon-wall-slide", texture: "neon_wall_slide", file: "neon_wall_slide.png", frames: 1, fps: 1, loop: true },
};
