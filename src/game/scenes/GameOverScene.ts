import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";

/**
 * GameOverScene：通關（Clear）結果畫面。
 * 本專案無 Game Over（死亡只重生），此場景僅在抵達終點時顯示，按 R 重新開始。
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.GameOver);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0e1730");

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "CLEAR!", {
        fontFamily: "sans-serif",
        fontSize: "96px",
        color: "#7dffa8",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "按 R 重新開始", {
        fontFamily: "sans-serif",
        fontSize: "36px",
        color: "#9aa4d0",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-R", () => {
      this.scene.start(SceneKeys.Menu);
    });
  }
}
