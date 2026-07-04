import Phaser from "phaser";

// #region 解析度與單位制

/** 遊戲邏輯寬度（FHD，固定不變） */
export const GAME_WIDTH = 1920;

/** 遊戲邏輯高度（FHD，固定不變） */
export const GAME_HEIGHT = 1080;

/** 距離單位：1 unit = 畫面高度 10% = 108 px */
export const UNIT = GAME_HEIGHT * 0.1; // 108 px

// #endregion 解析度與單位制

// #region Phaser 設定工廠

/**
 * 建立 Phaser 遊戲設定。
 * 邏輯解析度固定 1920×1080，實際顯示交給 Scale Manager 以 FIT 等比縮放，
 * 手機可 letterbox，遊戲邏輯座標不因螢幕比例改變。
 *
 * @param scenes 要註冊的 Scene 清單（Phase 0 尚無 Scene，之後階段補上）
 */
export function createGameConfig(
  scenes: Phaser.Types.Scenes.SceneType[] = []
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#1a1a24",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    scene: scenes,
  };
}

// #endregion Phaser 設定工廠
