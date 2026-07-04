import Phaser from "phaser";
import "./styles.css";
import { GAME_WIDTH, GAME_HEIGHT, UNIT, createGameConfig } from "./game/config/gameConfig";
import { pxToUnit } from "./game/utils/units";

/**
 * Phase 0 佔位場景：僅用來確認 FHD 舞台與等比縮放正常，不含任何遊戲玩法。
 * 正式的 BootScene / MenuScene / GameScene 等會在 Phase 1 建立並取代此場景。
 */
class PlaceholderScene extends Phaser.Scene {
  constructor() {
    super("Placeholder");
  }

  create(): void {
    // 邏輯畫面邊框，用來目視確認 1920×1080 舞台完整置中
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT)
      .setStrokeStyle(4, 0x3355ff);

    // 中央 unit 參考方塊：邊長 1 unit = 108 px
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, UNIT, UNIT, 0x3355ff, 0.35);

    const widthInUnit = pxToUnit(GAME_WIDTH).toFixed(2);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, "Precision Platformer", {
        fontFamily: "sans-serif",
        fontSize: "64px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 120,
        `FHD ${GAME_WIDTH}×${GAME_HEIGHT}  |  1 unit = ${UNIT}px  |  寬度 ${widthInUnit} units`,
        {
          fontFamily: "sans-serif",
          fontSize: "32px",
          color: "#9aa4d0",
        }
      )
      .setOrigin(0.5);
  }
}

new Phaser.Game(createGameConfig([PlaceholderScene]));
