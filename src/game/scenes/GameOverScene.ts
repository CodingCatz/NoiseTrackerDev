import Phaser from "phaser";
import { SceneKeys } from "../config/sceneKeys";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";

/** 通關畫面接收的資料 */
interface GameOverData {
  deaths?: number;
  elapsedMs?: number;
}

/**
 * GameOverScene：通關（Clear）結果畫面。
 * 本專案無 Game Over（死亡只重生），此場景僅在抵達終點時顯示，顯示死亡次數與耗時。
 * 按 R 重新開始：直接重啟 GameScene，Phaser 會關閉本場景並讓 GameScene 重新建立所有系統，
 * 舊狀態（registry 由新 GameState／AbilitySystem 重置）與舊事件監聽（各場景 SHUTDOWN 時解除）皆清乾淨。
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.GameOver);
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor("#0e1730");

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, "CLEAR!", {
        fontFamily: "sans-serif",
        fontSize: "96px",
        color: "#7dffa8",
      })
      .setOrigin(0.5);

    const deaths = data?.deaths ?? 0;
    const seconds = Math.floor((data?.elapsedMs ?? 0) / 1000);
    const timeText = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `死亡次數：${deaths}    耗時：${timeText}`, {
        fontFamily: "sans-serif",
        fontSize: "40px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, "按 R 重新開始", {
        fontFamily: "sans-serif",
        fontSize: "36px",
        color: "#9aa4d0",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-R", () => {
      this.scene.start(SceneKeys.Game);
    });
  }
}
