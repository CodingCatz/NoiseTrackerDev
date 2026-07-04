import Phaser from "phaser";
import { SceneKeys, TextureKeys } from "../config/sceneKeys";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import { u } from "../utils/units";
import { Player } from "../entities/Player";
import { PlayerController } from "../systems/PlayerController";

/**
 * GameScene：組裝玩家與地面並驅動控制器。
 * Phase 3 加入 Player 與 PlayerController，支援左右移動；地面為 placeholder，
 * 玩家會落地不穿地。跳躍與正式關卡留待後續 Phase。
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private controller!: PlayerController;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1a1a24");

    const ground = this.drawGround();
    this.spawnPlayer(ground);

    // UI 以獨立 Scene 平行疊在遊戲畫面上方
    this.scene.launch(SceneKeys.UI);

    // 臨時導線：按 G 模擬抵達終點通關（僅為驗證 Scene 流程，非正式玩法）
    this.input.keyboard?.once("keydown-G", () => {
      this.scene.stop(SceneKeys.UI);
      this.scene.start(SceneKeys.GameOver);
    });
  }

  update(_time: number, delta: number): void {
    this.controller.update(delta);
  }

  /**
   * 沿畫面底部鋪一排地面 tile placeholder，並回傳一個涵蓋地面的靜態碰撞體。
   */
  private drawGround(): Phaser.GameObjects.Rectangle {
    const tile = Math.round(u(0.5));
    const rows = 2;
    const cols = Math.ceil(GAME_WIDTH / tile);
    const startY = GAME_HEIGHT - rows * tile;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.add.image(col * tile, startY + row * tile, TextureKeys.Ground).setOrigin(0, 0);
      }
    }

    // 靜態碰撞體：涵蓋整排地面，玩家與之碰撞不會穿透
    const groundH = rows * tile;
    const ground = this.add.rectangle(GAME_WIDTH / 2, startY + groundH / 2, GAME_WIDTH, groundH);
    this.physics.add.existing(ground, true);
    return ground;
  }

  /** 產生玩家並與地面建立碰撞、掛上控制器 */
  private spawnPlayer(ground: Phaser.GameObjects.Rectangle): void {
    // 起始位置 x = 2 units，稍高於地面讓其落下（示範不穿地）
    this.player = new Player(this, u(2), GAME_HEIGHT - u(4));
    this.physics.add.collider(this.player, ground);
    this.controller = new PlayerController(this, this.player);
  }
}
