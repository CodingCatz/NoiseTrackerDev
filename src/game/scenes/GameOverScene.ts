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
 * 重來：點「重來」鈕或按 R（桌機）皆可，直接重啟 GameScene，Phaser 會關閉本場景並讓 GameScene
 * 重新建立所有系統，舊狀態（registry 由新 GameState／AbilitySystem 重置）與舊事件監聽
 *（各場景 SHUTDOWN 時解除）皆清乾淨。觸控裝置無 R 鍵，故以按鈕為主要入口。
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

    this.buildRestartButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130);

    // 桌機快捷：R 直接重來（觸控裝置無鍵盤，靠按鈕）
    this.input.keyboard?.once("keydown-R", () => this.restart());
  }

  /** 重來鈕：極簡白細框膠囊 + 文字，點按（觸控／滑鼠）重啟 GameScene */
  private buildRestartButton(x: number, y: number): void {
    const w = 300;
    const h = 96;

    const frame = this.add
      .rectangle(x, y, w, h, 0xffffff, 0)
      .setStrokeStyle(3, 0xffffff, 0.7)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, "重來", {
        fontFamily: "sans-serif",
        fontSize: "44px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(x, y + h, "點按重來（桌機可按 R）", {
        fontFamily: "sans-serif",
        fontSize: "24px",
        color: "#5a627e",
      })
      .setOrigin(0.5);
    hint.setY(y + h / 2 + 34);

    // hover / press 視覺回饋
    frame.on("pointerover", () => frame.setFillStyle(0xffffff, 0.12));
    frame.on("pointerout", () => frame.setFillStyle(0xffffff, 0));
    frame.on("pointerdown", () => frame.setFillStyle(0xffffff, 0.22));
    frame.on("pointerup", () => this.restart());
  }

  /** 重啟遊戲場景 */
  private restart(): void {
    this.scene.start(SceneKeys.Game);
  }
}
