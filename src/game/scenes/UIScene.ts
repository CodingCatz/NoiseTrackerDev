import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { GAME_WIDTH } from "../config/gameConfig";

/**
 * UIScene：平行疊在 GameScene 上的 HUD。
 * Phase 1 僅顯示 key count、能力狀態、死亡次數的 placeholder 文字，
 * 實際數值綁定留待後續階段接上 GameState。
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.UI);
  }

  create(): void {
    const pad = 32;

    this.add.text(pad, pad, "Keys: 0", {
      fontFamily: "sans-serif",
      fontSize: "32px",
      color: "#ffffff",
    });

    this.add.text(pad, pad + 48, "Abilities: -", {
      fontFamily: "sans-serif",
      fontSize: "28px",
      color: "#9aa4d0",
    });

    this.add
      .text(GAME_WIDTH - pad, pad, "Deaths: 0", {
        fontFamily: "sans-serif",
        fontSize: "28px",
        color: "#9aa4d0",
      })
      .setOrigin(1, 0);

    this.add
      .text(GAME_WIDTH - pad, pad + 44, "按 G 模擬通關", {
        fontFamily: "sans-serif",
        fontSize: "22px",
        color: "#5a627e",
      })
      .setOrigin(1, 0);
  }
}
