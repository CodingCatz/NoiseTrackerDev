import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";

/**
 * MenuScene：顯示標題與開始提示，按 Enter / Space 進入 GameScene。
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Menu);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#12141c");

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "Precision Platformer", {
        fontFamily: "sans-serif",
        fontSize: "72px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, "按 Enter 或 Space 開始", {
        fontFamily: "sans-serif",
        fontSize: "36px",
        color: "#9aa4d0",
      })
      .setOrigin(0.5);

    // 進入遊戲：Enter 或 Space
    this.input.keyboard?.once("keydown-ENTER", () => this.startGame());
    this.input.keyboard?.once("keydown-SPACE", () => this.startGame());
  }

  private startGame(): void {
    this.scene.start(SceneKeys.Game);
  }
}
