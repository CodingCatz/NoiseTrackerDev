import Phaser from "phaser";
import { SceneKeys, TextureKeys } from "../config/sceneKeys";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { u } from "../utils/units";

/**
 * GameScene：Phase 1 僅顯示 FHD 背景、地面 placeholder 與玩家 placeholder，
 * 並平行啟動 UIScene。尚無任何移動或物理邏輯（留待 Phase 3 起實作）。
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1a1a24");

    this.drawGround();
    this.drawPlayerPlaceholder();

    // UI 以獨立 Scene 平行疊在遊戲畫面上方
    this.scene.launch(SceneKeys.UI);

    // 臨時導線：按 G 模擬抵達終點通關（僅為驗證 Scene 流程，非正式玩法）
    this.input.keyboard?.once("keydown-G", () => {
      this.scene.stop(SceneKeys.UI);
      this.scene.start(SceneKeys.GameOver);
    });
  }

  /** 沿畫面底部鋪一排地面 tile 作為 placeholder */
  private drawGround(): void {
    const tile = Math.round(u(0.5));
    const rows = 2;
    const cols = Math.ceil(GAME_WIDTH / tile);
    const startY = GAME_HEIGHT - rows * tile;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.add
          .image(col * tile, startY + row * tile, TextureKeys.Ground)
          .setOrigin(0, 0);
      }
    }
  }

  /** 放一個站在地面上的玩家 placeholder */
  private drawPlayerPlaceholder(): void {
    const tile = Math.round(u(0.5));
    const groundTop = GAME_HEIGHT - 2 * tile;
    // 玩家起始位置 x = 2 units，腳底貼齊地面
    this.add.image(u(2), groundTop, TextureKeys.Player).setOrigin(0.5, 1);
  }
}
